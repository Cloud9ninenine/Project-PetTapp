import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';

export default function ServiceScheduledScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("@assets/images/PetTapp pattern.png")}
        style={styles.backgroundimg}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="repeat"
      />

      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={moderateScale(80)} color="#fff" />
          </View>
          <View style={styles.iconRing} />
        </View>

        {/* Success Message */}
        <Text style={styles.title}>Booking Confirmed!</Text>
        <Text style={styles.subtitle}>
          Your service has been successfully scheduled
        </Text>

        {/* Booking Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Ionicons name="business-outline" size={moderateScale(24)} color="#1C86FF" />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Service</Text>
              <Text style={styles.detailValue}>{params.serviceName || 'Pet Service'}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={moderateScale(24)} color="#1C86FF" />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Date & Time</Text>
              <Text style={styles.detailValue}>{params.date || 'Not specified'}</Text>
              <Text style={styles.detailValue}>{params.time || 'Not specified'}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="paw-outline" size={moderateScale(24)} color="#1C86FF" />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Pet</Text>
              <Text style={styles.detailValue}>{params.petName || 'Your pet'}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.viewBookingButton}
            onPress={() => router.push('/(user)/(tabs)/booking')}
          >
            <Ionicons name="list-outline" size={moderateScale(20)} color="#fff" />
            <Text style={styles.viewBookingButtonText}>View Bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => router.push('/(user)/(tabs)/home')}
          >
            <Ionicons name="home-outline" size={moderateScale(20)} color="#1C86FF" />
            <Text style={styles.continueButtonText}>Browse</Text>
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
  backgroundimg: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.5 }],
  },
  backgroundImageStyle: {
    opacity: 0.1,
  },
  content: {
    flex: 1,
    paddingHorizontal: wp(6),
    paddingTop: hp(8),
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: moderateScale(30),
  },
  iconCircle: {
    width: moderateScale(140),
    height: moderateScale(140),
    borderRadius: moderateScale(70),
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  iconRing: {
    position: 'absolute',
    width: moderateScale(170),
    height: moderateScale(170),
    borderRadius: moderateScale(85),
    borderWidth: 3,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    top: -moderateScale(15),
    left: -moderateScale(15),
  },
  title: {
    fontSize: scaleFontSize(32),
    fontFamily: 'SFProBold',
    color: '#4CAF50',
    marginBottom: moderateScale(12),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: scaleFontSize(16),
    color: '#666',
    marginBottom: moderateScale(30),
    textAlign: 'center',
    paddingHorizontal: wp(8),
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    marginBottom: moderateScale(20),
    borderWidth: 1,
    borderColor: '#E3F2FD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: moderateScale(20),
  },
  detailText: {
    marginLeft: moderateScale(16),
    flex: 1,
  },
  detailLabel: {
    fontSize: scaleFontSize(12),
    color: '#999',
    marginBottom: moderateScale(4),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: scaleFontSize(16),
    color: '#333',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: moderateScale(12),
  },
  viewBookingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C86FF',
    paddingVertical: hp(2),
    borderRadius: moderateScale(12),
    gap: moderateScale(6),
  },
  viewBookingButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(15),
    fontWeight: 'bold',
  },
  continueButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1C86FF',
    paddingVertical: hp(2),
    borderRadius: moderateScale(12),
    gap: moderateScale(6),
  },
  continueButtonText: {
    color: '#1C86FF',
    fontSize: scaleFontSize(15),
    fontWeight: 'bold',
  },
});
