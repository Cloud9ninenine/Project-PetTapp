# Push Notifications Setup Guide

## Overview
Push notifications have been successfully configured for PetTapp mobile application. The app can now send notifications even when the app is not open or being used by the user.

## What Was Implemented

### 1. Dependencies Installed
- `expo-notifications` - For handling push notifications
- `expo-device` - For device detection

### 2. Configuration Files Updated

#### app.json
Added notification configuration:
```json
{
  "notification": {
    "icon": "./app/assets/images/AppIcon.png",
    "color": "#1C86FF",
    "iosDisplayInForeground": true,
    "androidMode": "default",
    "androidCollapsedTitle": "{{unread_count}} new notifications"
  }
}
```

Added Android POST_NOTIFICATIONS permission:
```json
{
  "android": {
    "permissions": [
      ...
      "android.permission.POST_NOTIFICATIONS"
    ]
  }
}
```

Added expo-notifications plugin:
```json
{
  "plugins": [
    ...
    [
      "expo-notifications",
      {
        "icon": "./app/assets/images/AppIcon.png",
        "color": "#1C86FF",
        "sounds": [],
        "mode": "production"
      }
    ]
  ]
}
```

### 3. Notification Helper Utilities
Created `/mobile/utils/notificationHelpers.js` with the following functions:

#### Key Functions:
- `registerForPushNotifications()` - Request notification permissions and get push token
- `getExpoPushToken()` - Retrieve stored Expo push token
- `scheduleLocalNotification({ title, body, data, seconds })` - Schedule local notifications
- `cancelScheduledNotification(identifier)` - Cancel a specific notification
- `cancelAllScheduledNotifications()` - Cancel all scheduled notifications
- `getAllScheduledNotifications()` - Get all scheduled notifications
- `setupNotificationListeners(onReceived, onTapped)` - Set up notification event listeners
- `clearBadgeCount()` - Clear app badge count
- `setBadgeCount(count)` - Set app badge count
- `sendPushTokenToServer(token, apiClient)` - Send push token to backend

### 4. Background Notification Handlers
Updated `/mobile/app/_layout.jsx` to:
- Configure notification behavior when app is in foreground
- Register for push notifications on app startup
- Set up notification listeners for foreground and background
- Handle notification taps and navigation

## How to Use

### Testing Notifications Locally

#### 1. Schedule a Local Notification
```javascript
import { scheduleLocalNotification } from '@utils/notificationHelpers';

// Schedule immediate notification
await scheduleLocalNotification({
  title: 'Booking Reminder',
  body: 'Your appointment is in 30 minutes',
  data: { type: 'booking', bookingId: '123' },
  seconds: 0 // immediate
});

// Schedule delayed notification
await scheduleLocalNotification({
  title: 'Appointment Tomorrow',
  body: 'You have an appointment at 2 PM',
  data: { type: 'reminder' },
  seconds: 86400 // 24 hours
});
```

#### 2. Get Push Token
```javascript
import { getExpoPushToken } from '@utils/notificationHelpers';

const token = await getExpoPushToken();
console.log('Push Token:', token);
```

#### 3. Handle Notification Taps
The notification listeners are already set up in `_layout.jsx`. To customize navigation:

```javascript
// In _layout.jsx, update the onTapped callback:
const listeners = setupNotificationListeners(
  (notification) => {
    console.log('Notification received:', notification);
  },
  (response) => {
    const data = response.notification.request.content.data;

    // Navigate based on notification type
    if (data.type === 'booking') {
      router.push(`/bookings/${data.bookingId}`);
    } else if (data.type === 'message') {
      router.push(`/messages/${data.chatId}`);
    }
  }
);
```

### Sending Push Notifications from Backend

#### 1. Store User Push Token
When a user logs in or registers for notifications, send their token to the backend:

```javascript
import { sendPushTokenToServer } from '@utils/notificationHelpers';
import apiClient from '@config/api';

const token = await getExpoPushToken();
if (token) {
  await sendPushTokenToServer(token, apiClient);
}
```

#### 2. Backend Implementation (Node.js/Express)
```javascript
// Backend endpoint to receive push tokens
app.post('/users/push-token', async (req, res) => {
  const { pushToken, platform } = req.body;
  const userId = req.user.id;

  // Store in database
  await User.findByIdAndUpdate(userId, {
    pushToken,
    platform,
    pushTokenUpdatedAt: new Date()
  });

  res.json({ success: true });
});
```

#### 3. Send Push Notification from Backend
```javascript
const { Expo } = require('expo-server-sdk');
const expo = new Expo();

async function sendPushNotification(userToken, title, body, data = {}) {
  const messages = [{
    to: userToken,
    sound: 'default',
    title: title,
    body: body,
    data: data,
    badge: 1,
    priority: 'high',
  }];

  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log('Notification sent:', ticketChunk);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
}

// Example usage
const user = await User.findById(userId);
await sendPushNotification(
  user.pushToken,
  'New Booking',
  'You have a new booking request',
  { type: 'booking', bookingId: '123' }
);
```

## Common Use Cases

### 1. Booking Reminders
```javascript
// When a booking is confirmed
await scheduleLocalNotification({
  title: 'Booking Confirmed',
  body: `Your appointment with ${businessName} is confirmed for ${date}`,
  data: { type: 'booking', bookingId: booking._id },
  seconds: 0
});

// Reminder 1 day before
await scheduleLocalNotification({
  title: 'Appointment Reminder',
  body: 'Your appointment is tomorrow',
  data: { type: 'booking', bookingId: booking._id },
  seconds: secondsUntilDayBefore
});
```

### 2. New Messages
```javascript
// From backend when new message arrives
await sendPushNotification(
  userPushToken,
  'New Message',
  `${senderName}: ${messagePreview}`,
  { type: 'message', chatId: chat._id }
);
```

### 3. Service Updates
```javascript
// When service status changes
await sendPushNotification(
  userPushToken,
  'Service Update',
  'Your grooming service has been completed',
  { type: 'service', serviceId: service._id }
);
```

## Testing on Physical Devices

### Android
1. Build the app: `expo build:android` or use EAS Build
2. Install on device
3. Grant notification permissions when prompted
4. Test by scheduling local notifications or sending from backend

### iOS
1. Build the app: `expo build:ios` or use EAS Build
2. Install on device
3. Grant notification permissions when prompted
4. Note: Push notifications require Apple Developer account and proper certificates

## Important Notes

1. **Physical Device Required**: Push notifications only work on physical devices, not on emulators/simulators
2. **Permissions**: Users must grant notification permissions for the app to receive notifications
3. **Background Notifications**: The current setup supports notifications when:
   - App is in foreground (shows alert)
   - App is in background (shows in notification tray)
   - App is completely closed (shows in notification tray)
4. **Token Storage**: Push tokens are stored locally and should be sent to backend after successful login
5. **Token Refresh**: Implement token refresh logic in case tokens expire or change

## Troubleshooting

### Notifications not showing
1. Check if permissions are granted
2. Verify push token is generated
3. Check console logs for errors
4. Ensure device is not in "Do Not Disturb" mode

### Push token not generated
1. Must be running on physical device
2. Check internet connection
3. Verify expo project ID in app.json matches your Expo account

### Backend notifications not received
1. Verify push token is correctly stored in backend
2. Check Expo push notification service status
3. Validate notification payload format
4. Check backend logs for errors

## Next Steps

1. Integrate with backend API to send/receive push tokens
2. Implement notification-based navigation throughout the app
3. Add notification preferences in user settings
4. Implement notification channels for different types of notifications
5. Add analytics to track notification engagement
