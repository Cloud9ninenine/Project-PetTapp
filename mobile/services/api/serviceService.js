import apiClient from '@config/api';
import cacheManager from '@utils/cacheManager';
import requestDeduplicator from '@utils/requestDeduplicator';

/**
 * Service API - Handles all service-related API calls
 */

/**
 * Fetch services from different categories for carousel display with PARALLEL requests
 * @param {Object} location - User's current location {latitude, longitude}
 * @param {Array} categories - Array of category names to fetch
 * @returns {Promise<Array>} Array of carousel service objects
 */
export const fetchCarouselServices = async (location = null, categories = ['veterinary', 'grooming', 'boarding', 'training', 'daycare', 'emergency', 'consultation']) => {
  try {
    // Check cache first
    const cacheKey = `carousel_services_${location ? `${location.latitude}_${location.longitude}` : 'no_location'}`;
    const cachedData = cacheManager.get(cacheKey);
    if (cachedData) {
      if (__DEV__) {
        console.log('📦 Using cached carousel services');
      }
      return cachedData;
    }

    const usedServiceIds = new Set();

    // OPTIMIZATION: Use Promise.all for parallel requests instead of sequential for loop
    // This reduces loading time from ~7 sequential requests to ~1-2 parallel batch
    const categoryRequestsPromises = categories.map(category =>
      requestDeduplicator.execute(
        'GET',
        '/services',
        () => apiClient.get('/services', {
          params: {
            category,
            limit: 1,
          },
        }),
        { category, limit: 1 }
      ).catch(error => {
        console.error(`Error fetching ${category} service:`, error);
        return null; // Return null on error to not break Promise.all
      })
    );

    // Wait for all category requests in parallel
    const categoryResponses = await Promise.all(categoryRequestsPromises);

    // Process responses
    const carouselData = [];
    categoryResponses.forEach((response) => {
      if (response?.data?.success && response.data.data.length > 0) {
        const service = response.data.data[0];
        if (!usedServiceIds.has(service._id)) {
          carouselData.push({
            id: service._id,
            serviceId: service._id,
            image: service.imageUrl ? { uri: service.imageUrl } : null,
            title: service.name,
            subtitle: service.businessId?.businessName || 'Pet Service',
            category: service.category,
            isDefault: false,
          });
          usedServiceIds.add(service._id);
        }
      }
    });

    // Optionally add nearby services if location is available
    if (location && carouselData.length < 6) {
      try {
        const nearbyResponse = await requestDeduplicator.execute(
          'GET',
          '/services',
          () => apiClient.get('/services', {
            params: {
              latitude: location.latitude,
              longitude: location.longitude,
              radius: 10,
              limit: 3,
            },
          }),
          { latitude: location.latitude, longitude: location.longitude, radius: 10, limit: 3 }
        );

        if (nearbyResponse.data.success && nearbyResponse.data.data.length > 0) {
          nearbyResponse.data.data.forEach((service) => {
            if (!usedServiceIds.has(service._id) && carouselData.length < 8) {
              carouselData.push({
                id: service._id,
                serviceId: service._id,
                image: service.imageUrl ? { uri: service.imageUrl } : null,
                title: service.name,
                subtitle: service.businessId?.businessName || 'Pet Service',
                category: service.category,
                isDefault: false,
              });
              usedServiceIds.add(service._id);
            }
          });
        }
      } catch (error) {
        console.error('Error fetching nearby services for carousel:', error);
      }
    }

    // Cache the result for 5 minutes
    cacheManager.set(cacheKey, carouselData, 300000);

    return carouselData;
  } catch (error) {
    console.error('Error fetching carousel services:', error);
    throw error;
  }
};

/**
 * Search services by query string
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} Array of service objects
 */
export const searchServices = async (query, limit = 20) => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    // Check cache first
    const cacheKey = `search_services_${query.trim()}_${limit}`;
    const cachedData = cacheManager.get(cacheKey);
    if (cachedData) {
      if (__DEV__) {
        console.log('📦 Using cached search results');
      }
      return cachedData;
    }

    const response = await apiClient.get('/services', {
      params: {
        search: query.trim(),
        limit,
      },
    });

    if (response.data.success) {
      const data = response.data.data || [];
      // Cache for 5 minutes
      cacheManager.set(cacheKey, data, 300000);
      return data;
    }

    return [];
  } catch (error) {
    console.error('Error searching services:', error);
    throw error;
  }
};

/**
 * Fetch nearby services based on location
 * @param {Object} location - User's location {latitude, longitude}
 * @param {number} radius - Search radius in km (default: 10)
 * @param {number} limit - Maximum number of results (default: 6)
 * @returns {Promise<Array>} Array of nearby service objects
 */
export const fetchNearbyServices = async (location = null, radius = 10, limit = 6) => {
  try {
    // Check cache first
    let cacheKey = null;
    if (location) {
      cacheKey = `nearby_services_${location.latitude}_${location.longitude}_${radius}_${limit}`;
      const cachedData = cacheManager.get(cacheKey);
      if (cachedData) {
        if (__DEV__) {
          console.log('📦 Using cached nearby services');
        }
        return cachedData;
      }
    }

    const params = { limit };

    // Add location if available
    if (location) {
      params.latitude = location.latitude;
      params.longitude = location.longitude;
      params.radius = radius;
    }

    const response = await apiClient.get('/services', { params });

    if (response.data.success) {
      const data = response.data.data || [];
      // Cache for 3 minutes (shorter TTL for location-based data)
      if (cacheKey) {
        cacheManager.set(cacheKey, data, 180000);
      }
      return data;
    }

    return [];
  } catch (error) {
    console.error('Error fetching nearby services:', error);
    throw error;
  }
};

