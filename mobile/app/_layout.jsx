import { useEffect } from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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

  // Hide splash when fonts are ready
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

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
