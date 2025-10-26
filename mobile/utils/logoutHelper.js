import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearFirebaseToken } from '@utils/firebaseAuthPersistence';
import { unregisterBackgroundFetchAsync } from '@utils/backgroundTasks';
import { clearBadgeCount, cancelAllScheduledNotifications } from '@utils/notificationHelpers';

/**
 * Comprehensive logout function that clears all user data
 * This ensures no data leakage between different user logins
 */
export const performCompleteLogout = async () => {
  try {
    console.log('Starting complete logout...');

    // 1. Clear all AsyncStorage data FIRST (so app knows user is logged out)
    console.log('Clearing AsyncStorage...');
    await AsyncStorage.clear();

    // 2. Clear Firebase authentication and token
    console.log('Clearing Firebase auth...');
    await clearFirebaseToken();

    // 3. Unregister background tasks
    console.log('Unregistering background tasks...');
    try {
      await unregisterBackgroundFetchAsync();
    } catch (error) {
      console.error('Error unregistering background tasks:', error);
      // Continue logout even if this fails
    }

    // 4. Clear notification badge and scheduled notifications
    console.log('Clearing notifications...');
    try {
      await clearBadgeCount();
      await cancelAllScheduledNotifications();
    } catch (error) {
      console.error('Error clearing notifications:', error);
      // Continue logout even if this fails
    }

    console.log('Complete logout successful');
    return true;
  } catch (error) {
    console.error('Error during complete logout:', error);
    // Even if there's an error, try to clear critical data
    try {
      await AsyncStorage.clear();
      await clearFirebaseToken();
    } catch (criticalError) {
      console.error('Critical error during logout cleanup:', criticalError);
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
