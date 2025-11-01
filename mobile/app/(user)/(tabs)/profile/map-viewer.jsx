import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

export default function MapViewer({ address, onClose }) {
  const getMapHTML = (lat, lon, label, fullAddress) => {
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
            src="https://maps.google.com/maps?q=${lat},${lon}&hl=en&z=16&output=embed"
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

  if (!address || !address.latitude || !address.longitude) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#1C86FF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Map View</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="map-outline" size={80} color="#ccc" />
          <Text style={styles.errorText}>No coordinates available</Text>
          <Text style={styles.errorSubtext}>
            Please add latitude and longitude to view this location on the map
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#1C86FF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{address.label}</Text>
          <Text style={styles.headerSubtitle}>{address.city}, {address.state}</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <WebView
        source={{
          html: getMapHTML(
            address.latitude,
            address.longitude,
            address.label,
            fullAddress
          ),
        }}
        style={styles.map}
      />

      <View style={styles.infoPanel}>
        <View style={styles.infoRow}>
          <Ionicons name="location" size={20} color="#1C86FF" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Full Address</Text>
            <Text style={styles.infoValue}>{fullAddress}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="navigate" size={20} color="#1C86FF" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Coordinates</Text>
            <Text style={styles.infoValue}>
              {address.latitude.toFixed(6)}, {address.longitude.toFixed(6)}
            </Text>
          </View>
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
  closeButton: {
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
  infoPanel: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'SFProReg',
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'SFProSB',
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'SFProSB',
    color: '#999',
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    fontFamily: 'SFProReg',
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
  },
});
