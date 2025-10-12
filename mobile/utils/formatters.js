/**
 * Formatters Utility - Common formatting functions used across the app
 */

/**
 * Format date to readable string
 * @param {Date} date - Date object
 * @returns {string} Formatted date string (e.g., "Mon, Jan 15, 2024")
 */
export const formatDate = (date) => {
  if (!date) return 'Date not specified';

  const dateObj = date instanceof Date ? date : new Date(date);

  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format time to readable string
 * @param {Date} time - Date object
 * @returns {string} Formatted time string (e.g., "02:30 PM")
 */
export const formatTime = (time) => {
  if (!time) return 'Time not specified';

  const timeObj = time instanceof Date ? time : new Date(time);

  return timeObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Format price for display
 * @param {number|Object|string} price - Price value (can be number, object with amount, or string)
 * @returns {string} Formatted price string (e.g., "₱1,250")
 */
export const formatPrice = (price) => {
  try {
    if (!price && price !== 0) return 'Price not available';

    // Handle string prices
    if (typeof price === 'string') {
      const numericPrice = parseFloat(price);
      if (isNaN(numericPrice)) return price; // Return as-is if not a number
      return `₱${numericPrice.toLocaleString()}`;
    }

    // Handle numeric prices
    if (typeof price === 'number') {
      return `₱${price.toLocaleString()}`;
    }

    // Handle object prices with amount property
    if (typeof price === 'object') {
      const { amount, currency = 'PHP' } = price;
      const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
      return `₱${numericAmount.toLocaleString()}`;
    }

    return 'Price not available';
  } catch (error) {
    console.warn('Error formatting price:', error);
    return 'Price not available';
  }
};

/**
 * Format duration for display
 * @param {number|string} duration - Duration in minutes
 * @returns {string} Formatted duration string (e.g., "1h 30m")
 */
export const formatDuration = (duration) => {
  try {
    if (!duration && duration !== 0) return 'Duration not specified';

    // Handle string durations
    if (typeof duration === 'string') {
      // If it's already formatted, return as-is
      if (duration.includes('h') || duration.includes('m')) {
        return duration;
      }
      duration = parseFloat(duration);
    }

    const numericDuration = typeof duration === 'number' ? duration : parseFloat(duration) || 0;

    if (numericDuration < 60) {
      return `${Math.round(numericDuration)} minutes`;
    }

    const hours = Math.floor(numericDuration / 60);
    const minutes = Math.round(numericDuration % 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  } catch (error) {
    console.warn('Error formatting duration:', error);
    return 'Duration not specified';
  }
};

/**
 * Format availability for display
 * @param {Object|string} availability - Availability object or string
 * @returns {string} Formatted availability string
 */
export const formatAvailability = (availability) => {
  if (!availability) return 'Availability not specified';

  try {
    if (typeof availability === 'string') {
      return availability;
    }

    if (typeof availability === 'object') {
      // Handle different availability object structures
      if (availability.days && availability.timeSlots) {
        const days = Array.isArray(availability.days)
          ? availability.days.map(day =>
              typeof day === 'string' ? day.charAt(0).toUpperCase() + day.slice(1) : String(day)
            ).join(', ')
          : String(availability.days);

        const timeSlots = Array.isArray(availability.timeSlots)
          ? availability.timeSlots.map(slot => {
              if (typeof slot === 'object' && slot.start && slot.end) {
                return `${slot.start} - ${slot.end}`;
              }
              return String(slot);
            }).join(', ')
          : String(availability.timeSlots);

        return `${days}\n${timeSlots}`;
      }

      // If it's an object but not the expected structure, stringify it safely
      return JSON.stringify(availability, null, 2);
    }

    return String(availability);
  } catch (error) {
    console.warn('Error formatting availability:', error);
    return 'Availability information unavailable';
  }
};

/**
 * Format payment method for display
 * @param {string} method - Payment method code
 * @returns {string} Formatted payment method string
 */
export const formatPaymentMethod = (method) => {
  if (!method) return 'Not specified';

  const methodMap = {
    'cash': 'Cash',
    'gcash': 'GCash',
    'paymaya': 'PayMaya',
    'credit-card': 'Credit Card',
    'debit-card': 'Debit Card',
  };

  return methodMap[method] || method;
};

/**
 * Format phone number for display
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return 'No contact available';

  // Remove all non-numeric characters
  const cleaned = ('' + phone).replace(/\D/g, '');

  // Format based on length (assuming Philippine number format)
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, '$1-$2-$3');
  }

  // Return original if format is unknown
  return phone;
};

/**
 * Format distance for display
 * @param {number} distance - Distance in kilometers
 * @returns {string} Formatted distance string (e.g., "2.5 km")
 */
export const formatDistance = (distance) => {
  if (!distance && distance !== 0) return 'Distance unknown';

  const numericDistance = typeof distance === 'number' ? distance : parseFloat(distance) || 0;

  if (numericDistance < 1) {
    return `${Math.round(numericDistance * 1000)} m`;
  }

  return `${numericDistance.toFixed(1)} km`;
};

/**
 * Format rating for display
 * @param {number} rating - Rating value
 * @returns {string} Formatted rating string (e.g., "4.5")
 */
export const formatRating = (rating) => {
  if (!rating && rating !== 0) return 'No rating';

  const numericRating = typeof rating === 'number' ? rating : parseFloat(rating) || 0;
  return numericRating.toFixed(1);
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text with ellipsis
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Capitalize first letter of each word
 * @param {string} text - Text to capitalize
 * @returns {string} Capitalized text
 */
export const capitalizeWords = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
