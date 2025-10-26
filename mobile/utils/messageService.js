import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  limit,
  startAfter
} from 'firebase/firestore';
import { firestore } from '@config/firebase';
import apiClient from '@config/api';

/**
 * Get Firebase authentication token from backend
 * @returns {Promise<string>} Firebase custom token
 */
export const getFirebaseAuthToken = async () => {
  try {
    const response = await apiClient.post('/api/messages/token');
    if (response.data.success) {
      return response.data.data.token;
    }
    throw new Error('Failed to get Firebase token');
  } catch (error) {
    console.error('Error getting Firebase token:', error);
    throw error;
  }
};

/**
 * Refresh conversation participant details
 * Calls backend to update user info across all conversations
 * @returns {Promise<boolean>} Success status
 */
export const refreshConversationParticipants = async () => {
  try {
    const response = await apiClient.post('/api/messages/refresh-participants');
    return response.data.success;
  } catch (error) {
    console.error('Error refreshing conversation participants:', error);
    return false;
  }
};

/**
 * Convert user ID to Firebase UID format
 * CRITICAL: Must match backend format (pettapp_userId)
 * @param {string} userId - The user's ID
 * @returns {string} Firebase UID
 */
export const toFirebaseUid = (userId) => {
  return `pettapp_${userId}`;
};

/**
 * Get conversation ID with another user
 * CRITICAL: Uses Firebase UID format to match backend
 * @param {string} userId - The other user's ID
 * @returns {Promise<string>} Conversation ID
 */
export const getConversationId = (currentUserId, otherUserId) => {
  const firebaseUid1 = toFirebaseUid(currentUserId);
  const firebaseUid2 = toFirebaseUid(otherUserId);
  const participants = [firebaseUid1, firebaseUid2].sort();
  return `${participants[0]}_${participants[1]}`;
};

/**
 * Create a new conversation
 * @param {string} recipientId - ID of the user to chat with
 * @param {string} bookingId - Optional booking ID
 * @returns {Promise<object>} Conversation data
 */
