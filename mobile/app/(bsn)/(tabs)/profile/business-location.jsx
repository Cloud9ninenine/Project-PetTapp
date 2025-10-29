import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from "@config/api";

export default function BusinessLocationScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businessId, setBusinessId] = useState(null);
  const [locationData, setLocationData] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Philippines',
    coordinates: null,
  });
  const [markerCoordinate, setMarkerCoordinate] = useState(null);

  useEffect(() => {
    fetchBusinessLocation();
  }, []);

  const fetchBusinessLocation = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/businesses');

      if (response.data && response.data.data && response.data.data.length > 0) {
        const business = response.data.data[0];
        setBusinessId(business._id);

        if (business.address) {
          const address = business.address;
          setLocationData({
            street: address.street || '',
            city: address.city || '',
            state: address.state || '',
            zipCode: address.zipCode || '',
            country: address.country || 'Philippines',
            coordinates: address.coordinates || null,
          });

          if (address.coordinates?.latitude && address.coordinates?.longitude) {
            setMarkerCoordinate({
              latitude: address.coordinates.latitude,
              longitude: address.coordinates.longitude,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching business location:', error);
      Alert.alert('Error', 'Failed to load business location');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!locationData.street.trim() || !locationData.city.trim() ||
        !locationData.state.trim() || !locationData.zipCode.trim()) {
      Alert.alert('Validation Error', 'Please fill in all address fields');
      return;
    }

    if (!businessId) {
      Alert.alert('Error', 'Business information not found. Please create your business profile first.');
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append('address', JSON.stringify(locationData));

      await apiClient.put(`/businesses/${businessId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Success', 'Location updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving location:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoordinates = () => {
    Alert.alert(
      'Delete Coordinates',
      'Are you sure you want to remove the map coordinates? The address will remain.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setLocationData(prev => ({ ...prev, coordinates: null }));
            setMarkerCoordinate(null);
            Alert.alert('Success', 'Coordinates removed. Don\'t forget to save changes.');
          },
        },
      ]
    );
  };

  const handleMapMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'locationError') {
        Alert.alert(
          'Location Unavailable',
          data.message || 'Unable to access your current location.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Update coordinates
      const coords = {
        latitude: data.latitude,
        longitude: data.longitude,
      };

      setMarkerCoordinate(coords);
      setLocationData(prev => ({
        ...prev,
        coordinates: coords,
      }));
    } catch (error) {
      console.error('Error parsing map message:', error);
    }
  };

  const getMapHTML = () => {
    const defaultLat = markerCoordinate?.latitude || 14.5995; // Manila default
    const defaultLng = markerCoordinate?.longitude || 120.9842;

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
              padding: 10px 16px;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              z-index: 1000;
              text-align: center;
              max-width: 90%;
            }
            .info-title {
              font-weight: bold;
              color: #1C86FF;
              font-size: 13px;
              margin-bottom: 4px;
            }
            .info-coords {
              font-size: 11px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="info-box">
            <div class="info-title">📍 Tap/Drag to set business location</div>
            <div class="info-coords" id="coords">${defaultLat.toFixed(6)}, ${defaultLng.toFixed(6)}</div>
          </div>
          <div id="map"></div>
          <script>
            var map = L.map('map', {
              zoomControl: false
            }).setView([${defaultLat}, ${defaultLng}], 15);

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

            var marker = L.marker([${defaultLat}, ${defaultLng}], {
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ImageBackground
          source={require("@assets/images/PetTapp pattern.png")}
          style={styles.backgroundimg}
          imageStyle={styles.backgroundImageStyle}
          resizeMode="repeat"
        />
        <Header
          backgroundColor="#1C86FF"
          titleColor="#fff"
          title="Business Location"
          showBack={true}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1C86FF" />
          <Text style={styles.loadingText}>Loading location...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("@assets/images/PetTapp pattern.png")}
        style={styles.backgroundimg}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="repeat"
      />
      <Header
        backgroundColor="#1C86FF"
        titleColor="#fff"
        title="Business Location"
        showBack={true}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={moderateScale(24)} color="#1C86FF" />
          <Text style={styles.infoText}>
            Adding map coordinates helps customers find your business more easily. The location will be shown on your business profile and in search results.
          </Text>
        </View>
        
        {/* Map Section */}
        <View style={styles.mapSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Location on Map</Text>
            {markerCoordinate && (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleDeleteCoordinates}
              >
                <Ionicons name="trash-outline" size={moderateScale(22)} color="#FF6B6B" />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.mapHint}>
            Tap on the map to set your business location, or use the 📍 button on the map to get your current position.
          </Text>

          <View style={styles.mapContainer}>
            <WebView
              source={{ html: getMapHTML() }}
              style={styles.map}
              onMessage={handleMapMessage}
              javaScriptEnabled={true}
            />
          </View>

          {locationData.coordinates?.latitude && locationData.coordinates?.longitude && (
            <View style={styles.coordinatesCard}>
              <View style={styles.coordinateRow}>
                <Text style={styles.coordinateLabel}>Latitude:</Text>
                <Text style={styles.coordinateValue}>
                  {locationData.coordinates.latitude.toFixed(6)}
                </Text>
              </View>
              <View style={styles.coordinateRow}>
                <Text style={styles.coordinateLabel}>Longitude:</Text>
                <Text style={styles.coordinateValue}>
                  {locationData.coordinates.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Address Form */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Address Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street Address *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location" size={moderateScale(20)} color="#1C86FF" />
              <TextInput
                style={styles.input}
                value={locationData.street}
                onChangeText={(text) => setLocationData({ ...locationData, street: text })}
                placeholder="Enter street address"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>City *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="business" size={moderateScale(20)} color="#1C86FF" />
              <TextInput
                style={styles.input}
                value={locationData.city}
                onChangeText={(text) => setLocationData({ ...locationData, city: text })}
                placeholder="Enter city"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>State/Province *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="map" size={moderateScale(20)} color="#1C86FF" />
              <TextInput
                style={styles.input}
                value={locationData.state}
                onChangeText={(text) => setLocationData({ ...locationData, state: text })}
                placeholder="Enter state/province"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Zip Code *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="pin" size={moderateScale(20)} color="#1C86FF" />
              <TextInput
                style={styles.input}
                value={locationData.zipCode}
                onChangeText={(text) => setLocationData({ ...locationData, zipCode: text })}
                placeholder="Enter zip code"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Country *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="flag" size={moderateScale(20)} color="#1C86FF" />
              <TextInput
                style={styles.input}
                value={locationData.country}
                onChangeText={(text) => setLocationData({ ...locationData, country: text })}
                placeholder="Enter country"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={moderateScale(22)} color="#fff" />
              <Text style={styles.saveButtonText}>Save Location</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  backgroundimg: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.5 }],
  },
  backgroundImageStyle: {
    opacity: 0.1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(40),
  },
  loadingText: {
    marginTop: moderateScale(12),
    fontSize: scaleFontSize(14),
    color: '#666',
  },
  content: {
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(20),
    paddingBottom: moderateScale(20),
  },
  mapSection: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    marginBottom: moderateScale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  sectionTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#1C86FF',
  },
  iconButton: {
    padding: moderateScale(8),
    backgroundColor: '#F0F0F0',
    borderRadius: moderateScale(8),
  },
  mapHint: {
    fontSize: scaleFontSize(13),
    color: '#666',
    marginBottom: moderateScale(15),
    lineHeight: scaleFontSize(18),
  },
  mapContainer: {
    width: '100%',
    height: moderateScale(300),
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    marginBottom: moderateScale(15),
  },
  map: {
    width: '100%',
    height: '100%',
  },
  coordinatesCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    borderLeftWidth: 4,
    borderLeftColor: '#1C86FF',
  },
  coordinateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  coordinateLabel: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#333',
  },
  coordinateValue: {
    fontSize: scaleFontSize(14),
    color: '#1C86FF',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    marginBottom: moderateScale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: moderateScale(20),
  },
  label: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(8),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    fontSize: scaleFontSize(15),
    color: '#333',
    marginLeft: moderateScale(12),
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: moderateScale(20),
    borderLeftWidth: 4,
    borderLeftColor: '#1C86FF',
  },
  infoText: {
    flex: 1,
    fontSize: scaleFontSize(13),
    color: '#333',
    lineHeight: scaleFontSize(18),
    marginLeft: moderateScale(12),
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#1C86FF',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    shadowColor: '#1C86FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
});
