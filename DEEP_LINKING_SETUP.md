# Deep Linking / Universal Links Setup

This guide explains how to set up deep linking so that web links automatically open in the mobile app if installed.

## What's Already Done ✅

1. **App Configuration** - Updated `mobile/app.config.js` with:
   - Universal Links (iOS)
   - App Links (Android)
   - Associated domains configuration

2. **Verification Files** - Created in `petTapp-web/public/.well-known/`:
   - `apple-app-site-association` - For iOS Universal Links
   - `assetlinks.json` - For Android App Links

## What You Need to Do 📝

### For iOS (Universal Links):

1. **Get your Apple Team ID:**
   - Go to https://developer.apple.com/account
   - Sign in with your Apple Developer account
   - Your Team ID is shown in the top right (10 characters, like `ABC123XYZ4`)

2. **Update the verification file:**
   - Open `petTapp-web/public/.well-known/apple-app-site-association`
   - Replace `TEAMID` with your actual Apple Team ID in two places:
     ```json
     "appID": "YOUR_TEAM_ID.com.leleoj.pettapp"
     ```

### For Android (App Links):

1. **Get your SHA-256 fingerprint:**

   For debug builds:
   ```bash
   cd mobile/android
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

   For release builds (if you have a release keystore):
   ```bash
   keytool -list -v -keystore your-release-key.keystore -alias your-key-alias
   ```

2. **Update the verification file:**
   - Copy the SHA-256 fingerprint (format: `AA:BB:CC:DD:...`)
   - Open `petTapp-web/public/.well-known/assetlinks.json`
   - Replace `REPLACE_WITH_YOUR_SHA256_FINGERPRINT` with your fingerprint
   - Remove the colons from the fingerprint

### Deploy to Vercel:

1. **Commit and push the changes:**
   ```bash
   cd petTapp-web
   git add public/.well-known/*
   git commit -m "Add deep linking verification files"
   git push
   ```

2. **Verify the files are accessible:**
   - iOS: https://pettapp-seven.vercel.app/.well-known/apple-app-site-association
   - Android: https://pettapp-seven.vercel.app/.well-known/assetlinks.json
   - Both should return JSON (not 404)

3. **Configure Vercel headers** (if needed):
   - Create `vercel.json` in the root of petTapp-web if it doesn't exist:
   ```json
   {
     "headers": [
       {
         "source": "/.well-known/apple-app-site-association",
         "headers": [
           {
             "key": "Content-Type",
             "value": "application/json"
           }
         ]
       },
       {
         "source": "/.well-known/assetlinks.json",
         "headers": [
           {
             "key": "Content-Type",
             "value": "application/json"
           }
         ]
       }
     ]
   }
   ```

### Rebuild Your Mobile App:

After updating the configuration, rebuild your app:

```bash
cd mobile

# For iOS
npx expo run:ios

# For Android
npx expo run:android

# Or create a new build
eas build --platform all
```

## How to Test 🧪

### Testing on iOS:
1. Build and install the app on your device
2. Open Safari and navigate to: `https://pettapp-seven.vercel.app/pet-owner/businesses/[some-id]`
3. Tap the link - it should open directly in the app

### Testing on Android:
1. Build and install the app on your device
2. Open any browser or messaging app
3. Share a business link or tap on: `https://pettapp-seven.vercel.app/pet-owner/businesses/[some-id]`
4. Android will show "Open with PetTapp" option
5. Select "Always" to make it the default

### Testing the Share Feature:
1. Open the app
2. Go to any business details page
3. Tap the Share button
4. Share via Messenger/WhatsApp/SMS
5. On another device with the app installed, tap the shared link
6. It should open directly in the app!

## Troubleshooting 🔧

### iOS Universal Links not working:
- Verify your Team ID is correct
- Check that the AASA file is accessible at the URL
- Uninstall and reinstall the app
- Universal Links don't work in the same app that opens them (test with Safari or Messages)

### Android App Links not working:
- Verify SHA-256 fingerprint is correct
- Check assetlinks.json is accessible
- Make sure `autoVerify: true` is set in app.config.js
- Clear app data and retry

### Links still opening in browser:
- Make sure you rebuilt the app after configuration changes
- Try the "long press" on a link and select "Open with PetTapp"
- On Android, check Settings > Apps > Default apps > Opening links

## Additional Resources 📚

- [Expo Linking Documentation](https://docs.expo.dev/guides/linking/)
- [iOS Universal Links](https://developer.apple.com/ios/universal-links/)
- [Android App Links](https://developer.android.com/training/app-links)
