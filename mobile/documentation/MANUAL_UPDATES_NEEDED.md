# Manual Updates Required for Complete Integration

Some logout functions need to be manually updated to properly clear stored data. Follow these instructions:

## 1. Update User Profile Logout

**File**: `mobile/app/(user)/(tabs)/profile/index.jsx`

### Step 1: Add AsyncStorage Import
At the top of the file, add AsyncStorage to the imports:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
```

### Step 2: Update confirmLogout Function
Find the `confirmLogout` function (around line 308) and replace it with:

```javascript
const confirmLogout = async () => {
  setShowLogoutModal(false);
  setIsLoggingOut(true);
  try {
    // Clear all stored authentication data
    await AsyncStorage.multiRemove([
      'accessToken',
      'refreshToken',
      'userRole',
      'userId',
      'userEmail',
      'userData',
      'expoPushToken',
    ]);
    console.log('User data cleared from storage');

    // Call logout API endpoint
    try {
      await apiClient.post('/auth/logout');
    } catch (apiError) {
      console.log('API logout failed, but local data cleared:', apiError.message);
    }

    // Navigate to login screen
    router.replace('/(auth)/login');
  } catch (error) {
    console.error('Logout error:', error);
    // Even if there's an error, try to navigate to login
    router.replace('/(auth)/login');
  } finally {
    setIsLoggingOut(false);
  }
};
```

---

## 2. Update Business Owner Profile Logout

**File**: `mobile/app/(bsn)/(tabs)/profile/index.jsx`

### Step 1: Add AsyncStorage Import
At the top of the file, add AsyncStorage to the imports:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
```

### Step 2: Update Logout Handler
Find the logout button handler (around line 514) and replace the `onPress` function with:

```javascript
onPress={async () => {
  Alert.alert(
    'Logout',
    'Are you sure you want to logout?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            // Clear all stored authentication data
            await AsyncStorage.multiRemove([
              'accessToken',
              'refreshToken',
              'userRole',
              'userId',
              'userEmail',
              'userData',
              'expoPushToken',
            ]);
            console.log('User data cleared from storage');

            // Call logout API endpoint
            try {
              await apiClient.post('/auth/logout');
            } catch (apiError) {
              console.log('API logout failed, but local data cleared:', apiError.message);
            }

            // Navigate to login screen
            router.replace('/(auth)/login');
          } catch (error) {
            console.error('Logout error:', error);
            // Even if there's an error, try to navigate to login
            router.replace('/(auth)/login');
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]
  );
}}
```

---

## 3. Optional: Add Background Task Integration

If you want to enable background syncing, add these to login and logout:

### Login Integration (`app/(auth)/login.jsx`)

**Add imports:**
```javascript
import { registerForPushNotifications, getExpoPushToken, sendPushTokenToServer } from "@utils/notificationHelpers";
import { registerBackgroundFetchAsync } from '@utils/backgroundTasks';
```

**After storing tokens (around line 67), add:**
```javascript
// Register for push notifications
await registerForPushNotifications();

// Send push token to server
const pushToken = await getExpoPushToken();
if (pushToken) {
  await sendPushTokenToServer(pushToken, apiClient);
}

// Register background fetch
await registerBackgroundFetchAsync();
```

### Logout Integration (Both Profile Screens)

**Add imports:**
```javascript
import { unregisterBackgroundFetchAsync } from '@utils/backgroundTasks';
import { clearBadgeCount, cancelAllScheduledNotifications } from '@utils/notificationHelpers';
```

**Before clearing AsyncStorage, add:**
```javascript
// Unregister background tasks
await unregisterBackgroundFetchAsync();

// Clear notification badge
await clearBadgeCount();

// Cancel all scheduled notifications
await cancelAllScheduledNotifications();
```

---

## 4. Verification

After making these changes, test the following:

### Test 1: Logout Clears Data
1. Login to the app
2. Close the app and reopen (should auto-login)
3. Logout from profile screen
4. Close the app and reopen
5. ✅ Should show welcome screen (not auto-login)

### Test 2: Background Tasks
1. Login to the app
2. Check console for "Background fetch registered successfully"
3. Logout
4. Check console for "Background fetch unregistered"

### Test 3: Push Notifications
1. Login to the app
2. Check console for push token
3. Test receiving a notification
4. ✅ Should receive notification even when app is closed

---

## Why These Updates Are Important

### Without AsyncStorage.multiRemove:
- User data remains in storage after logout
- App will auto-login even after logout
- Tokens persist unnecessarily
- Security risk if device is shared

### Without Background Task Unregister:
- Background tasks continue after logout
- Unnecessary battery drain
- API calls with invalid tokens
- Privacy concern (syncing after logout)

### Without Notification Cleanup:
- Old notifications may still trigger
- Badge count not reset
- Push tokens not cleared from server
- Unwanted notifications after logout

---

## Quick Checklist

- [ ] Added AsyncStorage import to user profile
- [ ] Updated confirmLogout in user profile
- [ ] Added AsyncStorage import to business profile
- [ ] Updated logout handler in business profile
- [ ] (Optional) Added background task registration to login
- [ ] (Optional) Added background task cleanup to logout
- [ ] Tested logout clears all data
- [ ] Tested app doesn't auto-login after logout
- [ ] Tested push notifications still work after login

---

## Need Help?

If you encounter any issues:

1. Check console logs for errors
2. Verify AsyncStorage is imported correctly
3. Ensure functions are called in correct order
4. Test on physical device (not simulator)
5. Check that tokens are being stored during login

Refer to the comprehensive documentation files for more details:
- `NOTIFICATION_SETUP.md`
- `SESSION_PERSISTENCE_UPDATE.md`
- `BACKGROUND_BEHAVIOR.md`
- `BACKGROUND_IMPLEMENTATION_GUIDE.md`
