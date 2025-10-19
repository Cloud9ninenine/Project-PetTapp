import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearBadgeCount } from './notificationHelpers';

const BACKGROUND_FETCH_TASK = 'background-fetch-task';

/**
 * Define the background task
 * This will run periodically even when the app is closed
 */
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log('Background fetch task running...');

    // Check if user is logged in
    const accessToken = await AsyncStorage.getItem('accessToken');

    if (!accessToken) {
      console.log('No user logged in, skipping background task');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Perform background operations here:
    // 1. Sync data with server
    // 2. Check for new notifications
    // 3. Update badge count
    // 4. Refresh cached data
    // etc.

    console.log('Background task completed successfully');
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background task error:', error);
    return BackgroundFetch.BackgroundFetch Result.Failed;
  }
});

/**
 * Register background fetch task
 * Call this when the user logs in
 */
export async function registerBackgroundFetchAsync() {
  try {
    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);

    if (isRegistered) {
      console.log('Background fetch already registered');
      return;
    }

    // Register the background fetch task
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 60 * 15, // 15 minutes (minimum allowed)
      stopOnTerminate: false, // Continue after app is closed
      startOnBoot: true, // Start after device reboot
    });

    console.log('Background fetch registered successfully');
  } catch (error) {
    console.error('Failed to register background fetch:', error);
  }
}

/**
 * Unregister background fetch task
 * Call this when the user logs out
 */
export async function unregisterBackgroundFetchAsync() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);

    if (!isRegistered) {
      console.log('Background fetch not registered');
      return;
    }

    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    console.log('Background fetch unregistered');
  } catch (error) {
    console.error('Failed to unregister background fetch:', error);
  }
}

/**
 * Check if background fetch is available
 */
export async function checkBackgroundFetchStatus() {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    const statusText = {
      [BackgroundFetch.BackgroundFetchStatus.Restricted]: 'Restricted',
      [BackgroundFetch.BackgroundFetchStatus.Denied]: 'Denied',
      [BackgroundFetch.BackgroundFetchStatus.Available]: 'Available',
    }[status] || 'Unknown';

    console.log('Background fetch status:', statusText);
    return status;
  } catch (error) {
    console.error('Error checking background fetch status:', error);
    return null;
  }
}
