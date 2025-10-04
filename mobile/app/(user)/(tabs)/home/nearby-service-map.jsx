import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  ImageBackground,
  Modal,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Line, Circle } from 'react-native-svg';
import Header from '@components/Header';
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';

export default function NearbyServiceMapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Mock user location (will be displayed on placeholder map)
  const userLocation = {
    x: wp(30), // Position on screen
    y: hp(45),
  };

  // Mock service location based on distance
  const serviceLocation = {
    x: wp(70),
    y: hp(25),
  };

  // Service data
  const serviceData = {
    id: params.id,
    name: params.name,
    type: params.type,
    rating: parseFloat(params.rating),
    address: params.address,
    distance: params.distance,
  };

  // Get service image based on ID
  const getServiceImage = () => {
    const id = parseInt(params.id);
    if (id === 1) return require('@assets/images/serviceimages/16.png');
    if (id === 2) return require('@assets/images/serviceimages/14.png');
    if (id === 3) return require('@assets/images/serviceimages/15.png');
    return require('@assets/images/serviceimages/16.png');
  };

  const [showDirectionsModal, setShowDirectionsModal] = useState(false);

  const handleGetDirections = () => {
    setShowDirectionsModal(true);
  };

  const handleBook = () => {
    // Navigate to schedule booking page
    router.push({
      pathname: 'home/schedule-booking',
      params: {
        id: serviceData.id,
        name: serviceData.name,
        type: serviceData.type,
        rating: serviceData.rating,
        address: serviceData.address,
        distance: serviceData.distance,
      },
    });
  };

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText} numberOfLines={1}>
        Service Location
      </Text>
    </View>
  );

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Ionicons key={i} name="star" size={moderateScale(14)} color="#ff9b79" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Ionicons key={i} name="star-half" size={moderateScale(14)} color="#ff9b79" />
        );
      } else {
        stars.push(
          <Ionicons key={i} name="star-outline" size={moderateScale(14)} color="#E0E0E0" />
        );
      }
    }
    return stars;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header
        backgroundColor="#1C86FF"
        titleColor="#fff"
        customTitle={renderTitle()}
        showBack={true}
      />

      {/* Placeholder Map Container */}
      <View style={styles.mapContainer}>
        {/* Map Background with Grid Pattern */}
        <View style={styles.mapBackground}>
          {/* Grid Lines for Map Look */}
          <View style={styles.gridContainer}>
            {[...Array(10)].map((_, i) => (
              <View key={`h-${i}`} style={[styles.gridLineHorizontal, { top: `${i * 10}%` }]} />
            ))}
            {[...Array(10)].map((_, i) => (
              <View key={`v-${i}`} style={[styles.gridLineVertical, { left: `${i * 10}%` }]} />
            ))}
          </View>

          {/* Mock Streets */}
          <View style={styles.streetContainer}>
            <View style={[styles.street, { top: hp(30), left: 0, width: '100%', height: moderateScale(8) }]} />
            <View style={[styles.street, { top: 0, left: wp(45), width: moderateScale(8), height: '100%' }]} />
            <View style={[styles.street, { top: hp(15), left: wp(20), width: wp(60), height: moderateScale(6), transform: [{ rotate: '20deg' }] }]} />
          </View>

          {/* Route Line using SVG */}
          <Svg style={StyleSheet.absoluteFill}>
            <Line
              x1={userLocation.x}
              y1={userLocation.y}
              x2={serviceLocation.x}
              y2={serviceLocation.y}
              stroke="#1C86FF"
              strokeWidth="3"
              strokeDasharray="10,5"
            />
          </Svg>

          {/* User Location Marker */}
          <View style={[styles.userMarker, { left: userLocation.x - moderateScale(20), top: userLocation.y - moderateScale(20) }]}>
            <Ionicons name="person" size={moderateScale(20)} color="#fff" />
            <View style={styles.markerPulse} />
          </View>

          {/* Service Location Marker */}
          <View style={[styles.serviceMarker, { left: serviceLocation.x - moderateScale(25), top: serviceLocation.y - moderateScale(25) }]}>
            <Ionicons name="business" size={moderateScale(24)} color="#fff" />
          </View>

          {/* Distance Label */}
          <View style={[styles.distanceBadge, {
            left: (userLocation.x + serviceLocation.x) / 2 - moderateScale(30),
            top: (userLocation.y + serviceLocation.y) / 2 - moderateScale(15)
          }]}>
            <Text style={styles.distanceBadgeText}>{serviceData.distance}</Text>
          </View>
        </View>

        {/* Placeholder Notice */}
        <View style={styles.placeholderNotice}>
          <Ionicons name="information-circle" size={moderateScale(18)} color="#1C86FF" />
          <Text style={styles.placeholderText}>Map Placeholder</Text>
        </View>

        {/* Zoom Controls */}
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.zoomButton}>
            <Ionicons name="add" size={moderateScale(24)} color="#1C86FF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomButton}>
            <Ionicons name="remove" size={moderateScale(24)} color="#1C86FF" />
          </TouchableOpacity>
        </View>

        {/* Recenter Button */}
        <TouchableOpacity style={styles.recenterButton}>
          <Ionicons name="locate" size={moderateScale(24)} color="#1C86FF" />
        </TouchableOpacity>
      </View>

      {/* Service Info Card */}
      <View style={styles.serviceInfoCard}>
        <View style={styles.cardHeader}>
          <Image source={getServiceImage()} style={styles.serviceImage} />
          <View style={styles.serviceDetails}>
            <Text style={styles.serviceName}>{serviceData.name}</Text>
            <Text style={styles.serviceType}>{serviceData.type}</Text>
            <View style={styles.ratingContainer}>
              <View style={styles.starsContainer}>{renderStars(serviceData.rating)}</View>
              <Text style={styles.ratingText}>({serviceData.rating})</Text>
            </View>
          </View>
        </View>

        <View style={styles.addressContainer}>
          <Ionicons name="location-outline" size={moderateScale(18)} color="#FF9B79" />
          <Text style={styles.addressText}>{serviceData.address}</Text>
        </View>

        <View style={styles.distanceContainer}>
          <Ionicons name="navigate-outline" size={moderateScale(18)} color="#1C86FF" />
          <Text style={styles.distanceText}>{serviceData.distance} away</Text>
          <Text style={styles.estimatedTime}>• ~5 mins drive</Text>
        </View>

        {/* Get Directions Button */}
        <TouchableOpacity style={styles.directionsButton} onPress={handleGetDirections}>
          <Ionicons name="map-outline" size={moderateScale(20)} color="#fff" />
          <Text style={styles.directionsButtonText}>Get Directions</Text>
        </TouchableOpacity>

        {/* Action Button */}
        <TouchableOpacity style={styles.bookButtonFull} onPress={handleBook}>
          <Ionicons name="calendar-outline" size={moderateScale(20)} color="#fff" />
          <Text style={styles.bookButtonText}>Book Service</Text>
        </TouchableOpacity>
      </View>

      {/* Get Directions Modal */}
      <Modal
        visible={showDirectionsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDirectionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.directionsModalContainer}>
            {/* Icon */}
            <View style={styles.modalIconContainer}>
              <View style={styles.modalIconCircle}>
                <Ionicons name="map-outline" size={moderateScale(50)} color="#1C86FF" />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.modalTitle}>Get Directions</Text>
            <Text style={styles.modalSubtitle}>
              Navigate to {serviceData.name}
            </Text>

            {/* Info Card */}
            <View style={styles.modalInfoCard}>
              <View style={styles.modalInfoRow}>
                <Ionicons name="location" size={moderateScale(20)} color="#FF9B79" />
                <Text style={styles.modalInfoText}>{serviceData.address}</Text>
              </View>
              <View style={styles.modalInfoRow}>
                <Ionicons name="navigate" size={moderateScale(20)} color="#1C86FF" />
                <Text style={styles.modalInfoText}>{serviceData.distance} away • ~5 mins</Text>
              </View>
            </View>

            {/* Notice */}
            <View style={styles.modalNotice}>
              <Ionicons name="information-circle" size={moderateScale(22)} color="#FF9B79" />
              <Text style={styles.modalNoticeText}>
                Google Maps integration will be available in the next update
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowDirectionsModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={() => setShowDirectionsModal(false)}
              >
                <Ionicons name="map" size={moderateScale(20)} color="#fff" />
                <Text style={styles.modalConfirmButtonText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  titleContainer: {
    flex: 1,
  },
  titleText: {
    color: '#fff',
    fontSize: scaleFontSize(24),
    fontFamily: 'SFProBold',
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapBackground: {
    flex: 1,
    backgroundColor: '#E8F4F8',
    position: 'relative',
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineHorizontal: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#D0E8F0',
  },
  gridLineVertical: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: '#D0E8F0',
  },
  streetContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  street: {
    position: 'absolute',
    backgroundColor: '#C5D9E0',
  },
  userMarker: {
    position: 'absolute',
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 10,
  },
  markerPulse: {
    position: 'absolute',
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  serviceMarker: {
    position: 'absolute',
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: '#1C86FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 10,
  },
  distanceBadge: {
    position: 'absolute',
    backgroundColor: '#fff',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(15),
    borderWidth: 2,
    borderColor: '#1C86FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 5,
  },
  distanceBadgeText: {
    fontSize: scaleFontSize(12),
    fontWeight: 'bold',
    color: '#1C86FF',
  },
  placeholderNotice: {
    position: 'absolute',
    top: moderateScale(10),
    left: wp(5),
    right: wp(5),
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(8),
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeholderText: {
    fontSize: scaleFontSize(12),
    color: '#666',
    flex: 1,
  },
  zoomControls: {
    position: 'absolute',
    right: wp(5),
    top: hp(15),
    gap: moderateScale(10),
  },
  zoomButton: {
    width: moderateScale(45),
    height: moderateScale(45),
    borderRadius: moderateScale(8),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  recenterButton: {
    position: 'absolute',
    bottom: hp(35),
    right: wp(5),
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  serviceInfoCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    padding: moderateScale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: moderateScale(15),
  },
  serviceImage: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(12),
    marginRight: moderateScale(15),
  },
  serviceDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  serviceName: {
    fontSize: scaleFontSize(20),
    fontFamily: 'SFProBold',
    color: '#1C86FF',
    marginBottom: moderateScale(4),
  },
  serviceType: {
    fontSize: scaleFontSize(14),
    color: '#FF9B79',
    marginBottom: moderateScale(6),
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: moderateScale(2),
  },
  ratingText: {
    fontSize: scaleFontSize(12),
    color: '#666',
    marginLeft: moderateScale(6),
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: moderateScale(10),
    paddingBottom: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  addressText: {
    flex: 1,
    fontSize: scaleFontSize(14),
    color: '#666',
    marginLeft: moderateScale(8),
    lineHeight: moderateScale(20),
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(15),
  },
  distanceText: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#1C86FF',
    marginLeft: moderateScale(8),
  },
  estimatedTime: {
    fontSize: scaleFontSize(12),
    color: '#999',
    marginLeft: moderateScale(6),
  },
  directionsButton: {
    flexDirection: 'row',
    backgroundColor: '#1C86FF',
    paddingVertical: hp(1.8),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(12),
  },
  directionsButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    marginLeft: moderateScale(8),
  },
  bookButtonFull: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: hp(1.8),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#1C86FF',
  },
  bookButtonText: {
    color: '#1C86FF',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',

    marginLeft: moderateScale(6),
  },
  // Get Directions Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  directionsModalContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(20),
    width: wp(90),
    paddingVertical: moderateScale(30),
    paddingHorizontal: moderateScale(20),
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: moderateScale(20),
  },
  modalIconCircle: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1C86FF',
  },
  modalTitle: {
    fontSize: scaleFontSize(24),
    fontWeight: 'bold',
    color: '#1C86FF',
    textAlign: 'center',
    marginBottom: moderateScale(8),
  },
  modalSubtitle: {
    fontSize: scaleFontSize(16),
    color: '#666',
    textAlign: 'center',
    marginBottom: moderateScale(24),
  },
  modalInfoCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: moderateScale(20),
    gap: moderateScale(12),
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
  },
  modalInfoText: {
    flex: 1,
    fontSize: scaleFontSize(14),
    color: '#333',
    fontWeight: '500',
  },
  modalNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: moderateScale(14),
    borderRadius: moderateScale(12),
    gap: moderateScale(10),
    marginBottom: moderateScale(24),
  },
  modalNoticeText: {
    flex: 1,
    fontSize: scaleFontSize(13),
    color: '#666',
    lineHeight: moderateScale(18),
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: moderateScale(12),
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: hp(1.8),
    borderRadius: moderateScale(12),
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#666',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
  modalConfirmButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: hp(1.8),
    borderRadius: moderateScale(12),
    backgroundColor: '#1C86FF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(6),
  },
  modalConfirmButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
});
