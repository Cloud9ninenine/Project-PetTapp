import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale } from './responsive';

/**
 * Service Helpers - Utility functions for service-related operations
 */

/**
 * Get icon name for service category
 * @param {string} category - Service category
 * @returns {string} Ionicons icon name
 */
export const getServiceCategoryIcon = (category) => {
  switch (category?.toLowerCase()) {
    case 'veterinary':
      return 'medical-outline';
    case 'grooming':
      return 'cut-outline';
    case 'boarding':
    case 'daycare':
      return 'home-outline';
    case 'training':
      return 'school-outline';
    case 'emergency':
      return 'alert-circle-outline';
    case 'consultation':
      return 'chatbubble-outline';
    default:
      return 'paw-outline';
  }
};

/**
 * Get color for service category
 * @param {string} category - Service category
 * @returns {string} Hex color code
 */
export const getServiceCategoryColor = (category) => {
  switch (category?.toLowerCase()) {
    case 'veterinary':
      return '#4CAF50';
    case 'grooming':
      return '#2196F3';
    case 'boarding':
      return '#FF9800';
    case 'training':
      return '#9C27B0';
    case 'emergency':
      return '#F44336';
    case 'consultation':
      return '#00BCD4';
    case 'daycare':
      return '#FFEB3B';
    default:
      return '#1C86FF';
  }
};

/**
 * Render star rating component
 * @param {number} rating - Rating value (0-5)
 * @param {number} size - Icon size (default: 16)
 * @returns {Array} Array of Ionicons star components
 */
export const renderStars = (rating = 0, size = 16) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(
        <Ionicons
          key={i}
          name="star"
          size={moderateScale(size)}
          color="#ff9b79"
        />
      );
    } else if (i === fullStars && hasHalfStar) {
      stars.push(
        <Ionicons
          key={i}
          name="star-half"
          size={moderateScale(size)}
          color="#ff9b79"
        />
      );
    } else {
      stars.push(
        <Ionicons
          key={i}
          name="star-outline"
          size={moderateScale(size)}
          color="#E0E0E0"
        />
      );
    }
  }
  return stars;
};

/**
 * Get service image source
 * @param {Object} service - Service object
 * @param {string} service.imageUrl - Image URL from API
 * @param {string} service.name - Service name
 * @param {string} service.category - Service category
 * @returns {Object} Image source object for React Native Image component
 */
export const getServiceImage = (service) => {
  // Priority 1: Use imageUrl from API response if available
  if (service?.imageUrl && typeof service.imageUrl === 'string') {
    return { uri: service.imageUrl };
  }

  // Priority 2: Fallback to category-based images
  const category = service?.category;
  const serviceName = service?.name;

  // Veterinary services
  if (category === 'veterinary') {
    if (serviceName === 'Animed Veterinary Clinic') {
      return require('@assets/images/serviceimages/17.png');
    } else if (serviceName === 'Vetfusion Animal Clinic') {
      return require('@assets/images/serviceimages/19.png');
    } else {
      return require('@assets/images/serviceimages/18.png');
    }
  }

  // Grooming services
  if (category === 'grooming') {
    return require('@assets/images/serviceimages/21.png');
  }

  // Boarding services
  if (category === 'boarding' || category === 'daycare') {
    if (serviceName === 'PetCity Daycare') {
      return require('@assets/images/serviceimages/16.png');
    }
    return require('@assets/images/serviceimages/22.png');
  }

  // Training services
  if (category === 'training') {
    return require('@assets/images/serviceimages/23.png');
  }

  // Emergency services
  if (category === 'emergency') {
    return require('@assets/images/serviceimages/19.png');
  }

  // Consultation services
  if (category === 'consultation') {
    return require('@assets/images/serviceimages/18.png');
  }

  // Default fallback
  return require('@assets/images/serviceimages/18.png');
};

/**
 * Get default carousel images for fallback
 * @returns {Array} Array of default carousel image objects
 */
export const getDefaultCarouselImages = () => {
  return [
    {
      id: 'default-1',
      image: require('@assets/images/serviceimages/19.png'),
      title: 'Wellness Check-up',
      subtitle: 'PetCo Clinic',
      isDefault: true,
    },
    {
      id: 'default-2',
      image: require('@assets/images/serviceimages/21.png'),
      title: 'Professional Grooming',
      subtitle: 'Pet Spa',
      isDefault: true,
    },
    {
      id: 'default-3',
      image: require('@assets/images/serviceimages/22.png'),
      title: 'Pet Boarding',
      subtitle: 'Pet Hotel',
      isDefault: true,
    },
    {
      id: 'default-4',
      image: require('@assets/images/serviceimages/23.png'),
      title: 'Pet Training',
      subtitle: 'Training Center',
      isDefault: true,
    },
  ];
};

