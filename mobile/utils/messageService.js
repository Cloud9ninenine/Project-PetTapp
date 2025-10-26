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
 * Get conversation ID with another user
 * @param {string} userId - The other user's ID
 * @returns {Promise<string>} Conversation ID
 */
export const getConversationId = (currentUserId, otherUserId) => {
  const participants = [currentUserId, otherUserId].sort();
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
 * @param {string} senderId - Sender user ID
 * @param {string} messageText - Message content
 * @param {object} senderInfo - Sender information (name, image, etc.)
 * @returns {Promise<object>} Created message
 */
export const sendMessage = async (conversationId, senderId, messageText, senderInfo = {}) => {
  try {
    console.log('=== SENDING MESSAGE DEBUG ===');
    console.log('Conversation ID:', conversationId);
    console.log('Sender ID:', senderId);
    console.log('Message:', messageText);
    console.log('============================');

    const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');

    const messageData = {
      senderId,
      senderName: senderInfo.name || 'Unknown',
      senderImage: senderInfo.image || null,
      message: messageText,
      messageType: 'text',
      createdAt: serverTimestamp(),
      isRead: false,
    };

    const docRef = await addDoc(messagesRef, messageData);

    // Update conversation's last message
    const conversationRef = doc(firestore, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      lastMessage: {
        message: messageText,
        senderId,
        createdAt: new Date().toISOString(),
      },
      updatedAt: serverTimestamp(),
      [`unreadCount.${senderId}`]: 0, // Reset sender's unread count
    });

    return {
      id: docRef.id,
      ...messageData,
      createdAt: new Date(),
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
    const q = query(
      messagesRef,
      orderBy('createdAt', 'desc'),
      limit(messageLimit)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = [];
      snapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        });
      });

      // Reverse to show oldest first
      callback(messages.reverse());
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
 * @param {string} userId - Current user ID
 */
export const markMessagesAsRead = async (conversationId, userId) => {
  try {
    const conversationRef = doc(firestore, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      [`unreadCount.${userId}`]: 0,
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

    let q;
    if (lastMessage) {
      q = query(
        messagesRef,
        orderBy('createdAt', 'desc'),
        startAfter(lastMessage.createdAt),
        limit(pageSize)
      );
    } else {
      q = query(
        messagesRef,
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );
    }

    const snapshot = await getDocs(q);
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      });
    });

    return messages.reverse();
  } catch (error) {
    console.error('Error getting messages page:', error);
    return [];
  }
};
