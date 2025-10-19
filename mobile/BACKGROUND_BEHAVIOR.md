# Background Behavior & App Lifecycle Management

## Overview
PetTapp has been configured to work properly when the app is not being used, minimized, or completely closed. This document explains how the app behaves in different states and what capabilities are available.

## App States

### 1. **Foreground (Active)**
- App is visible and in use
- All features fully functional
- Real-time updates available
- User interactions processed immediately

### 2. **Background (Inactive)**
- App is minimized but still running in memory
- Limited processing capabilities
- Can receive and display notifications
- AppState listener tracks transitions

### 3. **Closed (Terminated)**
- App is completely closed/killed
- No code execution except:
  - Push notifications can wake the app
  - Background fetch tasks (iOS every 15+ min, Android varies)
  - Scheduled local notifications

## Implemented Features

### AppState Monitoring
The app now tracks when it enters/exits foreground:

**Location**: `app/_layout.jsx`

```javascript
AppState.addEventListener('change', nextAppState => {
  if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
    // App came to foreground
    - Clears notification badge
    - Can refresh data
    - Can sync with server
  } else if (nextAppState.match(/inactive|background/)) {
    // App went to background
    - Can save state
    - Can cancel pending operations
  }
});
```

### Background Notifications

#### Push Notifications
- **When app is open**: Shows alert in-app
- **When app is background**: Shows in notification tray
- **When app is closed**: Shows in notification tray
- **On tap**: Opens app and can navigate to specific screen

#### Local Notifications
- Can be scheduled even when app is closed
- Will trigger at specified time
- Persistent across app restarts

### Background Fetch (Periodic Tasks)
Allows the app to run code periodically even when closed:

**iOS**: Minimum 15 minutes between fetches
**Android**: Varies by system (15-30 minutes typical)

**Configured in**: `utils/backgroundTasks.js`

**Current capabilities**:
- Check for new notifications
- Sync data with server
- Update cached content
- Refresh user data

**Usage**:
```javascript
import { registerBackgroundFetchAsync } from '@utils/backgroundTasks';

// Call after user logs in
await registerBackgroundFetchAsync();
```

### Session Persistence
- User remains logged in after closing app
- Authentication tokens stored securely
- Auto-login on app restart
- Only logs out on explicit logout action

## Platform-Specific Behavior

### iOS
**Background Modes Enabled**:
- `remote-notification` - Receive push notifications
- `fetch` - Background fetch for periodic updates

**Limitations**:
- Background fetch limited to ~15 minute intervals
- System decides exact timing (not guaranteed)
- Limited to 30 seconds execution time per fetch
- Background tasks may be suspended if battery is low

**Best Practices**:
- Keep background tasks short (<30 sec)
- Handle task cancellation gracefully
- Don't rely on precise timing

### Android
**Permissions Added**:
- `POST_NOTIFICATIONS` - Display notifications
- `RECEIVE_BOOT_COMPLETED` - Start after device restart
- `WAKE_LOCK` - Keep device awake for tasks

**Limitations**:
- Doze mode restricts background activity
- Background services may be killed on low memory
- WorkManager used for reliable background work

**Best Practices**:
- Use `setExactAndAllowWhileIdle()` for critical tasks
- Handle process death gracefully
- Test on different Android versions

## What Works When App is Not Open

### ✅ Works
1. **Push Notifications**
   - Receive notifications from server
   - Display in notification tray
   - Play notification sound
   - Update badge count

2. **Scheduled Local Notifications**
   - Trigger at scheduled time
   - Even if app is closed

3. **Background Fetch** (Limited)
   - Periodic data sync (15-30 min intervals)
   - Check for updates
   - Refresh cache

4. **Location Updates** (If enabled)
   - Can track significant location changes
   - Geofencing works in background

### ❌ Doesn't Work
1. **Real-time Updates**
   - WebSocket connections closed
   - No live data streaming

2. **Precise Timers**
   - setTimeout/setInterval don't run
   - Use scheduled notifications instead

3. **Continuous Processing**
   - Can't run continuous tasks
   - Limited to short fetch periods

4. **User Interface Updates**
   - UI doesn't update until app reopened

## Use Cases & Solutions

### Use Case 1: Booking Reminders
**Requirement**: Remind user 1 hour before appointment

**Solution**: Schedule local notification
```javascript
import { scheduleLocalNotification } from '@utils/notificationHelpers';

await scheduleLocalNotification({
  title: 'Appointment Reminder',
  body: 'Your grooming appointment is in 1 hour',
  data: { type: 'booking', bookingId: '123' },
  seconds: 3600, // 1 hour
});
```

### Use Case 2: New Message Notifications
**Requirement**: Notify user of new messages even when app is closed

