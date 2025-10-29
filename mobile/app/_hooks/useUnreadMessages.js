import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db as firestore } from '@config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ensureFirebaseAuth } from '@utils/firebaseAuthPersistence';

/**
 * Convert user ID to Firebase UID format
 * CRITICAL: Must match backend format (pettapp_userId)
 */
const getFirebaseUid = (userId) => {
  return `pettapp_${userId}`;
};

/**
 * Hook for listening to total unread message count across all conversations
 * This hook is designed to be used in tab navigators for badge counts
 */
export const useUnreadMessages = () => {
  const [totalUnread, setTotalUnread] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = null;

    const initializeListener = async () => {
      try {
        // Get current user ID from AsyncStorage
        const userId = await AsyncStorage.getItem('userId');

        if (!userId) {
          console.log('useUnreadMessages: No userId found');
          setIsLoading(false);
          return;
        }

        // Ensure Firebase authentication
        const isAuthenticated = await ensureFirebaseAuth();

        if (!isAuthenticated) {
          console.log('useUnreadMessages: Firebase authentication failed');
          setIsLoading(false);
          return;
        }

        // Get Firebase UID format
        const firebaseUid = getFirebaseUid(userId);

        // Query conversations where user is a participant
        const conversationsRef = collection(firestore, 'conversations');
        const q = query(
          conversationsRef,
          where('participants', 'array-contains', firebaseUid)
        );

        // Subscribe to conversations and calculate total unread count
        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            let total = 0;

            snapshot.forEach((doc) => {
              const data = doc.data();
              const unreadCount = data.unreadCount || {};
              // Add this conversation's unread count for the current user
              total += unreadCount[firebaseUid] || 0;
            });

            setTotalUnread(total);
            setIsLoading(false);
          },
          (error) => {
            console.error('useUnreadMessages: Error listening to conversations:', error);
            setIsLoading(false);
          }
        );
      } catch (error) {
        console.error('useUnreadMessages: Error initializing listener:', error);
        setIsLoading(false);
      }
    };

    initializeListener();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return { totalUnread, isLoading };
};
