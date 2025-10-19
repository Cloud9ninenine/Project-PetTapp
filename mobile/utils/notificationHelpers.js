import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure how notifications should be handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions from the user
 * @returns {Promise<boolean>} Returns true if permissions are granted
 */
export async function registerForPushNotifications() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1C86FF',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }

    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: '610db6c5-defb-4390-887c-9dfd773742ef', // From app.json
      })).data;

      // Store the token locally
      await AsyncStorage.setItem('expoPushToken', token);
      console.log('Push notification token:', token);

      return true;
    } catch (error) {
      console.error('Error getting push token:', error);
      return false;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
    return false;
  }
}

/**
 * Get the stored Expo push token
 * @returns {Promise<string|null>} The push token or null if not available
 */
export async function getExpoPushToken() {
  try {
    const token = await AsyncStorage.getItem('expoPushToken');
    return token;
  } catch (error) {
    console.error('Error retrieving push token:', error);
    return null;
  }
}

/**
 * Schedule a local notification
 * @param {Object} notification - Notification configuration
 * @param {string} notification.title - Notification title
 * @param {string} notification.body - Notification body
 * @param {Object} notification.data - Additional data to pass with the notification
 * @param {number} notification.seconds - Seconds from now to trigger the notification
 * @returns {Promise<string>} Notification identifier
 */
export async function scheduleLocalNotification({ title, body, data = {}, seconds = 0 }) {
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        color: '#1C86FF',
      },
      trigger: seconds > 0 ? { seconds } : null,
    });

    return identifier;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
}

/**
 * Cancel a scheduled notification
 * @param {string} identifier - Notification identifier to cancel
 */
export async function cancelScheduledNotification(identifier) {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
}

/**
 * Get all scheduled notifications
 * @returns {Promise<Array>} Array of scheduled notifications
 */
export async function getAllScheduledNotifications() {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return notifications;
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}

/**
 * Set up notification listeners
 * @param {Function} onNotificationReceived - Callback when notification is received
 * @param {Function} onNotificationTapped - Callback when notification is tapped
 * @returns {Object} Object with subscription cleanup functions
 */
export function setupNotificationListeners(onNotificationReceived, onNotificationTapped) {
  // This listener is fired whenever a notification is received while the app is foregrounded
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  // This listener is fired whenever a user taps on or interacts with a notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification tapped:', response);
    if (onNotificationTapped) {
      onNotificationTapped(response);
    }
  });

  return {
    notificationListener,
    responseListener,
    remove: () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    },
  };
}

/**
 * Clear notification badge count
 */
export async function clearBadgeCount() {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    console.error('Error clearing badge count:', error);
  }
}

/**
 * Set notification badge count
 * @param {number} count - Badge count to set
 */
export async function setBadgeCount(count) {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error setting badge count:', error);
  }
}

/**
 * Send push token to backend server
 * @param {string} token - Expo push token
 * @param {Object} apiClient - API client instance
 * @returns {Promise<boolean>} Success status
 */
export async function sendPushTokenToServer(token, apiClient) {
  try {
    const response = await apiClient.post('/users/push-token', {
      pushToken: token,
      platform: Platform.OS,
    });

    if (response.data.success) {
      console.log('Push token registered with server');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error sending push token to server:', error);
    return false;
  }
}
