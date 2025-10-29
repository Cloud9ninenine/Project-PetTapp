import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

export default function MapPicker({ initialLocation, onLocationSelect, onBack, addressLabel }) {
  const [selectedLocation, setSelectedLocation] = useState(
    initialLocation || { latitude: 14.5995, longitude: 120.9842 } // Default to Manila
  );

  const getMapHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            #map {
              width: 100%;
              height: 100vh;
            }
            .info-box {
              position: absolute;
              top: 10px;
              left: 50%;
              transform: translateX(-50%);
              background: white;
              padding: 12px 20px;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              z-index: 1000;
              text-align: center;
            }
            .info-title {
              font-weight: bold;
              color: #1C86FF;
              margin-bottom: 4px;
            }
            .info-coords {
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="info-box">
            <div class="info-title">📍 Tap on the map to select location</div>
            <div class="info-coords" id="coords">${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}</div>
          </div>
          <div id="map"></div>
          <script>
            var map = L.map('map', {
              zoomControl: false
            }).setView([${selectedLocation.latitude}, ${selectedLocation.longitude}], 15);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; OpenStreetMap contributors',
              maxZoom: 19
            }).addTo(map);

            // Add zoom control to bottom right
            L.control.zoom({
              position: 'bottomright'
            }).addTo(map);

            // Custom draggable marker
            var customIcon = L.divIcon({
              className: 'custom-marker',
              html: '<div style="background-color: #1C86FF; width: 40px; height: 40px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4);"><div style="width: 14px; height: 14px; background-color: white; border-radius: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(45deg);"></div></div>',
              iconSize: [40, 40],
              iconAnchor: [20, 40]
            });

            var marker = L.marker([${selectedLocation.latitude}, ${selectedLocation.longitude}], {
              icon: customIcon,
              draggable: true
            }).addTo(map);

            // Update coordinates display
            function updateCoords(lat, lng) {
              document.getElementById('coords').textContent = lat.toFixed(6) + ', ' + lng.toFixed(6);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                latitude: lat,
                longitude: lng
              }));
            }

            // When marker is dragged
            marker.on('dragend', function(e) {
              var position = marker.getLatLng();
              updateCoords(position.lat, position.lng);
            });

            // When map is clicked
            map.on('click', function(e) {
              marker.setLatLng(e.latlng);
              updateCoords(e.latlng.lat, e.latlng.lng);
            });

            // Locate user button
            var locateButton = L.control({position: 'bottomleft'});
            locateButton.onAdd = function(map) {
              var div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
              div.innerHTML = '<a href="#" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: white; text-decoration: none; color: #333; font-size: 20px;" title="My Location">📍</a>';
              div.onclick = function(e) {
                e.preventDefault();
                // Check if geolocation is available
                if (!navigator.geolocation) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'locationError',
                    message: 'Geolocation is not supported by this device'
                  }));
                  return;
                }
                map.locate({setView: true, maxZoom: 16});
              };
              return div;
            };
            locateButton.addTo(map);

            // When location is found
            map.on('locationfound', function(e) {
              marker.setLatLng(e.latlng);
              updateCoords(e.latlng.lat, e.latlng.lng);
              L.circle(e.latlng, {
                radius: e.accuracy / 2,
                color: '#1C86FF',
                fillColor: '#1C86FF',
                fillOpacity: 0.15,
                weight: 1
              }).addTo(map);
            });

            map.on('locationerror', function(e) {
              console.error('Location error:', e.message);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'locationError',
                message: e.message
              }));
            });
          </script>
        </body>
      </html>
    `;
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      // Check if it's a location error
      if (data.type === 'locationError') {
        Alert.alert(
          'Location Unavailable',
          'Unable to access your current location. Please ensure location services are enabled for this app, or manually select your location on the map.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Otherwise, it's a location update
      setSelectedLocation(data);
    } catch (error) {
      console.error('Error parsing location:', error);
    }
  };

  const handleConfirm = () => {
    onLocationSelect(selectedLocation);
  };

  const handleSkip = () => {
    onLocationSelect(null); // Pass null to indicate skipping location selection
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1C86FF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Select Location</Text>
          {addressLabel && (
            <Text style={styles.headerSubtitle}>{addressLabel}</Text>
          )}
        </View>
        <View style={{ width: 24 }} />
      </View>

      <WebView
        source={{ html: getMapHTML() }}
        style={styles.map}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        geolocationEnabled={true}
      />

      <View style={styles.footer}>
        <View style={styles.coordsDisplay}>
          <Ionicons name="navigate" size={20} color="#1C86FF" />
          <View style={styles.coordsTextContainer}>
            <Text style={styles.coordsLabel}>Selected Coordinates</Text>
            <Text style={styles.coordsValue}>
              {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
            </Text>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.confirmButtonText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'SFProBold',
    color: '#1C86FF',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'SFProReg',
    color: '#666',
    marginTop: 2,
  },
  map: {
    flex: 1,
  },
  footer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  coordsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  coordsTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  coordsLabel: {
    fontSize: 12,
    fontFamily: 'SFProReg',
    color: '#666',
    marginBottom: 2,
  },
  coordsValue: {
    fontSize: 14,
    fontFamily: 'SFProSB',
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1C86FF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    color: '#1C86FF',
    fontSize: 16,
    fontFamily: 'SFProSB',
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#1C86FF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'SFProSB',
  },
});