export const createConversation = async (recipientId, bookingId = null) => {
  try {
    const body = { recipientId };
    if (bookingId) {
      body.bookingId = bookingId;
    }

    const response = await apiClient.post('/api/messages/conversations', body);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to create conversation');
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

/**
 * Get all user conversations from backend
 * @returns {Promise<Array>} List of conversations
 */
export const getUserConversations = async () => {
  try {
    const response = await apiClient.get('/api/messages/conversations');
    if (response.data.success) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('Error getting conversations:', error);
    return [];
  }
};

/**
 * Get business owner ID from business ID
 * @param {string} businessId - Business ID
 * @returns {Promise<string>} Owner ID
 */
export const getBusinessOwnerId = async (businessId) => {
  try {
    const response = await apiClient.get(`/api/messages/business/${businessId}/owner`);
    if (response.data.success) {
      return response.data.data.ownerId;
    }
    throw new Error('Failed to get business owner ID');
  } catch (error) {
    console.error('Error getting business owner:', error);
    throw error;
  }
};

/**
 * Send a message in a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} senderId - Sender user ID (will be converted to Firebase UID)
 * @param {string} messageText - Message content
 * @param {object} senderInfo - Sender information (name, image, etc.)
 * @returns {Promise<object>} Created message
 */
export const sendMessage = async (conversationId, senderId, messageText, senderInfo = {}) => {
  try {
    const firebaseUid = toFirebaseUid(senderId);

    console.log('=== SENDING MESSAGE DEBUG ===');
    console.log('Conversation ID:', conversationId);
    console.log('Sender ID:', senderId);
    console.log('Firebase UID:', firebaseUid);
    console.log('Message:', messageText);
    console.log('============================');

    const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');

    const messageData = {
      senderId: firebaseUid, // Use Firebase UID format
      senderName: senderInfo.name || 'Unknown',
      senderImage: senderInfo.image || null,
      text: messageText, // FIXED: Use 'text' instead of 'message' to match Firestore
      messageType: 'text',
      timestamp: serverTimestamp(), // FIXED: Use 'timestamp' instead of 'createdAt'
      isRead: false,
    };

    const docRef = await addDoc(messagesRef, messageData);

    // Update conversation's last message
    const conversationRef = doc(firestore, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      lastMessage: {
        text: messageText, // FIXED: Use 'text' instead of 'message'
        senderId: firebaseUid, // Use Firebase UID format
        timestamp: new Date().toISOString(), // FIXED: Use 'timestamp' instead of 'createdAt'
      },
      updatedAt: serverTimestamp(),
      [`unreadCount.${firebaseUid}`]: 0, // Reset sender's unread count using Firebase UID
    });

    return {
      id: docRef.id,
      ...messageData,
      createdAt: new Date(), // For compatibility
      timestamp: new Date(), // Match Firestore field
    };
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Listen to messages in a conversation (real-time)
 * @param {string} conversationId - Conversation ID
 * @param {function} callback - Callback function to handle new messages
 * @param {number} messageLimit - Number of messages to fetch
 * @returns {function} Unsubscribe function
 */
export const subscribeToMessages = (conversationId, callback, messageLimit = 50) => {
  try {
    const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
    // Order by timestamp DESCENDING because FlatList is inverted
    // Inverted FlatList shows last item at bottom, so newest (first in array) appears at bottom
    const q = query(
      messagesRef,
      orderBy('timestamp', 'desc'),
      limit(messageLimit)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = [];
      snapshot.forEach((doc) => {
        const data = doc.data();

        // FIXED: Handle both Firestore Timestamp and ISO string formats
        let createdAtDate;
        if (data.timestamp) {
          // Check if it's a Firestore Timestamp or a string
          if (typeof data.timestamp === 'string') {
            createdAtDate = new Date(data.timestamp);
          } else if (data.timestamp.toDate) {
            createdAtDate = data.timestamp.toDate();
          } else {
            createdAtDate = new Date();
          }
        } else if (data.createdAt) {
          if (typeof data.createdAt === 'string') {
            createdAtDate = new Date(data.createdAt);
          } else if (data.createdAt.toDate) {
            createdAtDate = data.createdAt.toDate();
          } else {
            createdAtDate = new Date();
          }
        } else {
          createdAtDate = new Date();
        }

        messages.push({
          id: doc.id,
          ...data,
          createdAt: createdAtDate,
          // Map 'text' to 'message' for display compatibility (keep both for compatibility)
          message: data.text || data.message || '',
          text: data.text || data.message || '',
        });
      });

      // Messages come from Firestore ordered DESC (newest first)
      // With inverted FlatList: Index 0 (newest) shows at BOTTOM
      // NO REVERSE needed!

      console.log('📱 Messages received:', messages.length);
      if (messages.length > 0) {
        console.log('🔽 FIRST in array (will show at BOTTOM - NEWEST):', {
          text: messages[0].text?.substring(0, 30),
          timestamp: messages[0].timestamp
        });
        console.log('🔼 LAST in array (will show at TOP - OLDEST):', {
          text: messages[messages.length - 1].text?.substring(0, 30),
          timestamp: messages[messages.length - 1].timestamp
        });
      }

      callback(messages);
    }, (error) => {
      console.error('Error listening to messages:', error);
      callback([]);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to messages:', error);
    return () => {};
  }
};

/**
 * Mark messages as read
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - Current user ID (will be converted to Firebase UID)
 */
export const markMessagesAsRead = async (conversationId, userId) => {
  try {
    const firebaseUid = toFirebaseUid(userId);
    const conversationRef = doc(firestore, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      [`unreadCount.${firebaseUid}`]: 0, // Use Firebase UID format
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
};

/**
 * Get conversation details from Firestore
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<object|null>} Conversation data
 */
export const getConversationDetails = async (conversationId) => {
  try {
    const conversationRef = doc(firestore, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (conversationSnap.exists()) {
      return {
        id: conversationSnap.id,
        ...conversationSnap.data(),
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting conversation details:', error);
    return null;
  }
};

/**
 * Listen to conversation updates (real-time)
 * @param {string} conversationId - Conversation ID
 * @param {function} callback - Callback function
 * @returns {function} Unsubscribe function
 */
export const subscribeToConversation = (conversationId, callback) => {
  try {
    const conversationRef = doc(firestore, 'conversations', conversationId);

    const unsubscribe = onSnapshot(conversationRef, (doc) => {
      if (doc.exists()) {
        callback({
          id: doc.id,
          ...doc.data(),
        });
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error listening to conversation:', error);
      callback(null);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to conversation:', error);
    return () => {};
  }
};

/**
 * Get messages with pagination
 * @param {string} conversationId - Conversation ID
 * @param {number} pageSize - Number of messages per page
 * @param {object} lastMessage - Last message from previous page
 * @returns {Promise<Array>} List of messages
 */
export const getMessagesPage = async (conversationId, pageSize = 50, lastMessage = null) => {
  try {
    const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');

    // Order by timestamp DESC to match inverted FlatList pattern
    let q;
    if (lastMessage) {
      q = query(
        messagesRef,
        orderBy('timestamp', 'desc'),
        startAfter(lastMessage.timestamp || lastMessage.createdAt),
        limit(pageSize)
      );
    } else {
      q = query(
        messagesRef,
        orderBy('timestamp', 'desc'),
        limit(pageSize)
      );
    }

    const snapshot = await getDocs(q);
    const messages = [];
    snapshot.forEach((doc) => {
      const data = doc.data();

      // FIXED: Handle both Firestore Timestamp and ISO string formats
      let createdAtDate;
      if (data.timestamp) {
        if (typeof data.timestamp === 'string') {
          createdAtDate = new Date(data.timestamp);
        } else if (data.timestamp.toDate) {
          createdAtDate = data.timestamp.toDate();
        } else {
          createdAtDate = new Date();
        }
      } else if (data.createdAt) {
        if (typeof data.createdAt === 'string') {
          createdAtDate = new Date(data.createdAt);
        } else if (data.createdAt.toDate) {
          createdAtDate = data.createdAt.toDate();
        } else {
          createdAtDate = new Date();
        }
      } else {
        createdAtDate = new Date();
      }

      messages.push({
        id: doc.id,
        ...data,
        createdAt: createdAtDate,
        // Map 'text' to 'message' for display compatibility
        message: data.text || data.message || '',
        text: data.text || data.message || '',
      });
    });

    // Messages ordered DESC (newest first) for inverted FlatList
    return messages;
  } catch (error) {
    console.error('Error getting messages page:', error);
    return [];
  }
};
