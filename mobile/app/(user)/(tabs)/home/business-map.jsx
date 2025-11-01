import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import Header from '@components/Header';

export default function BusinessMapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const { latitude, longitude, businessName } = params;

  const generateMapHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          body { margin: 0; padding: 0; }
          #map { height: 100vh; width: 100vw; border: 0; }
        </style>
      </head>
      <body>
        <iframe
          id="map"
          src="https://maps.google.com/maps?q=${latitude},${longitude}&hl=en&z=15&output=embed"
          frameborder="0"
          scrolling="no"
          marginheight="0"
          marginwidth="0"
          loading="lazy"
        ></iframe>
      </body>
      </html>
    `;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title={businessName || "Business Location"} showBack={true} />
      <View style={styles.mapContainer}>
        <WebView
          source={{ html: generateMapHTML() }}
          style={styles.map}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
