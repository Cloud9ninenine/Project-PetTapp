import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';

export default function DeliveryDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const delivery = {
    orderId: params.orderId || '#DEL-001',
    customerName: params.customerName || 'Customer',
    customerPhone: params.customerPhone || '+63 917 555 1234',
    petName: params.petName || 'Pet',
    pickupAddress: params.pickupAddress || 'Pickup Address',
    deliveryAddress: params.deliveryAddress || 'Delivery Address',
    status: params.status || 'assigned',
    earnings: params.earnings || '₱80',
    distance: params.distance || '2.5 km',
    time: params.time || '10:30 AM',
    instructions: 'Please handle with care. Pet is sensitive to loud noises.',
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'picked_up':
        return '#FF6B35';
      case 'assigned':
        return '#2196F3';
      case 'completed':
        return '#4CAF50';
      default:
        return '#999';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'picked_up':
        return 'In Transit';
      case 'assigned':
        return 'Assigned';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const handleCall = () => {
    Linking.openURL(`tel:${delivery.customerPhone}`);
  };

  const handleNavigate = (address) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  };

  const handlePickup = () => {
    Alert.alert('Confirm Pickup', 'Mark this order as picked up?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: () => Alert.alert('Success', 'Order marked as picked up!'),
      },
    ]);
  };

  const handleComplete = () => {
    Alert.alert('Complete Delivery', 'Mark this delivery as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: () => {
          Alert.alert('Success', 'Delivery completed!');
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("@assets/images/PetTapp pattern.png")}
        style={styles.backgroundimg}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="repeat"
      />
      <Header
        backgroundColor="#FF6B35"
        titleColor="#fff"
        title="Delivery Details"
        showBack={true}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Bar */}
        <View style={[styles.statusBar, { backgroundColor: getStatusColor(delivery.status) }]}>
          <Text style={styles.statusBarText}>{getStatusLabel(delivery.status)}</Text>
        </View>

        {/* Order Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order ID</Text>
            <Text style={styles.infoValue}>{delivery.orderId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Customer</Text>
            <Text style={styles.infoValue}>{delivery.customerName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pet</Text>
            <Text style={styles.infoValue}>{delivery.petName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Distance</Text>
            <Text style={styles.infoValue}>{delivery.distance}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Earnings</Text>
            <Text style={[styles.infoValue, styles.earningsValue]}>{delivery.earnings}</Text>
          </View>
        </View>

        {/* Customer Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Contact</Text>
          <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
            <Ionicons name="call" size={moderateScale(20)} color="#fff" />
            <Text style={styles.contactButtonText}>Call Customer</Text>
          </TouchableOpacity>
        </View>

        {/* Pickup Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup Location</Text>
          <View style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <Ionicons name="location" size={moderateScale(24)} color="#4CAF50" />
              <Text style={styles.addressText}>{delivery.pickupAddress}</Text>
            </View>
            <TouchableOpacity
              style={styles.navigateButton}
              onPress={() => handleNavigate(delivery.pickupAddress)}
            >
              <Ionicons name="navigate" size={moderateScale(18)} color="#FF6B35" />
              <Text style={styles.navigateButtonText}>Navigate</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Location</Text>
          <View style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <Ionicons name="location" size={moderateScale(24)} color="#FF6B35" />
              <Text style={styles.addressText}>{delivery.deliveryAddress}</Text>
            </View>
            <TouchableOpacity
              style={styles.navigateButton}
              onPress={() => handleNavigate(delivery.deliveryAddress)}
            >
              <Ionicons name="navigate" size={moderateScale(18)} color="#FF6B35" />
              <Text style={styles.navigateButtonText}>Navigate</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Special Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions</Text>
          <View style={styles.instructionsCard}>
            <Ionicons name="information-circle" size={moderateScale(20)} color="#FF6B35" />
            <Text style={styles.instructionsText}>{delivery.instructions}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        {delivery.status === 'assigned' && (
          <TouchableOpacity style={styles.actionButton} onPress={handlePickup}>
            <Ionicons name="checkmark-circle" size={moderateScale(22)} color="#fff" />
            <Text style={styles.actionButtonText}>Mark as Picked Up</Text>
          </TouchableOpacity>
        )}

        {delivery.status === 'picked_up' && (
          <TouchableOpacity style={styles.actionButton} onPress={handleComplete}>
            <Ionicons name="checkmark-done-circle" size={moderateScale(22)} color="#fff" />
            <Text style={styles.actionButtonText}>Complete Delivery</Text>
          </TouchableOpacity>
        )}
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
  content: {
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(20),
    paddingBottom: moderateScale(30),
  },
  statusBar: {
    width: '100%',
    paddingVertical: hp(1.2),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    marginBottom: moderateScale(20),
  },
  statusBarText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    marginBottom: moderateScale(20),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: scaleFontSize(14),
    color: '#666',
  },
  infoValue: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#333',
  },
  earningsValue: {
    color: '#FF6B35',
    fontSize: scaleFontSize(16),
  },
  section: {
    marginBottom: moderateScale(20),
  },
  sectionTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: moderateScale(12),
  },
  contactButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
  },
  contactButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(15),
    fontWeight: '600',
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: moderateScale(10),
    marginBottom: moderateScale(12),
  },
  addressText: {
    flex: 1,
    fontSize: scaleFontSize(14),
    color: '#333',
    lineHeight: scaleFontSize(20),
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE5DB',
    borderRadius: moderateScale(8),
    paddingVertical: moderateScale(10),
    gap: moderateScale(6),
  },
  navigateButtonText: {
    color: '#FF6B35',
    fontSize: scaleFontSize(14),
    fontWeight: '600',
  },
  instructionsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF9E6',
    borderRadius: moderateScale(10),
    padding: moderateScale(12),
    gap: moderateScale(10),
    borderLeftWidth: moderateScale(4),
    borderLeftColor: '#FF6B35',
  },
  instructionsText: {
    flex: 1,
    fontSize: scaleFontSize(13),
    color: '#666',
    lineHeight: scaleFontSize(18),
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    elevation: 3,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
});