**Solution**: Server sends push notification
```javascript
// Backend sends push notification
POST https://exp.host/--/api/v2/push/send
{
  "to": "ExponentPushToken[...]",
  "title": "New Message",
  "body": "You have a new message from PetGroomers",
  "data": { "type": "message", "chatId": "456" }
}
```

### Use Case 3: Sync User Data Periodically
**Requirement**: Keep user data fresh even when app is not used

**Solution**: Background fetch
```javascript
// In backgroundTasks.js
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  // Fetch latest bookings
  const response = await api.get('/bookings');

  // Update local cache
  await AsyncStorage.setItem('cachedBookings', JSON.stringify(response.data));

  return BackgroundFetch.BackgroundFetchResult.NewData;
});
```

### Use Case 4: Location-Based Notifications
**Requirement**: Notify when near a booked pet service

**Solution**: Geofencing + local notifications
```javascript
// Set up geofence for business location
await Location.startGeofencingAsync('BUSINESS_GEOFENCE', [
  {
    latitude: business.latitude,
    longitude: business.longitude,
    radius: 500, // meters
  }
]);

// Trigger notification on enter
```

## Testing Background Behavior

### Test Scenario 1: Receive Notification When Closed
1. Close the app completely
2. Send push notification from backend
3. ✅ Notification should appear in tray
4. Tap notification
5. ✅ App should open and navigate to content

### Test Scenario 2: Scheduled Notification
1. Schedule notification for 1 minute in future
2. Close the app
3. Wait 1 minute
4. ✅ Notification should trigger

### Test Scenario 3: Background Fetch
1. Enable background fetch
2. Close the app
3. Wait 15-30 minutes
4. Reopen app
5. ✅ Check console for "Background fetch task running"

### Test Scenario 4: Session Persistence
1. Log in to app
2. Use app normally
3. Close app completely
4. Reopen app
5. ✅ Should auto-login without credentials

## Troubleshooting

### Notifications Not Received When Closed
**Possible Causes**:
- Notifications disabled in system settings
- Invalid push token
- Server not sending notifications correctly

**Solutions**:
- Check Settings > PetTapp > Notifications
- Verify push token registration
- Test with Expo Push Notification Tool

### Background Fetch Not Running
**Possible Causes**:
- Low battery mode enabled
- App recently installed (needs time to learn usage patterns)
- Background App Refresh disabled (iOS)

**Solutions**:
- Disable low power mode
- Wait 24-48 hours for system to learn patterns
- Enable Settings > PetTapp > Background App Refresh

### App Logs Out After Closing
**Possible Causes**:
- AsyncStorage not persisting
- Tokens being cleared unintentionally
- Storage permissions issue

**Solutions**:
- Check AsyncStorage permissions
- Verify logout code not running on startup
- Check console for storage errors

## Performance Considerations

### Battery Impact
- Push notifications: Minimal impact
- Background fetch: Low impact (runs ~4-6 times/day typically)
- Location tracking: Higher impact if continuous

**Optimization Tips**:
- Use geofencing instead of continuous location
- Keep background tasks short
- Batch network requests

### Data Usage
- Background fetch uses minimal data
- Push notifications are very small
- Sync only essential data in background

### Storage
- Session data: <1 MB
- Cached images: Varies
- Notifications: Minimal

**Cleanup Strategy**:
- Clear old cached data periodically
- Limit stored notifications
- Compress large data

## Security Considerations

### Token Storage
- Tokens stored in AsyncStorage (encrypted on device)
- Not accessible by other apps
- Cleared on app uninstall
- Cleared on explicit logout

### Background Operations
- Background tasks can't access secure data without tokens
- Network requests still require valid authentication
- Push notifications don't contain sensitive data

### Best Practices
1. Don't store passwords
2. Use refresh tokens properly
3. Validate tokens on each API request
4. Clear data on logout
5. Use HTTPS for all requests

## Future Enhancements

Consider adding:
1. **Background Location Tracking** - For delivery tracking
2. **Geofencing** - Location-based notifications
3. **Background Audio** - For pet training videos
4. **HealthKit Integration** - Track pet health data
5. **Calendar Integration** - Sync appointments
6. **Siri Shortcuts** - Voice commands
7. **Widgets** - Home screen quick access

## References

- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Background Fetch](https://docs.expo.dev/versions/latest/sdk/background-fetch/)
- [Expo Task Manager](https://docs.expo.dev/versions/latest/sdk/task-manager/)
- [React Native AppState](https://reactnative.dev/docs/appstate)
- [iOS Background Modes](https://developer.apple.com/documentation/usernotifications)
- [Android Background Work](https://developer.android.com/guide/background)
