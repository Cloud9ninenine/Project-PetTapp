import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';

export default function BookingConfirmationModal({
  visible,
  onClose,
  onConfirm,
  bookingData,
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="calendar-outline" size={moderateScale(60)} color="#1C86FF" />
          </View>

          {/* Title */}
          <Text style={styles.title}>Confirm Booking</Text>
          <Text style={styles.subtitle}>Please review your booking details</Text>

          {/* Booking Summary */}
          <ScrollView style={styles.summaryContainer} showsVerticalScrollIndicator={false}>
            {/* Service Info */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="business-outline" size={moderateScale(20)} color="#1C86FF" />
                <Text style={styles.sectionTitle}>Service Information</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Service</Text>
                <Text style={styles.detailValue}>{bookingData?.service?.name}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValue}>{bookingData?.service?.type}</Text>
              </View>
            </View>

            {/* Booking Details */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="list-outline" size={moderateScale(20)} color="#1C86FF" />
                <Text style={styles.sectionTitle}>Booking Details</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Pet</Text>
                <Text style={styles.detailValue}>
                  {bookingData?.pet?.name}
                  {bookingData?.pet?.type && ` (${bookingData.pet.type}`}
                  {bookingData?.pet?.breed && ` - ${bookingData.pet.breed}`}
                  {bookingData?.pet?.type && ')'}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Transportation</Text>
                <Text style={styles.detailValue}>{bookingData?.transportation?.label}</Text>
              </View>
              {bookingData?.pickupAddress && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Pickup Address</Text>
                  <Text style={styles.detailValue}>{bookingData.pickupAddress}</Text>
                </View>
              )}
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Payment</Text>
                <Text style={styles.detailValue}>
                  {bookingData?.payment?.name}
                  {bookingData?.payment?.cardNumber && ` - ${bookingData.payment.cardNumber}`}
                </Text>
              </View>
            </View>

            {/* Schedule */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar-outline" size={moderateScale(20)} color="#1C86FF" />
                <Text style={styles.sectionTitle}>Schedule</Text>
              </View>
              <View style={styles.scheduleRow}>
                <View style={styles.scheduleItem}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{bookingData?.date}</Text>
                </View>
                <View style={styles.scheduleItem}>
                  <Text style={styles.detailLabel}>Time</Text>
                  <Text style={styles.detailValue}>{bookingData?.time}</Text>
                </View>
              </View>
            </View>

            {/* Note */}
            <View style={styles.noteCard}>
              <Ionicons name="information-circle" size={moderateScale(20)} color="#FF9B79" />
              <Text style={styles.noteText}>
                You will receive a confirmation message once your booking is processed.
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
              <Text style={styles.confirmButtonText}>Confirm Booking</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(20),
    width: wp(90),
    maxHeight: hp(80),
    paddingVertical: moderateScale(24),
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  title: {
    fontSize: scaleFontSize(24),
    fontWeight: 'bold',
    color: '#1C86FF',
    textAlign: 'center',
    marginBottom: moderateScale(8),
  },
  subtitle: {
    fontSize: scaleFontSize(14),
    color: '#666',
    textAlign: 'center',
    marginBottom: moderateScale(20),
  },
  summaryContainer: {
    paddingHorizontal: moderateScale(20),
    maxHeight: hp(50),
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E3F2FD',
    padding: moderateScale(16),
    marginBottom: moderateScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(12),
    paddingBottom: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#E3F2FD',
    gap: moderateScale(8),
  },
  sectionTitle: {
    fontSize: scaleFontSize(15),
    fontWeight: 'bold',
    color: '#1C86FF',
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: moderateScale(6),
  },
  detailLabel: {
    fontSize: scaleFontSize(13),
    color: '#999',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    width: '35%',
  },
  detailValue: {
    fontSize: scaleFontSize(14),
    color: '#333',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  scheduleRow: {
    flexDirection: 'row',
    gap: moderateScale(12),
  },
  scheduleItem: {
    flex: 1,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    gap: moderateScale(10),
  },
  noteText: {
    flex: 1,
    fontSize: scaleFontSize(12),
    color: '#666',
    lineHeight: moderateScale(18),
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(20),
    gap: moderateScale(12),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: hp(1.8),
    borderRadius: moderateScale(12),
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: hp(1.8),
    borderRadius: moderateScale(12),
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
});
