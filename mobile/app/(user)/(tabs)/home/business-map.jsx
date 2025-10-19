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
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { height: 100vh; width: 100vw; }
          .leaflet-popup-content-wrapper {
            border-radius: 8px;
          }
          .leaflet-popup-content {
            margin: 13px 19px;
            font-size: 14px;
            font-weight: 600;
            color: #1C86FF;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map').setView([${latitude}, ${longitude}], 15);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(map);

          var customIcon = L.divIcon({
            className: 'custom-marker',
            html: '<div style="background-color: #1C86FF; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"><div style="width: 10px; height: 10px; background-color: white; border-radius: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"></div></div>',
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30]
          });

          var marker = L.marker([${latitude}, ${longitude}], { icon: customIcon }).addTo(map);
          marker.bindPopup("<b>${businessName}</b>").openPopup();
        </script>
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
