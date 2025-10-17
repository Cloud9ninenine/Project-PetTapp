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
  ActivityIndicator,
  Image,
  Linking,
  TextInput,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import Header from "@components/Header";
import { hp, wp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from '@config/api';

const AppointmentDetail = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [bookingData, setBookingData] = useState(null);
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
        setBookingData(response.data.data);
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
    const petOwner = bookingData?.petOwnerId || {};
    const contactNumber = petOwner.contactNumber;

    if (contactNumber) {
      Linking.openURL(`tel:${contactNumber}`);
    } else {
      Alert.alert('No Contact', 'No contact number available for this customer');
    }
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

  // Extract all data
  const statusConfig = getStatusConfig(bookingData.status);

  // Service information
  const service = bookingData.serviceId || {};
  const serviceName = service.name || 'Service';
  const serviceCategory = service.category || 'N/A';
  const serviceDuration = bookingData.duration || 'N/A';
  const servicePrice = bookingData.totalAmount || {};

  // Pet owner information
  const petOwner = bookingData.petOwnerId || {};
  const ownerName = (petOwner.firstName && petOwner.lastName)
    ? `${petOwner.firstName} ${petOwner.lastName}`.trim()
    : 'Unknown Customer';
  const ownerEmail = petOwner.email || 'N/A';
  const ownerPhone = petOwner.contactNumber || 'N/A';

  // Pet information
  const pet = bookingData.petId || {};
  const petName = pet.name || 'Unknown Pet';
  const petSpecies = pet.species || 'N/A';
  const petAge = pet.age ? `${pet.age} years` : 'N/A';

  // Appointment details
  const bookingId = bookingData._id ? `#${bookingData._id.slice(-8).toUpperCase()}` : 'N/A';
  const appointmentTime = formatDateTime(bookingData.appointmentDateTime);
  const createdAt = formatDateTime(bookingData.createdAt);

  // Payment information
  const paymentAmount = `${servicePrice.currency || 'PHP'} ${servicePrice.amount?.toFixed(2) || '0.00'}`;
  const paymentStatus = bookingData.paymentStatus?.toLowerCase();
  const paymentMethod = getPaymentMethodLabel(bookingData.paymentMethod);

  // Payment proof
  const paymentProof = bookingData.paymentProof;
  const paymentProofUri = paymentProof?.imageUrl || null;
  const proofRejectionReason = paymentProof?.rejectionReason || null;

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
      <ScrollView contentContainerStyle={styles.content}>

        {/* 1. Service Information */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="briefcase-outline" size={moderateScale(22)} color="#1C86FF" />
            <Text style={styles.sectionTitle}>Service Information</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Service Name</Text>
            <Text style={styles.dataValue}>{serviceName}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Category</Text>
            <Text style={styles.dataValue}>{serviceCategory}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Duration</Text>
            <Text style={styles.dataValue}>{serviceDuration} min</Text>
          </View>
          <View style={[styles.dataRow, styles.dataRowLast]}>
            <Text style={styles.dataLabel}>Price</Text>
            <Text style={styles.dataValue}>{paymentAmount}</Text>
          </View>
        </View>

        {/* 2. Pet Owner Information */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="person-outline" size={moderateScale(22)} color="#1C86FF" />
            <Text style={styles.sectionTitle}>Pet Owner Information</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Name</Text>
            <Text style={styles.dataValue}>{ownerName}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Email</Text>
            <Text style={styles.dataValue}>{ownerEmail}</Text>
          </View>
          <View style={[styles.dataRow, styles.dataRowLast]}>
            <Text style={styles.dataLabel}>Contact</Text>
            <TouchableOpacity onPress={handleCallCustomer} style={styles.callButton}>
              <Ionicons name="call-outline" size={moderateScale(14)} color="#1C86FF" />
              <Text style={styles.callButtonText}>{ownerPhone}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Pet Information */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="paw-outline" size={moderateScale(22)} color="#1C86FF" />
            <Text style={styles.sectionTitle}>Pet Information</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Pet Name</Text>
            <Text style={styles.dataValue}>{petName}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Species</Text>
            <Text style={styles.dataValue}>{petSpecies}</Text>
          </View>
          <View style={[styles.dataRow, styles.dataRowLast]}>
            <Text style={styles.dataLabel}>Age</Text>
            <Text style={styles.dataValue}>{petAge}</Text>
          </View>
        </View>

        {/* 4. Appointment Details */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="calendar-outline" size={moderateScale(22)} color="#1C86FF" />
            <Text style={styles.sectionTitle}>Appointment Details</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Booking ID</Text>
            <Text style={[styles.dataValue, styles.bookingIdText]}>{bookingId}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Status</Text>
            <View style={[styles.statusBadgeInline, { backgroundColor: statusConfig.backgroundColor }]}>
              <Text style={styles.statusBadgeText}>{statusConfig.label}</Text>
            </View>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Appointment Time</Text>
            <Text style={styles.dataValue}>{appointmentTime}</Text>
          </View>
          <View style={[styles.dataRow, styles.dataRowLast]}>
            <Text style={styles.dataLabel}>Booked On</Text>
            <Text style={styles.dataValue}>{createdAt}</Text>
          </View>

          {bookingData.notes && (
            <View style={[styles.dataRow, styles.dataRowLast]}>
              <Text style={styles.dataLabel}>Customer Notes</Text>
              <Text style={[styles.dataValue, styles.dataValueMultiline]}>{bookingData.notes}</Text>
            </View>
          )}

          {bookingData.specialRequests && (
            <View style={[styles.dataRow, styles.dataRowLast]}>
              <Text style={styles.dataLabel}>Special Requests</Text>
              <Text style={[styles.dataValue, styles.dataValueMultiline]}>{bookingData.specialRequests}</Text>
            </View>
          )}

          {bookingData.cancellationReason && (
            <View style={[styles.dataRow, styles.dataRowLast]}>
              <Text style={styles.dataLabel}>Cancellation Reason</Text>
              <Text style={[styles.dataValue, styles.dataValueMultiline, { color: '#FF6B6B' }]}>
                {bookingData.cancellationReason}
              </Text>
            </View>
          )}
        </View>

        {/* 5. Payment Information */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="wallet-outline" size={moderateScale(22)} color="#1C86FF" />
            <Text style={styles.sectionTitle}>Payment Information</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Amount</Text>
            <Text style={styles.dataValue}>{paymentAmount}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Status</Text>
            <Text style={[styles.dataValue, {
              color: paymentStatus === 'paid' ? '#4CAF50' :
                     paymentStatus === 'failed' ? '#FF6B6B' :
                     paymentStatus === 'proof-uploaded' ? '#FFC107' : '#666'
            }]}>
              {getPaymentStatusLabel(paymentStatus)}
            </Text>
          </View>
          <View style={[styles.dataRow, styles.dataRowLast]}>
            <Text style={styles.dataLabel}>Method</Text>
            <Text style={styles.dataValue}>{paymentMethod}</Text>
          </View>
        </View>

        {/* 6. Payment Proof */}
        {paymentProofUri && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="image-outline" size={moderateScale(22)} color="#1C86FF" />
              <Text style={styles.sectionTitle}>Payment Proof</Text>
            </View>
            <Image
              source={{ uri: paymentProofUri }}
              style={styles.paymentProofImage}
              resizeMode="contain"
            />

            {rejectionReason && (
              <View style={styles.rejectionReasonBox}>
                <Text style={styles.rejectionReasonLabel}>Rejection Reason:</Text>
                <Text style={styles.rejectionReasonText}>{rejectionReason}</Text>
              </View>
            )}

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

        {/* 7. Action Buttons */}
        {renderActionButtons()}
      </ScrollView>

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
  // Section Card Styles
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: moderateScale(16),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(16),
    paddingBottom: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: moderateScale(10),
  },
  sectionTitle: {
    fontSize: scaleFontSize(17),
    fontWeight: 'bold',
    color: '#1C86FF',
  },
  // Data Row Styles
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  dataRowLast: {
    borderBottomWidth: 0,
  },
  dataLabel: {
    fontSize: scaleFontSize(13),
    color: '#8E8E93',
    fontWeight: '500',
    flex: 1,
  },
  dataValue: {
    fontSize: scaleFontSize(14),
    color: '#1C1C1E',
    fontWeight: '600',
    flex: 1.5,
    textAlign: 'right',
  },
  dataValueMultiline: {
    textAlign: 'left',
  },
  bookingIdText: {
    fontFamily: 'monospace',
    fontSize: scaleFontSize(13),
  },
  // Status Badge Inline
  statusBadgeInline: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(8),
    alignSelf: 'flex-end',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: scaleFontSize(12),
    fontWeight: '600',
  },
  // Call Button
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    backgroundColor: '#E3F2FD',
    borderRadius: moderateScale(6),
    alignSelf: 'flex-end',
  },
  callButtonText: {
    fontSize: scaleFontSize(13),
    color: '#1C86FF',
    fontWeight: '500',
  },
  // Payment Proof Styles
  paymentProofImage: {
    width: '100%',
    height: hp(30),
    borderRadius: moderateScale(8),
    backgroundColor: '#F8F9FA',
    marginBottom: moderateScale(15),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  rejectionReasonBox: {
    backgroundColor: '#FFF3F3',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    marginBottom: moderateScale(15),
    borderWidth: 1,
    borderColor: '#FFD6D6',
  },
  rejectionReasonLabel: {
    fontSize: scaleFontSize(13),
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: moderateScale(6),
  },
  rejectionReasonText: {
    fontSize: scaleFontSize(14),
    color: '#666',
    lineHeight: scaleFontSize(20),
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
