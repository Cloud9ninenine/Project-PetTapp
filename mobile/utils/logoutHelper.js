import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearFirebaseToken } from '@utils/firebaseAuthPersistence';
import { unregisterBackgroundFetchAsync } from '@utils/backgroundTasks';
import { clearBadgeCount, cancelAllScheduledNotifications } from '@utils/notificationHelpers';
import { auth } from '@config/firebase';

/**
 * Cleanup function for Firestore listeners
 * This ensures all active listeners are properly unsubscribed before logout
 */
const cleanupFirestoreListeners = async () => {
  try {
    console.log('🧹 Cleaning up Firestore listeners...');

    // Sign out from Firebase Auth - this will automatically cause all Firestore
    // onSnapshot listeners to receive permission errors and stop listening
    if (auth.currentUser) {
      console.log('🔐 Firebase: Signing out user:', auth.currentUser.uid);
      await auth.signOut();
      console.log('✅ Firebase: Signed out successfully');
    } else {
      console.log('ℹ️ Firebase: No current user to sign out');
    }

    // Give Firestore listeners a moment to detect the auth state change
    // and clean up properly before we proceed
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('✅ Firestore listeners cleanup complete');
  } catch (error) {
    console.error('❌ Error cleaning up Firestore listeners:', error);
    // Continue with logout even if cleanup fails
  }
};

/**
 * Comprehensive logout function that clears all user data
 * This ensures no data leakage between different user logins
 *
 * IMPORTANT: This function follows a specific order:
 * 1. Clean up Firebase/Firestore listeners FIRST (prevents permission errors in logs)
 * 2. Clear Firebase token and authentication
 * 3. Clear AsyncStorage (local data)
 * 4. Clean up background tasks and notifications
 */
export const performCompleteLogout = async () => {
  try {
    console.log('🚪 Starting complete logout...');
    console.log('═══════════════════════════════════════');

    // 1. Clean up Firestore listeners and sign out from Firebase FIRST
    // This prevents "permission denied" errors from active listeners
    console.log('Step 1: Cleaning up Firebase listeners and auth...');
    await cleanupFirestoreListeners();

    // 2. Clear Firebase token from AsyncStorage
    // Note: clearFirebaseToken() will attempt signOut again, but it's safe since we already did it
    console.log('Step 2: Clearing Firebase token from storage...');
    await clearFirebaseToken();

    // 3. Clear all AsyncStorage data (user data, preferences, etc.)
    console.log('Step 3: Clearing AsyncStorage...');
    await AsyncStorage.clear();
    console.log('✅ AsyncStorage cleared');

    // 4. Unregister background tasks
    console.log('Step 4: Unregistering background tasks...');
    try {
      await unregisterBackgroundFetchAsync();
      console.log('✅ Background tasks unregistered');
    } catch (error) {
      console.error('⚠️ Error unregistering background tasks:', error);
      // Continue logout even if this fails
    }

    // 5. Clear notification badge and scheduled notifications
    console.log('Step 5: Clearing notifications...');
    try {
      await clearBadgeCount();
      await cancelAllScheduledNotifications();
      console.log('✅ Notifications cleared');
    } catch (error) {
      console.error('⚠️ Error clearing notifications:', error);
      // Continue logout even if this fails
    }

    console.log('═══════════════════════════════════════');
    console.log('✅ Complete logout successful');
    return true;
  } catch (error) {
    console.error('❌ Error during complete logout:', error);
    console.error('   Error details:', error.message);

    // Even if there's an error, try to clear critical data
    console.log('⚠️ Attempting critical cleanup...');
    try {
      // Ensure Firebase is signed out
      if (auth.currentUser) {
        await auth.signOut();
      }
      // Clear storage
      await AsyncStorage.clear();
      await clearFirebaseToken();
      console.log('✅ Critical cleanup completed');
    } catch (criticalError) {
      console.error('❌ Critical error during logout cleanup:', criticalError);
    }
    return false;
  }
};

/**
 * Get all AsyncStorage keys for debugging
 */
export const debugAsyncStorage = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    console.log('AsyncStorage keys:', keys);
    const data = await AsyncStorage.multiGet(keys);
    console.log('AsyncStorage data:', data);
  } catch (error) {
    console.error('Error debugging AsyncStorage:', error);
  }
};
