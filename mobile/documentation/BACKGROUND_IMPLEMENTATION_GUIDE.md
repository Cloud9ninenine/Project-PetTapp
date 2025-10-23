# Background Tasks Implementation Guide

## Quick Start

### 1. Register Background Tasks on Login

Update your login screens to register background tasks after successful login.

**File**: `app/(auth)/login.jsx`

Add to imports:
```javascript
import { registerBackgroundFetchAsync } from '@utils/backgroundTasks';
```

Add after successful login (after storing tokens):
```javascript
// After tokens are stored
await AsyncStorage.multiSet([...]);

// Register background fetch for periodic updates
await registerBackgroundFetchAsync();

// Navigate to home screen
router.replace('/(user)/(tabs)/home');
```

### 2. Unregister Background Tasks on Logout

Update both profile screens to unregister background tasks on logout.

**Files**:
- `app/(user)/(tabs)/profile/index.jsx`
- `app/(bsn)/(tabs)/profile/index.jsx`

Add to imports:
```javascript
import { unregisterBackgroundFetchAsync } from '@utils/backgroundTasks';
```

Add to logout function (before clearing storage):
```javascript
// Unregister background tasks
await unregisterBackgroundFetchAsync();

// Clear storage
await AsyncStorage.multiRemove([...]);

// Logout
router.replace('/(auth)/login');
```

### 3. Optional: Check Background Fetch Status

You can check if background fetch is available and enabled:

```javascript
import { checkBackgroundFetchStatus } from '@utils/backgroundTasks';

const status = await checkBackgroundFetchStatus();
// Available, Restricted, or Denied
```

## Customizing Background Tasks

Edit `utils/backgroundTasks.js` to customize what happens during background fetch:

```javascript
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const accessToken = await AsyncStorage.getItem('accessToken');

    if (!accessToken) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // YOUR CUSTOM LOGIC HERE:

    // Example 1: Check for new bookings
    const bookings = await apiClient.get('/bookings/new');
    if (bookings.data.length > 0) {
      await scheduleLocalNotification({
        title: 'New Booking',
        body: `You have ${bookings.data.length} new booking(s)`,
      });
    }

    // Example 2: Sync user data
    const userData = await apiClient.get('/users/me');
    await AsyncStorage.setItem('userData', JSON.stringify(userData.data));

    // Example 3: Update badge count
    const unreadCount = await apiClient.get('/notifications/unread-count');
    await setBadgeCount(unreadCount.data.count);

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});
```

## Complete Integration Example

### Login Screen (Recommended)

```javascript
const handleLogin = async () => {
  try {
    // 1. Login API call
    const loginResponse = await apiClient.post('/auth/login', {
      email: email.trim(),
      password: password,
    });

    if (loginResponse.status === 200 && loginResponse.data?.tokens) {
      const { user, tokens } = loginResponse.data;

      // 2. Store authentication data
      await AsyncStorage.multiSet([
        ['accessToken', tokens.accessToken],
        ['refreshToken', tokens.refreshToken],
        ['userRole', user.role],
        ['userId', user._id || user.id || ''],
        ['userEmail', user.email || ''],
        ['userData', JSON.stringify(user)],
      ]);

      // 3. Register for push notifications
      await registerForPushNotifications();

      // 4. Send push token to server
      const pushToken = await getExpoPushToken();
      if (pushToken) {
        await sendPushTokenToServer(pushToken, apiClient);
      }

      // 5. Register background fetch
      await registerBackgroundFetchAsync();

      // 6. Navigate based on role
      if (user.role === "business-owner") {
        router.replace("/(bsn)/(tabs)/home");
      } else if (user.role === "pet-owner") {
        router.replace("/(user)/(tabs)/home");
      }
    }
  } catch (error) {
    console.error('Login error:', error);
    Alert.alert("Login Failed", error.message);
  }
};
```

### Logout Function (Recommended)

```javascript
const confirmLogout = async () => {
  setIsLoggingOut(true);
  try {
    // 1. Unregister background tasks
    await unregisterBackgroundFetchAsync();

    // 2. Clear notification badge
    await clearBadgeCount();

    // 3. Cancel all scheduled notifications
    await cancelAllScheduledNotifications();

    // 4. Clear all stored data
    await AsyncStorage.multiRemove([
      'accessToken',
      'refreshToken',
      'userRole',
      'userId',
      'userEmail',
      'userData',
      'expoPushToken',
    ]);

    // 5. Call backend logout
    try {
      await apiClient.post('/auth/logout');
    } catch (apiError) {
      console.log('API logout failed:', apiError);
    }

    // 6. Navigate to login
    router.replace('/(auth)/login');
  } catch (error) {
    console.error('Logout error:', error);
    router.replace('/(auth)/login');
  } finally {
    setIsLoggingOut(false);
  }
};
```

