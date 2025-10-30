import apiClient from "@config/api";

/**
 * Fetch business analytics data
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date for analytics (ISO 8601 format)
 * @param {string} params.endDate - End date for analytics (ISO 8601 format)
 * @param {string} params.businessId - Business ID (admin only)
 * @returns {Promise} Analytics data
 */
export const fetchAnalytics = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();

    if (params.startDate) {
      queryParams.append('startDate', params.startDate);
    }

    if (params.endDate) {
      queryParams.append('endDate', params.endDate);
    }

    if (params.businessId) {
      queryParams.append('businessId', params.businessId);
    }

    const queryString = queryParams.toString();
    const url = queryString ? `/analytics?${queryString}` : '/analytics';

    const response = await apiClient.get(url);

    if (response.data && response.data.success) {
      return response.data.data;
    }

    throw new Error('Failed to fetch analytics data');
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
};

/**
 * Get analytics for today
 * @returns {Promise} Analytics data
 */
export const fetchTodayAnalytics = async () => {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  return fetchAnalytics({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });
};

/**
 * Get analytics for the last 30 days
 * @returns {Promise} Analytics data
 */
export const fetchLast30DaysAnalytics = async () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  return fetchAnalytics({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });
};

/**
 * Get analytics for the last 7 days
 * @returns {Promise} Analytics data
 */
export const fetchLast7DaysAnalytics = async () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  return fetchAnalytics({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });
};

/**
 * Get analytics for the current month
 * @returns {Promise} Analytics data
 */
export const fetchCurrentMonthAnalytics = async () => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return fetchAnalytics({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });
};

/**
 * Get analytics for the last month
 * @returns {Promise} Analytics data
 */
export const fetchLastMonthAnalytics = async () => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endDate = new Date(now.getFullYear(), now.getMonth(), 0);

  return fetchAnalytics({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });
};

/**
 * Get analytics for the last 3 months
 * @returns {Promise} Analytics data
 */
export const fetchLast3MonthsAnalytics = async () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3);

  return fetchAnalytics({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });
};

/**
 * Get analytics for the current year
 * @returns {Promise} Analytics data
 */
export const fetchThisYearAnalytics = async () => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), 0, 1);
  const endDate = new Date(now.getFullYear(), 11, 31);

  return fetchAnalytics({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });
};

/**
 * Get all-time analytics (no date filter)
 * @returns {Promise} Analytics data
 */
export const fetchAllTimeAnalytics = async () => {
  return fetchAnalytics({});
};