/**
 * Fetch service details by ID
 * @param {string} serviceId - Service ID
 * @returns {Promise<Object>} Service details object with business information
 */
export const fetchServiceById = async (serviceId) => {
  if (!serviceId) {
    throw new Error('Service ID is required');
  }

  try {
    const response = await apiClient.get(`/services/${serviceId}`);

    if (response.status === 200 && response.data.success) {
      const service = response.data.data;

      // Extract business data
      // Always fetch full business data from /businesses endpoint to get images attached
      let businessData = null;
      const businessId = typeof service.businessId === 'object'
        ? service.businessId._id
        : service.businessId;

      if (businessId) {
        try {
          const businessResponse = await apiClient.get(`/businesses/${businessId}`);
          if (businessResponse.status === 200 && businessResponse.data.success) {
            const fullBusinessData = businessResponse.data.data;
            // Extract only necessary fields to reduce data overhead
            businessData = {
              _id: fullBusinessData._id,
              name: fullBusinessData.businessName,
              images: fullBusinessData.images, // Contains logo and businessImages
              address: fullBusinessData.address,
              contactNumber: fullBusinessData.contactInfo?.phone || fullBusinessData.contactInfo?.phoneNumber || 'No contact available',
              contactInfo: fullBusinessData.contactInfo,
              businessType: fullBusinessData.businessType,
              ratings: fullBusinessData.ratings,
              businessHours: fullBusinessData.businessHours,
              isActive: fullBusinessData.isActive,
              isVerified: fullBusinessData.isVerified,
            };
          }
        } catch (businessError) {
          console.warn('Could not fetch business data:', businessError);
          // Fallback to populated data if available
          if (typeof service.businessId === 'object') {
            const businessInfo = service.businessId;
            businessData = {
              _id: businessInfo._id,
              name: businessInfo.businessName,
              images: businessInfo.images,
              address: businessInfo.address,
              contactNumber: businessInfo.contactInfo?.phone || businessInfo.contactInfo?.phoneNumber || 'No contact available',
              contactInfo: businessInfo.contactInfo,
              businessType: businessInfo.businessType,
              ratings: businessInfo.ratings,
              businessHours: businessInfo.businessHours,
              isActive: businessInfo.isActive,
              isVerified: businessInfo.isVerified,
            };
          }
        }
      }

      return {
        service,
        businessData,
      };
    }

    throw new Error('Failed to fetch service details');
  } catch (error) {
    console.error('Error fetching service by ID:', error);
    throw error;
  }
};

/**
 * Fetch services by category
 * @param {string} category - Service category
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} Array of service objects
 */
export const fetchServicesByCategory = async (category, limit = 20) => {
  try {
    // Check cache first
    const cacheKey = `services_category_${category}_${limit}`;
    const cachedData = cacheManager.get(cacheKey);
    if (cachedData) {
      if (__DEV__) {
        console.log('📦 Using cached category services');
      }
      return cachedData;
    }

    const response = await apiClient.get('/services', {
      params: {
        category,
        limit,
      },
    });

    if (response.data.success) {
      const data = response.data.data || [];
      // Cache for 5 minutes
      cacheManager.set(cacheKey, data, 300000);
      return data;
    }

    return [];
  } catch (error) {
    console.error(`Error fetching ${category} services:`, error);
    throw error;
  }
};

/**
 * Fetch services by business ID
 * @param {string} businessId - Business ID
 * @param {Object} params - Query parameters (page, limit)
 * @returns {Promise<Object>} Services response with pagination
 */
export const fetchServicesByBusiness = async (businessId, params = { page: 1, limit: 20 }) => {
  if (!businessId) {
    throw new Error('Business ID is required');
  }

  try {
    const response = await apiClient.get(`/services/business/${businessId}`, { params });

    if (response.data.success) {
      return response.data;
    }

    throw new Error('Failed to fetch services');
  } catch (error) {
    console.error('Error fetching services by business:', error);
    throw error;
  }
};

/**
 * Create a new service with optional image upload
 * @param {Object} serviceData - Service data (FormData object with all required fields)
 * @returns {Promise<Object>} Created service object
 */
export const createService = async (serviceData) => {
  try {
    const response = await apiClient.post('/services', serviceData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.status === 201 && response.data.success) {
      return response.data.data;
    }

    throw new Error(response.data?.message || 'Failed to create service');
  } catch (error) {
    console.error('Error creating service:', error);
    throw error;
  }
};

/**
 * Update an existing service with optional image upload
 * @param {string} serviceId - Service ID
 * @param {Object} serviceData - Service data (FormData object with fields to update)
 * @returns {Promise<Object>} Updated service object
 */
export const updateService = async (serviceId, serviceData) => {
  if (!serviceId) {
    throw new Error('Service ID is required');
  }

  try {
    const response = await apiClient.put(`/services/${serviceId}`, serviceData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.status === 200 && response.data.success) {
      return response.data.data;
    }

    throw new Error(response.data?.message || 'Failed to update service');
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
};

/**
 * Delete a service (soft delete - sets isActive to false)
 * @param {string} serviceId - Service ID
 * @returns {Promise<void>}
 */
export const deleteService = async (serviceId) => {
  if (!serviceId) {
    throw new Error('Service ID is required');
  }

  try {
    const response = await apiClient.delete(`/services/${serviceId}`);

    if (response.status === 200 && response.data.success) {
      return;
    }

    throw new Error(response.data?.message || 'Failed to delete service');
  } catch (error) {
    console.error('Error deleting service:', error);
    throw error;
  }
};
