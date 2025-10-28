import apiClient from '@config/api';

/**
 * Message API Service - Handles conversation and messaging API calls
 * Simplified to match web version approach (see petTapp-web/src/hooks/useStartConversation.ts)
 */

/**
 * Get business owner ID
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} Business owner information
 */
export const getBusinessOwner = async (businessId) => {
  if (!businessId) {
    throw new Error('Business ID is required');
  }

  try {
    const response = await apiClient.get(`/api/messages/business/${businessId}/owner`);

    if (response.status === 200 && response.data.success) {
      return response.data.data;
    }

    throw new Error('Failed to fetch business owner');
  } catch (error) {
    console.error('Error fetching business owner:', error);
    throw error;
  }
};

/**
 * Get or create conversation with a user
 * Simplified approach matching web version - just call POST endpoint directly
 * @param {string} userId - User ID to get conversation with
 * @returns {Promise<Object>} Conversation details
 */
export const getOrCreateConversation = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    console.log('📡 Creating/getting conversation with user:', userId);

    // Call POST endpoint directly - it will return existing or create new
    // This matches the web version approach (useStartConversation.ts)
    const response = await apiClient.post('/api/messages/conversations', {
      recipientId: userId,
    });

    console.log('✅ Backend response:', {
      status: response.status,
      success: response.data?.success,
      conversationId: response.data?.data?.conversationId
    });

    // Check for success response (can be 200 or 201)
    if ((response.status === 200 || response.status === 201) && response.data.success) {
      const conversationData = response.data.data;

      // Validate conversation ID
      if (!conversationData.conversationId) {
        throw new Error('Backend returned success but no conversation ID');
      }

      console.log('✅ Conversation ready:', conversationData.conversationId);

      // Match web version: add 500ms delay to allow Firestore to sync
      // (see useStartConversation.ts:34-36)
      console.log('⏰ Waiting 500ms for Firestore sync...');
      await new Promise(resolve => setTimeout(resolve, 500));

      return conversationData;
    }

    throw new Error('Failed to create conversation');
  } catch (error) {
    console.error('❌ Error in getOrCreateConversation:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
};

/**
 * Create a new conversation
 * @param {string} recipientId - Recipient user ID
 * @param {string} bookingId - Optional booking ID
 * @returns {Promise<Object>} Conversation details
 */
export const createConversation = async (recipientId, bookingId = null) => {
  if (!recipientId) {
    throw new Error('Recipient ID is required');
  }

  try {
    const payload = { recipientId };
    if (bookingId) {
      payload.bookingId = bookingId;
    }

    const response = await apiClient.post('/api/messages/conversations', payload);

    if (response.status === 201 && response.data.success) {
      return response.data.data;
    }

    throw new Error('Failed to create conversation');
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

/**
 * Get user's conversations
 * @returns {Promise<Array>} List of conversations
 */
export const getUserConversations = async () => {
  try {
    const response = await apiClient.get('/api/messages/conversations');

    if (response.status === 200 && response.data.success) {
      return response.data.data || [];
    }

    return [];
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
};
