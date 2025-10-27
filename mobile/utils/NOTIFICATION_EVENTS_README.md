# Notification Events System

## Overview
This event system provides real-time badge count updates for notification badges in headers across the app.

## How It Works

The notification badge count is now fetched from the backend API endpoint `/notifications/unread-count` which accurately reflects the read/unread status of notifications based on the `isRead` field in the database.

## Components Updated

### 1. SearchHeader.jsx
- Now uses `/notifications/unread-count` endpoint
- Refreshes every 30 seconds
- Listens to notification events for instant updates

### 2. BusinessHeader.jsx
- Now uses `/notifications/unread-count` endpoint
- Refreshes every 30 seconds
- Listens to notification events for instant updates

## Using Notification Events

When you mark notifications as read, deleted, or perform bulk operations, emit the appropriate event to update all badge counts immediately:

```javascript
import notificationEvents, { NOTIFICATION_EVENTS } from '@utils/notificationEvents';

// After marking a notification as read
await apiClient.patch(`/notifications/${notificationId}/read`);
notificationEvents.emit(NOTIFICATION_EVENTS.NOTIFICATION_READ);

// After deleting a notification
await apiClient.delete(`/notifications/${notificationId}`);
notificationEvents.emit(NOTIFICATION_EVENTS.NOTIFICATION_DELETED);

// After marking all as read
await apiClient.patch('/notifications/read-all');
notificationEvents.emit(NOTIFICATION_EVENTS.ALL_READ);

// Manual refresh (if needed)
notificationEvents.emit(NOTIFICATION_EVENTS.REFRESH_COUNT);
```

## Available Events

- `NOTIFICATION_READ` - Emitted when a single notification is marked as read
- `NOTIFICATION_DELETED` - Emitted when a notification is deleted
- `ALL_READ` - Emitted when all notifications are marked as read
- `REFRESH_COUNT` - Emitted to manually trigger a badge count refresh

## Implementation Example

Here's how to implement in a notifications screen:

```javascript
import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import apiClient from '@config/api';
import notificationEvents, { NOTIFICATION_EVENTS } from '@utils/notificationEvents';

const NotificationItem = ({ notification }) => {
  const handleMarkAsRead = async () => {
    try {
      await apiClient.patch(`/notifications/${notification._id}/read`);
      // Emit event to update badge counts everywhere
      notificationEvents.emit(NOTIFICATION_EVENTS.NOTIFICATION_READ);
      // Refresh your local notification list
      refreshNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <TouchableOpacity onPress={handleMarkAsRead}>
      <Text>{notification.message}</Text>
      {!notification.isRead && <Text>New</Text>}
    </TouchableOpacity>
  );
};
```

## Backend API Endpoints

### Get Unread Count
```
GET /notifications/unread-count
Response: { success: true, data: { count: 5 } }
```

### Mark As Read
```
PATCH /notifications/:id/read
Response: { success: true, data: { ... } }
```

### Mark All As Read
```
PATCH /notifications/read-all
Response: { success: true, data: { modifiedCount: 10 } }
```

### Delete Notification
```
DELETE /notifications/:id
Response: { success: true, message: "Notification deleted" }
```

## Benefits

1. **Real-time Updates** - Badge counts update instantly across all screens
2. **Accurate Counts** - Uses the backend API's `isRead` field as the source of truth
3. **Performance** - Updates triggered by events, not constant polling
4. **Consistency** - All headers show the same count at all times
5. **Scalability** - Easy to add more listeners for other components

## Migration Notes

The current `notifications.jsx` in the business tabs uses bookings as notifications. To fully utilize this system:

1. Create a proper notifications screen that uses `/notifications` endpoint
2. Implement mark as read functionality
3. Emit events when notifications are marked as read/deleted
4. The badge counts will automatically update everywhere

## Future Enhancements

Consider adding:
- Firebase Cloud Messaging for push notifications
- WebSocket connection for instant notification delivery
- Notification sounds/vibrations
- In-app notification toast/banner