/**
 * Validate service data
 * @param {Object} service - Service object
 * @returns {boolean} True if valid
 */
export const isValidService = (service) => {
  if (!service) return false;
  if (!service._id && !service.id) return false;
  if (!service.name) return false;
  return true;
};

/**
 * Get payment method icon
 * @param {string} method - Payment method
 * @returns {string} Ionicons icon name
 */
export const getPaymentMethodIcon = (method) => {
  const methodMap = {
    'cash': 'cash-outline',
    'gcash': 'phone-portrait-outline',
    'paymaya': 'phone-portrait-outline',
    'credit-card': 'card-outline',
    'debit-card': 'card-outline',
  };
  return methodMap[method] || 'wallet-outline';
};

/**
 * Get booking status color
 * @param {string} status - Booking status
 * @returns {string} Hex color code
 */
export const getBookingStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return '#FF9800';
    case 'confirmed':
      return '#4CAF50';
    case 'completed':
      return '#2196F3';
    case 'cancelled':
      return '#F44336';
    default:
      return '#9E9E9E';
  }
};

/**
 * Get booking status icon
 * @param {string} status - Booking status
 * @returns {string} Ionicons icon name
 */
export const getBookingStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'time-outline';
    case 'confirmed':
      return 'checkmark-circle-outline';
    case 'completed':
      return 'checkmark-done-circle-outline';
    case 'cancelled':
      return 'close-circle-outline';
    default:
      return 'help-circle-outline';
  }
};

/**
 * Calculate estimated travel time based on distance
 * @param {number} distance - Distance in kilometers
 * @param {string} mode - Travel mode (driving, walking, cycling)
 * @returns {string} Estimated time string
 */
export const estimateTravelTime = (distance, mode = 'driving') => {
  if (!distance) return 'Unknown';

  const numDistance = typeof distance === 'number' ? distance : parseFloat(distance) || 0;

  // Average speeds in km/h
  const speeds = {
    driving: 40,
    walking: 5,
    cycling: 15,
  };

  const speed = speeds[mode] || speeds.driving;
  const hours = numDistance / speed;
  const minutes = Math.round(hours * 60);

  if (minutes < 60) {
    return `~${minutes} mins`;
  }

  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `~${hrs}h ${mins}m` : `~${hrs}h`;
};

/**
 * Filter services by search query
 * @param {Array} services - Array of service objects
 * @param {string} query - Search query
 * @returns {Array} Filtered services
 */
export const filterServicesByQuery = (services, query) => {
  if (!query || query.trim().length === 0) return services;

  const lowerQuery = query.toLowerCase().trim();

  return services.filter(service => {
    const name = service.name?.toLowerCase() || '';
    const category = service.category?.toLowerCase() || '';
    const businessName = service.businessId?.businessName?.toLowerCase() || '';
    const description = service.description?.toLowerCase() || '';

    return name.includes(lowerQuery) ||
           category.includes(lowerQuery) ||
           businessName.includes(lowerQuery) ||
           description.includes(lowerQuery);
  });
};

/**
 * Sort services by various criteria
 * @param {Array} services - Array of service objects
 * @param {string} sortBy - Sort criteria (rating, price, distance, name)
 * @param {string} order - Sort order (asc, desc)
 * @returns {Array} Sorted services
 */
export const sortServices = (services, sortBy = 'rating', order = 'desc') => {
  const sorted = [...services].sort((a, b) => {
    let valueA, valueB;

    switch (sortBy) {
      case 'rating':
        valueA = a.rating || 0;
        valueB = b.rating || 0;
        break;
      case 'price':
        valueA = typeof a.price === 'object' ? a.price.amount : a.price || 0;
        valueB = typeof b.price === 'object' ? b.price.amount : b.price || 0;
        break;
      case 'distance':
        valueA = a.distance || 0;
        valueB = b.distance || 0;
        break;
      case 'name':
        valueA = a.name?.toLowerCase() || '';
        valueB = b.name?.toLowerCase() || '';
        break;
      default:
        return 0;
    }

    if (order === 'asc') {
      return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
    } else {
      return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
    }
  });

  return sorted;
};
