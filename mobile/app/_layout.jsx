import { useEffect, useRef, useState } from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from 'expo-notifications';
import { registerForPushNotifications, setupNotificationListeners, clearBadgeCount } from "@utils/notificationHelpers";
import { initializeFirebaseAuth } from "@utils/firebaseAuthPersistence";
import { wakeServerSequence, initializeAppStateListener } from "@config/api";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Configure notification behavior when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  const notificationListener = useRef();
  const responseListener = useRef();
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);

  const [loaded, error] = useFonts({
    'SFProBold': require("@assets/fonts/SF-Pro-Rounded-Bold.otf"),
    'SFProSB': require("@assets/fonts/SF-Pro-Rounded-Semibold.otf"),
    'SFProMedium': require("@assets/fonts/SF-Pro-Rounded-Medium.otf"),
    'SFProReg': require("@assets/fonts/SF-Pro-Rounded-Regular.otf"),
    'SFProLight': require("@assets/fonts/SF-Pro-Rounded-Light.otf"),
  });

  // Handle font loading errors
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Hide splash when fonts are ready and wake server
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();

      // Wake server on app launch (non-blocking)
      wakeServerSequence().then(() => {
        console.log('Server wake sequence completed on app launch');
      }).catch((error) => {
        console.log('Server wake sequence failed (non-critical):', error);
      });
    }
  }, [loaded]);

  // Initialize keep-alive mechanism with app state management
  useEffect(() => {
    console.log('Initializing server keep-alive listener...');
    const keepAliveSubscription = initializeAppStateListener();

    return () => {
      if (keepAliveSubscription) {
        keepAliveSubscription.remove();
      }
    };
  }, []);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App has come to the foreground!');
        // Clear badge count when app comes to foreground
        clearBadgeCount();

        // Wake server when returning from background (only if user is logged in)
        // This ensures server is ready for any immediate requests
        try {
          const userId = await AsyncStorage.getItem('userId');
          if (userId) {
            console.log('User logged in, waking server...');
            // Non-blocking wake sequence
            wakeServerSequence().catch((error) => {
              console.log('Server wake on resume failed (non-critical):', error);
            });

            // Initialize Firebase auth
            await initializeFirebaseAuth();
            console.log('Firebase auth initialized on app foreground');
          } else {
            console.log('No userId found, skipping server wake and Firebase initialization');
          }
        } catch (error) {
          console.error('Failed to initialize on app foreground:', error);
        }

        // Additional logic when app returns to foreground:
        // - Server wake sequence is handled above
        // - Keep-alive automatically starts (handled by initializeAppStateListener)
        // - Refresh data, sync with server, check for updates can be added here
      } else if (nextAppState.match(/inactive|background/)) {
        console.log('App has gone to the background!');

        // Cleanup logic when app goes to background:
        // - Keep-alive automatically stops (handled by initializeAppStateListener)
        // - Save state, cancel pending operations, pause timers can be added here
      }

      appState.current = nextAppState;
      setAppStateVisible(appState.current);
      console.log('AppState:', appState.current);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Set up push notifications
  useEffect(() => {
    // Register for push notifications
    registerForPushNotifications();

    // Set up notification listeners
    const listeners = setupNotificationListeners(
      (notification) => {
        console.log('Notification received in foreground:', notification);
        // Handle notification received while app is open
        // You can show an in-app alert or update UI here
      },
      (response) => {
        console.log('Notification tapped:', response);
        // Handle navigation based on notification data
        // You can add custom navigation logic here based on response.notification.request.content.data

        const data = response.notification.request.content.data;

        // Example navigation based on notification type:
        // if (data.type === 'booking') {
        //   router.push(`/bookings/${data.bookingId}`);
        // } else if (data.type === 'message') {
        //   router.push(`/messages/${data.chatId}`);
        // }
      }
    );

    notificationListener.current = listeners.notificationListener;
    responseListener.current = listeners.responseListener;

    // Cleanup listeners on unmount
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  if (!loaded) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="welcome"
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="(auth)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(user)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(bsn)"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
