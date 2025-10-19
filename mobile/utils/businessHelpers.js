/**
 * Business Helpers - Utility functions for business-related operations
 */

/**
 * Check if business is currently open based on business hours
 * @param {Object} businessHours - Business hours object with days (monday, tuesday, etc.)
 * @returns {Object} { isOpen: boolean, status: string }
 */
export const isBusinessOpen = (businessHours) => {
  if (!businessHours) {
    return { isOpen: false, status: 'Closed' };
  }

  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = days[now.getDay()];
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes

  const dayHours = businessHours[currentDay];

  if (!dayHours || !dayHours.isOpen) {
    return { isOpen: false, status: 'Closed' };
  }

  // Parse time strings (e.g., "09:00" to minutes)
  const parseTime = (timeStr) => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const openTime = parseTime(dayHours.open);
  const closeTime = parseTime(dayHours.close);

  if (openTime === null || closeTime === null) {
    return { isOpen: false, status: 'Closed' };
  }

  // Check if current time is within business hours
  if (currentTime >= openTime && currentTime < closeTime) {
    return { isOpen: true, status: 'Open' };
  }

  return { isOpen: false, status: 'Closed' };
};
