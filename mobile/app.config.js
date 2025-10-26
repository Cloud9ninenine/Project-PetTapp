import 'dotenv/config';

export default {
  expo: {
    name: "PetTapp",
    slug: "mobile",
    version: "1.0.1",
    sdkVersion: "54.0.0",
    orientation: "portrait",
    icon: "./app/assets/images/AppIcon.png",
    scheme: "pettapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      bundleIdentifier: "com.leleoj.pettapp",
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "This app needs access to your location to show nearby pet services and provide directions.",
        ITSAppUsesNonExemptEncryption: false,
        UIBackgroundModes: [
          "remote-notification",
          "fetch"
        ]
      },
      googleServicesFile: "./GoogleService-Info.plist"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./app/assets/images/PetTapp-splash.png",
        backgroundColor: "#1C86FF"
      },
      edgeToEdgeEnabled: true,
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.WAKE_LOCK",
        "android.permission.VIBRATE"
      ],
      config: {
        googleMaps: {
          apiKey: "YOUR_GOOGLE_MAPS_API_KEY"
        }
      },
      package: "com.leleoj.pettapp",
      googleServicesFile: "./google-services.json"
    },
    notification: {
      icon: "./app/assets/images/AppIcon.png",
      color: "#1C86FF",
      iosDisplayInForeground: true,
      androidMode: "default",
      androidCollapsedTitle: "{{unread_count}} new notifications"
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./app/assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./app/assets/images/PetTappLogoInverted.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#FFFFFF"
        }
      ],
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow PetTapp to use your location to find nearby pet services."
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./app/assets/images/AppIcon.png",
          color: "#1C86FF",
          sounds: [],
          // Use default mode for development builds
          mode: "default"
        }
      ],
      [
        "expo-build-properties",
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            buildToolsVersion: "35.0.0"
          },
          ios: {
            deploymentTarget: "15.1"
          }
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "610db6c5-defb-4390-887c-9dfd773742ef"
      },
      // Firebase environment variables
      VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY,
      VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID,
      VITE_FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET,
      VITE_FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID,
    }
  }
};