## Testing Your Implementation

### Test 1: Background Fetch Registration
```javascript
// After login, check if registered
import * as TaskManager from 'expo-task-manager';

const isRegistered = await TaskManager.isTaskRegisteredAsync('background-fetch-task');
console.log('Background fetch registered:', isRegistered); // Should be true
```

### Test 2: Manual Trigger (Development Only)
```javascript
// Force trigger background task for testing
import * as BackgroundFetch from 'expo-background-fetch';

await BackgroundFetch.setMinimumIntervalAsync(1); // 1 second (dev only!)
```

### Test 3: Check Task Execution
```javascript
// View console logs after background fetch runs
// You should see: "Background fetch task running..."
```

## Common Issues & Solutions

### Issue 1: Background Fetch Not Running
**Symptoms**: Background task never executes

**Solutions**:
1. Wait 15-30 minutes after registration
2. Ensure app has been used for 24-48 hours (iOS learns patterns)
3. Check Background App Refresh is enabled in Settings
4. Disable Low Power Mode
5. Keep app in background, don't force close

### Issue 2: Task Registered Multiple Times
**Symptoms**: Duplicate background tasks

**Solutions**:
```javascript
// Always check before registering
const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
if (!isRegistered) {
  await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {...});
}
```

### Issue 3: Background Task Crashes
**Symptoms**: Task fails silently

**Solutions**:
1. Add comprehensive error handling
2. Keep tasks under 30 seconds
3. Don't rely on external dependencies
4. Test with network offline

### Issue 4: Not Unregistering on Logout
**Symptoms**: Tasks continue after logout

**Solutions**:
```javascript
// Always unregister before clearing storage
await unregisterBackgroundFetchAsync();
await AsyncStorage.clear(); // Then clear
```

## Performance Best Practices

1. **Keep Tasks Short** (<30 seconds)
   ```javascript
   // Good
   const data = await quickAPICall();

   // Bad
   for (let i = 0; i < 1000; i++) {
     await slowOperation();
   }
   ```

2. **Batch Network Requests**
   ```javascript
   // Good - Single request
   const data = await api.get('/sync-all');

   // Bad - Multiple requests
   await api.get('/bookings');
   await api.get('/messages');
   await api.get('/notifications');
   ```

3. **Handle Failures Gracefully**
   ```javascript
   try {
     const data = await api.get('/data');
   } catch (error) {
     // Don't crash - just return
     return BackgroundFetch.BackgroundFetchResult.Failed;
   }
   ```

4. **Check Authentication First**
   ```javascript
   const token = await AsyncStorage.getItem('accessToken');
   if (!token) {
     // User logged out, skip task
     return BackgroundFetch.BackgroundFetchResult.NoData;
   }
   ```

## Advanced Usage

### Conditional Background Tasks

Only sync certain data based on user preferences:

```javascript
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  const preferences = await AsyncStorage.getItem('backgroundSyncPreferences');
  const config = JSON.parse(preferences || '{}');

  if (config.syncBookings) {
    await syncBookings();
  }

  if (config.syncMessages) {
    await syncMessages();
  }

  return BackgroundFetch.BackgroundFetchResult.NewData;
});
```

### Priority-Based Syncing

Sync important data first in case task is interrupted:

```javascript
const syncData = async () => {
  // High priority - always sync
  await syncCriticalData();

  // Medium priority - sync if time permits
  const startTime = Date.now();
  if (Date.now() - startTime < 20000) {
    await syncNormalData();
  }

  // Low priority - only if plenty of time
  if (Date.now() - startTime < 15000) {
    await syncNonEssentialData();
  }
};
```

## Next Steps

1. Implement login integration
2. Implement logout integration
3. Customize background task logic
4. Test thoroughly on physical devices
5. Monitor performance and battery usage
6. Adjust fetch intervals based on usage patterns

## Resources

- [Expo Background Fetch Docs](https://docs.expo.dev/versions/latest/sdk/background-fetch/)
- [Task Manager API](https://docs.expo.dev/versions/latest/sdk/task-manager/)
- [iOS Background Execution](https://developer.apple.com/documentation/uikit/app_and_environment/scenes/preparing_your_ui_to_run_in_the_background)
- [Android Background Work](https://developer.android.com/guide/background)
