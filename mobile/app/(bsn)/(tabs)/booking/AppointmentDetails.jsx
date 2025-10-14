import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ImageBackground,
  Modal,
  Platform,
  ActivityIndicator,
  Image,
  Linking,
  TextInput,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from '@react-native-community/datetimepicker';
import Header from "@components/Header";
import { hp, wp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from '@config/api';

const AppointmentDetail = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (params.bookingId) {
      fetchBookingDetails();
    }
  }, [params.bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/bookings/${params.bookingId}`);

      if (response.data && response.data.success) {
        const bookingInfo = response.data.data;
        console.log('=== BOOKING DATA ===');
        console.log('Full booking:', JSON.stringify(bookingInfo, null, 2));
        console.log('Pet Owner Details:', bookingInfo.petOwnerDetails);
        console.log('Pet Details:', bookingInfo.petDetails);
        console.log('Service Details:', bookingInfo.serviceDetails);
        setBookingData(bookingInfo);
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      Alert.alert('Error', 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText} numberOfLines={1}>
        Appointment Details
      </Text>
    </View>
  );

  const formatDateTime = (dateTime) => {
    if (!dateTime) return "Not specified";
    const date = new Date(dateTime);
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return `${dateStr} • ${timeStr}`;
  };

  const getStatusConfig = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case "pending":
        return { label: "Pending", backgroundColor: "#FF9B79" };
      case "confirmed":
        return { label: "Confirmed", backgroundColor: "#4CAF50" };
      case "in-progress":
        return { label: "In Progress", backgroundColor: "#FFC107" };
      case "completed":
        return { label: "Completed", backgroundColor: "#2196F3" };
      case "cancelled":
        return { label: "Cancelled", backgroundColor: "#FF6B6B" };
      case "no-show":
        return { label: "No Show", backgroundColor: "#9E9E9E" };
      default:
        return { label: status || "Unknown", backgroundColor: "#9E9E9E" };
    }
  };

  const getPaymentStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'Pending';
      case 'paid': return 'Paid';
      case 'proof-uploaded': return 'Proof Uploaded';
      case 'refunded': return 'Refunded';
      case 'failed': return 'Failed';
      default: return status || 'Unknown';
    }
  };

  const getPaymentMethodLabel = (method) => {
    switch (method?.toLowerCase()) {
      case 'cash': return 'Cash';
      case 'gcash': return 'GCash';
      case 'paymaya': return 'PayMaya';
      case 'credit-card': return 'Credit Card';
      case 'debit-card': return 'Debit Card';
      case 'qr-payment': return 'QR Payment';
      default: return method || 'Not Specified';
    }
  };

  const copyBookingId = () => {
    Alert.alert("Copied", "Booking ID copied to clipboard");
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setUpdating(true);

      await apiClient.patch(`/bookings/${params.bookingId}/status`, {
        status: newStatus,
      });

      Alert.alert("Success", `Booking status updated to ${newStatus}!`);
      fetchBookingDetails(); // Refresh data
    } catch (error) {
      console.error('Error updating booking status:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update booking status');
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirm = () => {
    Alert.alert("Confirm Appointment", "Confirm this appointment?", [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: () => handleStatusUpdate('confirmed') },
    ]);
  };

  const handleStartService = () => {
    Alert.alert("Start Service", "Mark this appointment as in progress?", [
      { text: "Cancel", style: "cancel" },
      { text: "Start", onPress: () => handleStatusUpdate('in-progress') },
    ]);
  };

  const handleComplete = () => {
    Alert.alert("Mark as Complete", "Mark this appointment as completed?", [
      { text: "No", style: "cancel" },
      { text: "Yes", onPress: () => handleStatusUpdate('completed') },
    ]);
  };

  const handleNoShow = () => {
    Alert.alert("Mark as No Show", "Mark this appointment as no show?", [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: () => handleStatusUpdate('no-show') },
    ]);
  };

  const handleCancel = () => {
    Alert.alert("Cancel Appointment", "Are you sure you want to cancel this appointment?", [
      { text: "No", style: "cancel" },
      { text: "Yes", onPress: () => handleStatusUpdate('cancelled') },
    ]);
  };

  const handleVerifyPayment = async () => {
    try {
      setUpdating(true);

      await apiClient.patch(`/bookings/${params.bookingId}/payment-proof/verify`);

      Alert.alert("Success", "Payment verified successfully!");
      fetchBookingDetails();
    } catch (error) {
      console.error('Error verifying payment:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to verify payment');
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectPayment = () => {
    setRejectModal(true);
  };

  const confirmRejectPayment = async () => {
    if (!rejectionReason || rejectionReason.trim() === '') {
      Alert.alert('Error', 'Rejection reason is required');
      return;
    }

    try {
      setUpdating(true);
      setRejectModal(false);

      await apiClient.patch(`/bookings/${params.bookingId}/payment-proof/reject`, {
        rejectionReason: rejectionReason,
      });

      Alert.alert("Success", "Payment proof rejected");
      setRejectionReason('');
      fetchBookingDetails();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to reject payment');
    } finally {
      setUpdating(false);
    }
  };

  const handleCallCustomer = () => {
    const petOwner = bookingData?.petOwnerDetails || bookingData?.petOwner || {};
    const contactNumber = petOwner.contactNumber || petOwner.phone || petOwner.user?.contactNumber;

    if (contactNumber) {
      Linking.openURL(`tel:${contactNumber}`);
    } else {
      Alert.alert('No Contact', 'No contact number available for this customer');
    }
  };

  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimeChange = (event, time) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (time) {
      setSelectedTime(time);
    }
  };

  const confirmReschedule = () => {
    const formattedDate = selectedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const formattedTime = selectedTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    setRescheduleModal(false);
    Alert.alert(
      'Reschedule Confirmed',
      `Appointment rescheduled to ${formattedDate} at ${formattedTime}`,
      [{ text: 'OK' }]
    );
    // TODO: Implement actual reschedule API call when backend supports it
  };

  const renderActionButtons = () => {
    if (!bookingData) return null;

    const status = bookingData.status?.toLowerCase();

    if (status === "completed") {
      // Show rating/review if available
      if (bookingData.rating?.score) {
        return (
          <View style={styles.ratingContainer}>
            <View style={styles.ratingHeader}>
              <Ionicons name="star" size={moderateScale(24)} color="#FFC107" />
              <Text style={styles.ratingScore}>{bookingData.rating.score}/5</Text>
            </View>
            {bookingData.rating.review && (
              <View style={styles.reviewBox}>
                <Text style={styles.reviewLabel}>Customer Review:</Text>
                <Text style={styles.reviewText}>{bookingData.rating.review}</Text>
                {bookingData.rating.reviewDate && (
                  <Text style={styles.reviewDate}>
                    {formatDateTime(bookingData.rating.reviewDate)}
                  </Text>
                )}
              </View>
            )}
          </View>
        );
      }
      return null;
    }

    if (status === "pending") {
      return (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.fullButton, updating && styles.buttonDisabled]}
            onPress={handleConfirm}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#fff" />
                <Text style={styles.fullButtonText}>Confirm Booking</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cancelButton, updating && styles.buttonDisabled]}
            onPress={handleCancel}
            disabled={updating}
          >
            <Ionicons name="close-circle" size={moderateScale(20)} color="#FF6B6B" />
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (status === "confirmed") {
      return (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.fullButton, updating && styles.buttonDisabled]}
            onPress={handleStartService}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="play-circle" size={moderateScale(20)} color="#fff" />
                <Text style={styles.fullButtonText}>Start Service</Text>
              </>
            )}
          </TouchableOpacity>
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[styles.sideBySideButton, updating && styles.buttonDisabled]}
              onPress={handleNoShow}
              disabled={updating}
            >
              <Ionicons name="ban" size={moderateScale(20)} color="#fff" />
              <Text style={styles.sideBySideButtonText}>No Show</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sideBySideButtonOutline, updating && styles.buttonDisabled]}
              onPress={handleCancel}
              disabled={updating}
            >
              <Ionicons name="close-circle" size={moderateScale(20)} color="#FF6B6B" />
              <Text style={styles.sideBySideButtonOutlineText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (status === "in-progress") {
      return (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.completeButton, updating && styles.buttonDisabled]}
            onPress={handleComplete}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#fff" />
                <Text style={styles.completeButtonText}>Mark as Complete</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    // Cancelled or no-show = no buttons
    return null;
  };

  const renderPaymentSection = () => {
    if (!bookingData) return null;

    const paymentProof = bookingData.paymentProof;
    const paymentStatus = bookingData.paymentStatus?.toLowerCase();

    // Ensure paymentProof is a string, not an object
    const paymentProofUri = typeof paymentProof === 'string' ? paymentProof : paymentProof?.uri || null;

    return (
      <View style={styles.paymentSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="wallet" size={moderateScale(24)} color="#1C86FF" />
          <Text style={styles.sectionTitle}>Payment Information</Text>
        </View>

        <View style={styles.paymentDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>
              {bookingData.totalAmount?.currency || 'PHP'} {bookingData.totalAmount?.amount?.toFixed(2) || '0.00'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={[styles.detailValue, {
              color: paymentStatus === 'paid' ? '#4CAF50' :
                     paymentStatus === 'failed' ? '#FF6B6B' :
                     paymentStatus === 'proof-uploaded' ? '#FFC107' : '#666'
            }]}>
              {getPaymentStatusLabel(paymentStatus)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Method</Text>
            <Text style={styles.detailValue}>{getPaymentMethodLabel(bookingData.paymentMethod)}</Text>
          </View>
        </View>

        {/* Payment Proof */}
        {paymentProofUri && (
          <View style={styles.paymentProofContainer}>
            <Text style={styles.paymentProofLabel}>Payment Proof:</Text>
            <Image
              source={{ uri: paymentProofUri }}
              style={styles.paymentProofImage}
              resizeMode="contain"
            />

            {paymentStatus === 'proof-uploaded' && (
              <View style={styles.paymentProofActions}>
                <TouchableOpacity
                  style={[styles.verifyButton, updating && styles.buttonDisabled]}
                  onPress={handleVerifyPayment}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#fff" />
                      <Text style={styles.verifyButtonText}>Verify Payment</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.rejectButton, updating && styles.buttonDisabled]}
                  onPress={handleRejectPayment}
                  disabled={updating}
                >
                  <Ionicons name="close-circle" size={moderateScale(20)} color="#FF6B6B" />
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    );
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
          customTitle={renderTitle()}
          showBack={true}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1C86FF" />
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!bookingData) {
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
          customTitle={renderTitle()}
          showBack={true}
        />
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={moderateScale(80)} color="#ccc" />
          <Text style={styles.emptyText}>Booking not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = getStatusConfig(bookingData.status);

  // Extract pet owner details - handle both populated object and direct fields
  const petOwner = bookingData.petOwnerDetails || bookingData.petOwner || {};
  const firstName = petOwner.firstName || petOwner.user?.firstName || '';
  const lastName = petOwner.lastName || petOwner.user?.lastName || '';
  const customerName = (firstName && lastName) ? `${firstName} ${lastName}`.trim() : 'Unknown Customer';

  // Extract pet details
  const pet = bookingData.petDetails || bookingData.pet || {};
  const petName = pet.name || 'Unknown Pet';
  const petType = pet.species || pet.petType || 'Pet';

  // Extract service details
  const serviceData = bookingData.serviceDetails || bookingData.service || {};
  const service = serviceData.name || serviceData.serviceName || 'Service';

  // Extract contact info
  const phone = petOwner.contactNumber || petOwner.phone || petOwner.user?.contactNumber || 'No contact number';

  // Ensure profile image is a string, not an object
  const profileImageUri = petOwner.images?.profile || petOwner.profilePicture || petOwner.user?.images?.profile;
  const profileImageUrl = typeof profileImageUri === 'string' ? profileImageUri : profileImageUri?.uri || null;

  console.log('=== EXTRACTED DATA ===');
  console.log('Customer Name:', customerName);
  console.log('Pet Name:', petName);
  console.log('Service:', service);
  console.log('Phone:', phone);

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("@assets/images/PetTapp pattern.png")}
        style={styles.backgroundimg}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="repeat"
      />
      {/* Header */}
      <Header
        backgroundColor="#1C86FF"
        titleColor="#fff"
        customTitle={renderTitle()}
        showBack={true}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Bar */}
        <View style={[styles.statusBar, { backgroundColor: statusConfig.backgroundColor }]}>
          <Text style={styles.statusBarText}>{statusConfig.label}</Text>
        </View>

        {/* Customer Info */}
        <View style={styles.customerSection}>
          <View style={styles.customerLogo}>
            {profileImageUrl ? (
              <Image
                source={{ uri: profileImageUrl }}
                style={styles.customerImage}
              />
            ) : (
              <Ionicons name="person" size={hp(4.5)} color="#1C86FF" />
            )}
          </View>
          <Text style={styles.customerName}>{customerName}</Text>
          <Text style={styles.petInfo}>{petName} • {petType}</Text>
          <TouchableOpacity style={styles.phoneButton} onPress={handleCallCustomer}>
            <Ionicons name="call-outline" size={moderateScale(16)} color="#1C86FF" />
            <Text style={styles.phoneText}>{phone}</Text>
          </TouchableOpacity>
        </View>

        {/* Booking Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={moderateScale(24)} color="#1C86FF" />
            <Text style={styles.sectionTitle}>Booking Information</Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Service</Text>
              <Text style={styles.infoValue}>{service}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>{bookingData.duration} min</Text>
            </View>

            <View style={styles.infoItemFull}>
              <Text style={styles.infoLabel}>Appointment Time</Text>
              <Text style={styles.infoValue}>{formatDateTime(bookingData.appointmentDateTime)}</Text>
            </View>

            {bookingData.notes && (
              <View style={styles.infoItemFull}>
                <Text style={styles.infoLabel}>Customer Notes</Text>
                <Text style={styles.infoValue}>{bookingData.notes}</Text>
              </View>
            )}

            {bookingData.specialRequests && (
              <View style={styles.infoItemFull}>
                <Text style={styles.infoLabel}>Special Requests</Text>
                <Text style={styles.infoValue}>{bookingData.specialRequests}</Text>
              </View>
            )}

            {bookingData.cancellationReason && (
              <View style={styles.infoItemFull}>
                <Text style={styles.infoLabel}>Cancellation Reason</Text>
                <Text style={[styles.infoValue, { color: '#FF6B6B' }]}>{bookingData.cancellationReason}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Payment Section */}
        {renderPaymentSection()}

        {/* Action Buttons */}
        {renderActionButtons()}
      </ScrollView>

      {/* Reschedule Modal */}
      <Modal
        visible={rescheduleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRescheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reschedule Appointment</Text>
              <TouchableOpacity onPress={() => setRescheduleModal(false)}>
                <Ionicons name="close" size={moderateScale(28)} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalSectionTitle}>Select New Date & Time</Text>

              {/* Date Selection */}
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={moderateScale(20)} color="#1C86FF" />
                <Text style={styles.dateTimeButtonText}>
                  {selectedDate.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
                <Ionicons name="chevron-down" size={moderateScale(20)} color="#666" />
              </TouchableOpacity>

              {/* Time Selection */}
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time-outline" size={moderateScale(20)} color="#1C86FF" />
                <Text style={styles.dateTimeButtonText}>
                  {selectedTime.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </Text>
                <Ionicons name="chevron-down" size={moderateScale(20)} color="#666" />
              </TouchableOpacity>

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setRescheduleModal(false)}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={confirmReschedule}
                >
                  <Text style={styles.modalConfirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}

      {/* Reject Payment Modal */}
      <Modal
        visible={rejectModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Payment Proof</Text>
              <TouchableOpacity onPress={() => {
                setRejectModal(false);
                setRejectionReason('');
              }}>
                <Ionicons name="close" size={moderateScale(28)} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalSectionTitle}>Rejection Reason *</Text>
              <TextInput
                style={styles.rejectInput}
                value={rejectionReason}
                onChangeText={setRejectionReason}
                placeholder="Please provide a reason for rejection..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setRejectModal(false);
                    setRejectionReason('');
                  }}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalConfirmButton, { backgroundColor: '#FF6B6B' }]}
                  onPress={confirmRejectPayment}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.modalConfirmButtonText}>Reject Payment</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  backgroundimg: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.5 }],
  },
  backgroundImageStyle: {
    opacity: 0.1,
  },
  titleContainer: {
    flex: 1,
    paddingHorizontal: wp(2),
  },
  titleText: {
    color: '#fff',
    fontSize: scaleFontSize(24),
    fontFamily: 'SFProBold',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: moderateScale(12),
    fontSize: scaleFontSize(14),
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(80),
  },
  emptyText: {
    fontSize: scaleFontSize(18),
    fontWeight: '600',
    color: '#666',
    marginTop: moderateScale(20),
  },
  content: {
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(20),
    paddingBottom: moderateScale(40),
  },
  statusBar: {
    width: "100%",
    paddingVertical: hp(1.2),
    borderRadius: moderateScale(8),
    alignItems: "center",
    marginBottom: moderateScale(20),
  },
  statusBarText: { color: "#FFF", fontSize: scaleFontSize(16), fontWeight: "600" },
  customerSection: { alignItems: "center", marginBottom: moderateScale(20) },
  customerLogo: {
    width: hp(9),
    height: hp(9),
    borderRadius: hp(4.5),
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: moderateScale(10),
    overflow: 'hidden',
  },
  customerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  customerName: { fontSize: scaleFontSize(20), fontWeight: "bold", color: "#1C86FF", marginBottom: moderateScale(4) },
  petInfo: { fontSize: scaleFontSize(14), color: "#666", marginBottom: moderateScale(8) },
  phoneButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(20),
    backgroundColor: "#E3F2FD",
  },
  phoneText: {
    fontSize: scaleFontSize(13),
    color: "#1C86FF",
    fontWeight: "500",
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: moderateScale(16),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: moderateScale(12),
    marginHorizontal: moderateScale(-6),
  },
  infoItem: {
    width: '50%',
    paddingHorizontal: moderateScale(6),
    marginBottom: moderateScale(16),
  },
  infoItemFull: {
    width: '100%',
    paddingHorizontal: moderateScale(6),
    marginBottom: moderateScale(16),
  },
  infoLabel: {
    fontSize: scaleFontSize(12),
    color: '#8E8E93',
    marginBottom: moderateScale(4),
    fontWeight: '500',
  },
  infoValue: {
    fontSize: scaleFontSize(15),
    color: '#1C1C1E',
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  detailLabel: { fontSize: scaleFontSize(14), fontWeight: "500", color: "#333", flex: 1 },
  detailValue: { fontSize: scaleFontSize(14), color: "#555", flex: 1, textAlign: 'right', fontWeight: '600' },
  paymentSection: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    marginBottom: moderateScale(20),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(15),
    gap: moderateScale(10),
  },
  sectionTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#1C86FF',
  },
  paymentDetails: {
    gap: moderateScale(0),
  },
  paymentProofContainer: {
    marginTop: moderateScale(15),
    paddingTop: moderateScale(15),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  paymentProofLabel: {
    fontSize: scaleFontSize(15),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(10),
  },
  paymentProofImage: {
    width: '100%',
    height: hp(30),
    borderRadius: moderateScale(8),
    backgroundColor: '#F8F9FA',
    marginBottom: moderateScale(15),
  },
  paymentProofActions: {
    flexDirection: 'row',
    gap: moderateScale(12),
  },
  verifyButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(6),
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(14),
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(6),
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  rejectButtonText: {
    color: '#FF6B6B',
    fontSize: scaleFontSize(14),
    fontWeight: '600',
  },
  ratingContainer: {
    backgroundColor: '#FFF9E6',
    borderRadius: moderateScale(12),
    padding: moderateScale(20),
    borderWidth: 2,
    borderColor: '#FFC107',
    marginBottom: moderateScale(20),
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
    marginBottom: moderateScale(15),
  },
  ratingScore: {
    fontSize: scaleFontSize(24),
    fontWeight: 'bold',
    color: '#FFC107',
  },
  reviewBox: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(8),
    padding: moderateScale(15),
  },
  reviewLabel: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(8),
  },
  reviewText: {
    fontSize: scaleFontSize(15),
    color: '#555',
    lineHeight: scaleFontSize(22),
    marginBottom: moderateScale(10),
  },
  reviewDate: {
    fontSize: scaleFontSize(12),
    color: '#999',
  },
  actionButtonsContainer: { gap: moderateScale(12) },
  actionButtonsRow: {
    flexDirection: "row",
    gap: moderateScale(12),
  },
  fullButton: {
    backgroundColor: "#1C86FF",
    paddingVertical: hp(1.8),
    borderRadius: moderateScale(12),
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: moderateScale(8),
  },
  fullButtonText: { color: "#FFF", fontSize: scaleFontSize(16), fontWeight: "600" },
  sideBySideButton: {
    flex: 1,
    backgroundColor: "#9E9E9E",
    paddingVertical: hp(1.8),
    borderRadius: moderateScale(12),
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: moderateScale(6),
  },
  sideBySideButtonText: { color: "#FFF", fontSize: scaleFontSize(16), fontWeight: "600" },
  sideBySideButtonOutline: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: hp(1.8),
    borderRadius: moderateScale(12),
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: moderateScale(6),
    borderWidth: 2,
    borderColor: "#FF6B6B",
  },
  sideBySideButtonOutlineText: { color: "#FF6B6B", fontSize: scaleFontSize(16), fontWeight: "600" },
  completeButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: hp(1.8),
    borderRadius: moderateScale(12),
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: moderateScale(8),
  },
  completeButtonText: { color: "#FFF", fontSize: scaleFontSize(16), fontWeight: "600" },
  cancelButton: {
    backgroundColor: "#fff",
    paddingVertical: hp(1.8),
    borderRadius: moderateScale(12),
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: moderateScale(8),
    borderWidth: 2,
    borderColor: "#FF6B6B",
  },
  cancelButtonText: { color: "#FF6B6B", fontSize: scaleFontSize(16), fontWeight: "600" },
  buttonDisabled: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(20),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#1C86FF',
  },
  modalBody: {
    padding: moderateScale(20),
  },
  modalSectionTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(15),
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(15),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: moderateScale(15),
    gap: moderateScale(10),
  },
  dateTimeButtonText: {
    flex: 1,
    fontSize: scaleFontSize(15),
    color: '#333',
    fontWeight: '500',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: moderateScale(12),
    marginTop: moderateScale(20),
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: moderateScale(15),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  modalCancelButtonText: {
    color: '#666',
    fontSize: scaleFontSize(16),
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#1C86FF',
    paddingVertical: moderateScale(15),
    borderRadius: moderateScale(12),
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: '600',
  },
  rejectInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: scaleFontSize(15),
    color: '#333',
    minHeight: moderateScale(100),
    marginBottom: moderateScale(20),
  },
});

export default AppointmentDetail;
