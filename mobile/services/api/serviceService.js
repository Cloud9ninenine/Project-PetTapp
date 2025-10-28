import apiClient from '@config/api';

/**
 * Service API - Handles all service-related API calls
 */

/**
 * Fetch services from different categories for carousel display
 * @param {Object} location - User's current location {latitude, longitude}
 * @param {Array} categories - Array of category names to fetch
 * @returns {Promise<Array>} Array of carousel service objects
 */
export const fetchCarouselServices = async (location = null, categories = ['veterinary', 'grooming', 'boarding', 'training', 'daycare', 'emergency', 'consultation']) => {
  try {
    const carouselData = [];
    const usedServiceIds = new Set();

    // Fetch one service from each category
    for (const category of categories) {
      try {
        const response = await apiClient.get('/services', {
          params: {
            category,
            limit: 1,
          },
        });

        if (response.data.success && response.data.data.length > 0) {
          const service = response.data.data[0];
          // Avoid duplicates
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
      } catch (error) {
        console.error(`Error fetching ${category} service:`, error);
      }
    }

    // Optionally add nearby services if location is available
    if (location && carouselData.length < 6) {
      try {
        const nearbyResponse = await apiClient.get('/services', {
          params: {
            latitude: location.latitude,
            longitude: location.longitude,
            radius: 10,
            limit: 3,
          },
        });

        if (nearbyResponse.data.success && nearbyResponse.data.data.length > 0) {
          nearbyResponse.data.data.forEach((service) => {
            // Add nearby services if not already in carousel and haven't reached max
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
    const response = await apiClient.get('/services', {
      params: {
        search: query.trim(),
        limit,
      },
    });

    if (response.data.success) {
      return response.data.data || [];
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
    const params = { limit };

    // Add location if available
    if (location) {
      params.latitude = location.latitude;
      params.longitude = location.longitude;
      params.radius = radius;
    }

    const response = await apiClient.get('/services', { params });

    if (response.data.success) {
      return response.data.data || [];
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
      let businessData = null;
      if (service.businessId && typeof service.businessId === 'object') {
        // Business data is already populated from the API
        const businessInfo = service.businessId;

        // Format address string for display
        const addressString = businessInfo.address?.street
          ? `${businessInfo.address.street}, ${businessInfo.address.city || ''}, ${businessInfo.address.state || ''}`
          : businessInfo.address?.fullAddress || 'No address available';

        businessData = {
          _id: businessInfo._id,
          name: businessInfo.businessName,
          address: businessInfo.address, // Keep full address object with coordinates
          addressString: addressString.trim(), // Add formatted string for display
          contactNumber: businessInfo.contactInfo?.phone || businessInfo.contactInfo?.phoneNumber || 'No contact available',
          businessType: businessInfo.businessType,
          ratings: businessInfo.ratings,
          businessHours: businessInfo.businessHours,
          isActive: businessInfo.isActive,
          isVerified: businessInfo.isVerified,
          logo: businessInfo.logo,
        };
      } else if (service.businessId && typeof service.businessId === 'string') {
        // If only ID is returned, fetch full business data
        try {
          const businessResponse = await apiClient.get(`/businesses/${service.businessId}`);
          if (businessResponse.status === 200 && businessResponse.data.success) {
            businessData = businessResponse.data.data;
          }
        } catch (businessError) {
          console.warn('Could not fetch business data:', businessError);
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
    const response = await apiClient.get('/services', {
      params: {
        category,
        limit,
      },
    });

    if (response.data.success) {
      return response.data.data || [];
    }

    return [];
  } catch (error) {
    console.error(`Error fetching ${category} services:`, error);
    throw error;
  }
};
