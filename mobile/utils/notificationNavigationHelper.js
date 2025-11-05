import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

/**
 * Handles navigation from push notification taps
 * Routes to appropriate screen based on notification type and user role
 *
 * @param {Object} notification - The notification object from Expo
 * @param {Object} notification.request - The notification request
 * @param {Object} notification.request.content - The notification content
 * @param {Object} notification.request.content.data - The notification data payload
 */
export async function handleNotificationNavigation(notification) {
  try {
    // Extract notification data
    const notificationData = notification?.request?.content?.data;

    if (!notificationData) {
      console.log('No notification data found, navigating to notifications screen');
      await navigateToNotifications();
      return;
    }

    const {
      type,
      bookingId,
      businessId,
      conversationId,
      serviceId,
      petId
    } = notificationData;

    // Get user role to determine navigation paths
    const userRole = await AsyncStorage.getItem('role');
    const isBusinessOwner = userRole === 'business-owner';
    const basePath = isBusinessOwner ? '/(bsn)/(tabs)' : '/(user)/(tabs)';

    console.log('Handling notification navigation:', { type, userRole, bookingId, businessId });

    // Route based on notification type
    switch (type) {
      case 'booking':
      case 'payment':
      case 'rating':
      case 'reminder':
      case 'cancelled':
        navigateToBookingDetails(basePath, bookingId, isBusinessOwner);
        break;

      case 'business':
        // Only pet owners can navigate to business details
        if (!isBusinessOwner && businessId) {
          navigateToBusinessDetails(basePath, businessId);
        } else {
          console.log('Business notification received by business owner, navigating to notifications');
          await navigateToNotifications();
        }
        break;

      case 'message':
        navigateToMessages(basePath, conversationId, notificationData);
        break;

      case 'admin':
      default:
        // Default to notifications screen
        await navigateToNotifications();
        break;
    }
  } catch (error) {
    console.error('Error handling notification navigation:', error);
    // Fallback to notifications screen on error
    await navigateToNotifications();
  }
}

/**
 * Navigate to booking details or booking list
 */
function navigateToBookingDetails(basePath, bookingId, isBusinessOwner) {
  if (bookingId) {
    const screenName = isBusinessOwner ? 'AppointmentDetails' : 'ScheduleDetail';

    console.log(`Navigating to booking details: ${basePath}/booking/${screenName}`);
    router.push({
      pathname: `${basePath}/booking/${screenName}`,
      params: { bookingId }
    });
  } else {
    // Fallback to bookings list if no bookingId
    console.log(`No bookingId found, navigating to bookings list`);
    router.push(`${basePath}/booking`);
  }
}

/**
 * Navigate to business details
 */
function navigateToBusinessDetails(basePath, businessId) {
  console.log(`Navigating to business details: ${basePath}/home/business-details`);
  router.push({
    pathname: `${basePath}/home/business-details`,
    params: { id: businessId }
  });
}

/**
 * Navigate to messages or chat
 */
function navigateToMessages(basePath, conversationId, notificationData) {
  if (conversationId) {
    // Extract additional data for chat screen
    const {
      businessId,
      businessName,
      businessImage,
      petOwnerId,
      petOwnerName,
      petOwnerImage
    } = notificationData;

    console.log(`Navigating to chat: ${basePath}/messages/chat`);
    router.push({
      pathname: `${basePath}/messages/chat`,
      params: {
        conversationId,
        // Include business or pet owner details based on user role
        businessId,
        businessName,
        businessImage,
        petOwnerId,
        petOwnerName,
        petOwnerImage
      }
    });
  } else {
    // Fallback to messages list if no conversationId
    console.log(`No conversationId found, navigating to messages list`);
    router.push(`${basePath}/messages`);
  }
}

/**
 * Navigate to notifications screen based on user role
 */
async function navigateToNotifications() {
  const userRole = await AsyncStorage.getItem('role');
  const isBusinessOwner = userRole === 'business-owner';
  const basePath = isBusinessOwner ? '/(bsn)/(tabs)' : '/(user)/(tabs)';

  // Navigate to notification screen
  // For pet owners: /(user)/(tabs)/notification
  // For business owners: /(bsn)/(tabs)/profile/notifications
  const notificationPath = isBusinessOwner
    ? `${basePath}/profile/notifications`
    : `${basePath}/notification`;

  console.log(`Navigating to notifications: ${notificationPath}`);
  router.push(notificationPath);
}

/**
 * Get navigation path for a notification (for testing/debugging)
 * @returns {Promise<Object>} Object with pathname and params
 */
export async function getNotificationNavigationPath(notificationData) {
  try {
    const { type, bookingId, businessId, conversationId } = notificationData;
    const userRole = await AsyncStorage.getItem('role');
    const isBusinessOwner = userRole === 'business-owner';
    const basePath = isBusinessOwner ? '/(bsn)/(tabs)' : '/(user)/(tabs)';

    switch (type) {
      case 'booking':
      case 'payment':
      case 'rating':
      case 'reminder':
      case 'cancelled':
        if (bookingId) {
          const screenName = isBusinessOwner ? 'AppointmentDetails' : 'ScheduleDetail';
          return {
            pathname: `${basePath}/booking/${screenName}`,
            params: { bookingId }
          };
        }
        return { pathname: `${basePath}/booking`, params: {} };

      case 'business':
        if (!isBusinessOwner && businessId) {
          return {
            pathname: `${basePath}/home/business-details`,
            params: { id: businessId }
          };
        }
        break;

      case 'message':
        if (conversationId) {
          return {
            pathname: `${basePath}/messages/chat`,
            params: { conversationId }
          };
        }
        return { pathname: `${basePath}/messages`, params: {} };

      default:
        break;
    }

    // Default to notifications
    const notificationPath = isBusinessOwner
      ? `${basePath}/profile/notifications`
      : `${basePath}/notification`;
    return { pathname: notificationPath, params: {} };
  } catch (error) {
    console.error('Error getting notification navigation path:', error);
    return null;
  }
}
