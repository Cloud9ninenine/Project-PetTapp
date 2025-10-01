# Google Maps Setup Instructions

## Important: Add Google Maps API Key

To use the map functionality in the app, you need to add a Google Maps API key:

### 1. Get a Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
4. Create credentials → API Key
5. Restrict the API key to your app (recommended)

### 2. Add the API Key to app.json

Replace `YOUR_GOOGLE_MAPS_API_KEY` in `app.json` (line 30) with your actual API key:

```json
"android": {
  "config": {
    "googleMaps": {
      "apiKey": "YOUR_ACTUAL_API_KEY_HERE"
    }
  }
}
```

### 3. For iOS (if needed)
The app.json is already configured for iOS permissions.

### 4. Rebuild the app
After adding the API key, rebuild your app:
```bash
npx expo prebuild --clean
```

## Dependencies Installed
- ✅ `react-native-maps` (already installed)
- ✅ `expo-location` (newly installed)

## Permissions Configured
- ✅ Android: `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`
- ✅ iOS: `NSLocationWhenInUseUsageDescription`

## Features Implemented
- Real-time user location tracking
- Service location markers on map
- Route visualization (polyline)
- Get directions (opens Google Maps)
- Distance and estimated time display
- Call and Book actions
- Responsive design
