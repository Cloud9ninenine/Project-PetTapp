import apiClient from '@config/api';

/**
 * Booking API - Handles all booking-related API calls
 */

/**
 * Create a new booking
 * @param {Object} bookingData - Booking details
 * @param {string} bookingData.serviceId - Service ID
 * @param {string} bookingData.petId - Pet ID
 * @param {string} bookingData.appointmentDateTime - Appointment date/time in ISO format
 * @param {string} bookingData.paymentMethod - Payment method (cash, gcash, paymaya, credit-card, debit-card)
 * @param {string} bookingData.notes - Optional notes (max 500 chars)
 * @param {string} bookingData.specialRequests - Optional special requests (max 300 chars)
 * @returns {Promise<Object>} Created booking object
 */
export const createBooking = async (bookingData) => {
  // Validate required fields
  if (!bookingData.serviceId) {
    throw new Error('Service ID is required');
  }
  if (!bookingData.petId) {
    throw new Error('Pet ID is required');
  }
  if (!bookingData.appointmentDateTime) {
    throw new Error('Appointment date and time are required');
  }
  if (!bookingData.paymentMethod) {
    throw new Error('Payment method is required');
  }

  // Validate field lengths
  if (bookingData.notes && bookingData.notes.length > 500) {
    throw new Error('Notes must be 500 characters or less');
  }
  if (bookingData.specialRequests && bookingData.specialRequests.length > 300) {
    throw new Error('Special requests must be 300 characters or less');
  }

  try {
    // Prepare booking payload
    const payload = {
      serviceId: bookingData.serviceId,
      petId: bookingData.petId,
      appointmentDateTime: bookingData.appointmentDateTime,
      paymentMethod: bookingData.paymentMethod,
    };

    // Add optional fields if provided
    if (bookingData.notes && bookingData.notes.trim()) {
      payload.notes = bookingData.notes.trim();
    }
    if (bookingData.specialRequests && bookingData.specialRequests.trim()) {
      payload.specialRequests = bookingData.specialRequests.trim();
    }

    console.log('Creating booking with payload:', payload);

    const response = await apiClient.post('/bookings', payload);

    if (response.data.success) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to create booking');
  } catch (error) {
    console.error('Error creating booking:', error);
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
    throw new Error(errorMessage);
  }
};

/**
 * Fetch all bookings for the current user
 * @param {Object} filters - Optional filters
 * @param {string} filters.status - Filter by status (pending, confirmed, completed, cancelled)
 * @param {number} filters.limit - Maximum number of results
 * @returns {Promise<Array>} Array of booking objects
 */
export const fetchUserBookings = async (filters = {}) => {
  try {
    const params = {};

    if (filters.status) {
      params.status = filters.status;
    }
    if (filters.limit) {
      params.limit = filters.limit;
    }

    const response = await apiClient.get('/bookings', { params });

    if (response.data.success) {
      return response.data.data || [];
    }

    return [];
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }
};

/**
 * Fetch a single booking by ID
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object>} Booking object
 */
export const fetchBookingById = async (bookingId) => {
  if (!bookingId) {
    throw new Error('Booking ID is required');
  }

  try {
    const response = await apiClient.get(`/bookings/${bookingId}`);

    if (response.data.success) {
      return response.data.data;
    }

    throw new Error('Failed to fetch booking details');
  } catch (error) {
    console.error('Error fetching booking by ID:', error);
    throw error;
  }
};

/**
 * Update a booking
 * @param {string} bookingId - Booking ID
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object>} Updated booking object
 */
export const updateBooking = async (bookingId, updateData) => {
  if (!bookingId) {
    throw new Error('Booking ID is required');
  }

  try {
    const response = await apiClient.patch(`/bookings/${bookingId}`, updateData);

    if (response.data.success) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to update booking');
  } catch (error) {
    console.error('Error updating booking:', error);
    throw error;
  }
};

/**
 * Cancel a booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object>} Cancelled booking object
 */
export const cancelBooking = async (bookingId) => {
  if (!bookingId) {
    throw new Error('Booking ID is required');
  }

  try {
    const response = await apiClient.patch(`/bookings/${bookingId}`, {
      status: 'cancelled',
    });

    if (response.data.success) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to cancel booking');
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
};

/**
 * Delete a booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteBooking = async (bookingId) => {
  if (!bookingId) {
    throw new Error('Booking ID is required');
  }

  try {
    const response = await apiClient.delete(`/bookings/${bookingId}`);

    if (response.data.success) {
      return true;
    }

    throw new Error(response.data.message || 'Failed to delete booking');
  } catch (error) {
    console.error('Error deleting booking:', error);
    throw error;
  }
};
