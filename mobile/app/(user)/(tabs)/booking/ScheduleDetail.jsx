import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Platform,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from '@react-native-community/datetimepicker';
import Header from "@components/Header";
import { hp, wp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from "@config/api";

const ScheduleDetail = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // State for API data
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State for cancellation modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // State for edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editFormData, setEditFormData] = useState({
    appointmentDateTime: null,
    notes: '',
    specialRequests: '',
    paymentMethod: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Fetch booking details from API
  useEffect(() => {
    fetchBookingDetail();
  }, [params.bookingId]);

  const fetchBookingDetail = async () => {
    try {
      setIsLoading(true);
      const bookingId = params.bookingId;

      if (!bookingId) {
        Alert.alert('Error', 'Booking ID not provided');
        router.back();
        return;
      }

      const response = await apiClient.get(`/bookings/${bookingId}`);

      if (response.data.success) {
        setBooking(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load booking details';
      Alert.alert('Error', errorMessage);

      if (error.response?.status === 404) {
        router.back();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText} numberOfLines={1}>
        Booking Details
      </Text>
    </View>
  );

  // Format ISO date to readable format
  const formatDate = (isoDate) => {
    if (!isoDate) return "Not specified";
    try {
      const date = new Date(isoDate);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        weekday: 'short'
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  // Format ISO time to readable format
  const formatTime = (isoDate) => {
    if (!isoDate) return "Not specified";
    try {
      const date = new Date(isoDate);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return "Invalid time";
    }
  };

  // Format datetime with both date and time
  const formatDateTime = (isoDate) => {
    if (!isoDate) return "Not specified";
    return `${formatDate(isoDate)} • ${formatTime(isoDate)}`;
  };

  // Format payment method for display
  const formatPaymentMethod = (method) => {
    if (!method) return 'Not specified';
    const methodMap = {
      'cash': 'Cash',
      'gcash': 'GCash',
      'paymaya': 'PayMaya',
      'credit-card': 'Credit Card',
      'debit-card': 'Debit Card',
      'qr-payment': 'QR Payment',
    };
    return methodMap[method] || method;
  };

  // Format price for display
  const formatPrice = (totalAmount) => {
    if (!totalAmount || !totalAmount.amount) return 'Not specified';
    const amount = parseFloat(totalAmount.amount);
    const currency = totalAmount.currency || 'PHP';
    return `₱${amount.toLocaleString()}`;
  };

  // Get service icon based on category
  const getServiceIcon = (serviceId) => {
    const category = serviceId?.category?.toLowerCase();
    switch (category) {
      case 'veterinary':
        return 'medical-outline';
      case 'grooming':
        return 'cut-outline';
      case 'boarding':
      case 'daycare':
        return 'home-outline';
      case 'training':
        return 'school-outline';
      case 'emergency':
        return 'alert-circle-outline';
      default:
        return 'paw-outline';
    }
  };

  const getStatusConfig = (status) => {
    if (!status) return { label: "Unknown", backgroundColor: "#9E9E9E" };

    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "pending":
        return { label: "Pending", backgroundColor: "#FF9B79" };
      case "confirmed":
        return { label: "Confirmed", backgroundColor: "#4CAF50" };
      case "in-progress":
        return { label: "In Progress", backgroundColor: "#1C86FF" };
      case "completed":
        return { label: "Completed", backgroundColor: "#2196F3" };
      case "cancelled":
        return { label: "Cancelled", backgroundColor: "#FF6B6B" };
      case "no-show":
        return { label: "No Show", backgroundColor: "#9E9E9E" };
      default:
        return { label: status.charAt(0).toUpperCase() + status.slice(1), backgroundColor: "#9E9E9E" };
    }
  };

  const copyBookingId = () => {
    Alert.alert("Copied", "Booking ID copied to clipboard");
  };

  const handleCancelPress = () => {
    setShowCancelModal(true);
  };

  const handleCancelBooking = async () => {
    if (!cancellationReason.trim()) {
      Alert.alert('Required', 'Please provide a cancellation reason');
      return;
    }

    if (cancellationReason.length > 200) {
      Alert.alert('Validation Error', 'Cancellation reason must be 200 characters or less');
      return;
    }

    try {
      setIsCancelling(true);

      const response = await apiClient.patch(`/bookings/${booking._id}/status`, {
        status: 'cancelled',
        cancellationReason: cancellationReason.trim(),
      });

      if (response.data.success) {
        Alert.alert('Success', 'Booking cancelled successfully');
        setShowCancelModal(false);
        setCancellationReason('');
        // Refresh booking data
        fetchBookingDetail();
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to cancel booking';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRate = () => {
    if (!booking) return;

    router.push({
      pathname: '../booking/review-service',
      params: {
        bookingId: booking._id,
        businessName: booking.businessId?.businessName || 'Business',
        serviceName: booking.serviceId?.name || 'Service',
      },
    });
  };

  const handleViewQR = () => {
    if (!booking) return;

    router.push({
      pathname: '../booking/payment-qr',
      params: {
        bookingId: booking._id,
        businessName: booking.businessId?.businessName || 'Business',
        amount: booking.totalAmount?.amount || 0,
      },
    });
  };

  const handleUploadProof = () => {
    if (!booking) return;

    router.push({
      pathname: '../booking/upload-payment-proof',
      params: {
        bookingId: booking._id,
      },
    });
  };

  const handleEditPress = () => {
    if (!booking) return;

    // Pre-fill form with current booking data
    setEditFormData({
      appointmentDateTime: booking.appointmentDateTime ? new Date(booking.appointmentDateTime) : new Date(),
      notes: booking.notes || '',
      specialRequests: booking.specialRequests || '',
      paymentMethod: booking.paymentMethod || 'cash',
    });
    setShowEditModal(true);
  };

  const handleSubmitEdit = async () => {
    try {
      setIsSubmittingEdit(true);

      const editData = {
        appointmentDateTime: editFormData.appointmentDateTime?.toISOString(),
        notes: editFormData.notes,
        specialRequests: editFormData.specialRequests,
        paymentMethod: editFormData.paymentMethod,
      };

      const response = await apiClient.put(`/bookings/${booking._id}`, editData);

      if (response.data.success) {
        Alert.alert(
          'Edit Request Submitted',
          'Your booking edit request has been submitted. The business owner will review and approve your changes.',
          [{ text: 'OK', onPress: () => {
            setShowEditModal(false);
            fetchBookingDetail(); // Refresh booking data
          }}]
        );
      }
    } catch (error) {
      console.error('Error submitting edit request:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit edit request';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const currentDateTime = editFormData.appointmentDateTime || new Date();
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(currentDateTime.getHours());
      newDateTime.setMinutes(currentDateTime.getMinutes());
      setEditFormData({ ...editFormData, appointmentDateTime: newDateTime });
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const currentDateTime = editFormData.appointmentDateTime || new Date();
      const newDateTime = new Date(currentDateTime);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      setEditFormData({ ...editFormData, appointmentDateTime: newDateTime });
    }
  };

  const renderActionButtons = () => {
    if (!booking) return null;

    const status = booking.status?.toLowerCase();
    const paymentStatus = booking.paymentStatus?.toLowerCase();
    const paymentMethod = booking.paymentMethod?.toLowerCase();

    // Show rate button for completed bookings without rating
    if (status === "completed" && !booking.rating) {
      return (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.fullButton} onPress={handleRate}>
            <Ionicons name="star-outline" size={moderateScale(20)} color="#fff" />
            <Text style={styles.fullButtonText}>Rate Service</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Show payment buttons for pending/confirmed bookings with pending payment
    if ((status === "pending" || status === "confirmed") && paymentStatus === "pending") {
      // For cash payment, show only cancel button with cash payment info
      if (paymentMethod === "cash") {
        return (
          <View style={styles.actionButtonsContainer}>
            {/* Cash Payment Info Card */}
            <View style={styles.cashPaymentInfoCard}>
              <View style={styles.cashIconContainer}>
                <Ionicons name="cash" size={moderateScale(50)} color="#00B140" />
              </View>
              <Text style={styles.cashPaymentTitle}>Cash Payment Selected</Text>
              <Text style={styles.cashPaymentDescription}>
                You have selected to pay with cash at the business location
              </Text>

              <View style={styles.cashInstructionsBox}>
                <View style={styles.cashInstructionRow}>
                  <Ionicons name="information-circle" size={moderateScale(18)} color="#1C86FF" />
                  <Text style={styles.cashInstructionTitle}>Payment Instructions</Text>
                </View>
                <Text style={styles.cashInstructionText}>
                  • Bring exact amount or sufficient cash{'\n'}
                  • Payment will be made at business location{'\n'}
                  • Amount to pay: {formatPrice(booking.totalAmount)}{'\n'}
                  • Present your booking ID when you arrive
                </Text>
              </View>

              <View style={styles.cashReminderBox}>
                <Ionicons name="time-outline" size={moderateScale(20)} color="#FF9B79" />
                <Text style={styles.cashReminderText}>
                  Please arrive on time. Late arrivals may result in service delays or cancellation.
                </Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.fullButton, { backgroundColor: '#FF6B6B' }]} onPress={handleCancelPress}>
              <Ionicons name="close-circle-outline" size={moderateScale(20)} color="#fff" />
              <Text style={styles.fullButtonText}>Cancel Booking</Text>
            </TouchableOpacity>
          </View>
        );
      }

      // For other payment methods, show QR and upload buttons
      return (
        <View style={styles.actionButtonsContainer}>
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.sideBySideButton} onPress={handleViewQR}>
              <Ionicons name="qr-code" size={moderateScale(20)} color="#fff" />
              <Text style={styles.sideBySideButtonText}>View QR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sideBySideButtonOutline} onPress={handleUploadProof}>
              <Ionicons name="cloud-upload-outline" size={moderateScale(20)} color="#1C86FF" />
              <Text style={styles.sideBySideButtonOutlineText}>Upload Proof</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.fullButton, { backgroundColor: '#FF6B6B' }]} onPress={handleCancelPress}>
            <Ionicons name="close-circle-outline" size={moderateScale(20)} color="#fff" />
            <Text style={styles.fullButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Show re-upload button if payment proof was rejected
    if ((status === "pending" || status === "confirmed") && paymentStatus === "failed") {
      return (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.fullButton} onPress={handleUploadProof}>
            <Ionicons name="cloud-upload-outline" size={moderateScale(20)} color="#fff" />
            <Text style={styles.fullButtonText}>Re-upload Payment Proof</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.fullButton, { backgroundColor: '#FF6B6B' }]} onPress={handleCancelPress}>
            <Ionicons name="close-circle-outline" size={moderateScale(20)} color="#fff" />
            <Text style={styles.fullButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Show edit and cancel buttons for pending/confirmed bookings with proof uploaded or paid
    if ((status === "pending" || status === "confirmed") && (paymentStatus === "proof-uploaded" || paymentStatus === "paid")) {
      return (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.fullButton} onPress={handleEditPress}>
            <Ionicons name="create-outline" size={moderateScale(20)} color="#fff" />
            <Text style={styles.fullButtonText}>Edit Booking</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.fullButton, { backgroundColor: '#FF6B6B' }]} onPress={handleCancelPress}>
            <Ionicons name="close-circle-outline" size={moderateScale(20)} color="#fff" />
            <Text style={styles.fullButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // No buttons for other statuses
    return null;
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
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

  // Error state - no booking data
  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          backgroundColor="#1C86FF"
          titleColor="#fff"
          customTitle={renderTitle()}
          showBack={true}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={moderateScale(60)} color="#FF6B6B" />
          <Text style={styles.errorText}>Booking not found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = getStatusConfig(booking.status);

  return (
    <SafeAreaView style={styles.container}>
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

        {/* Business/Service Info */}
        <View style={styles.clinicSection}>
          <View style={styles.clinicLogo}>
            <Ionicons name={getServiceIcon(booking.serviceId)} size={hp(4.5)} color="#1C86FF" />
          </View>
          <Text style={styles.clinicName}>{booking.businessId?.businessName || 'Business Name'}</Text>
          <Text style={styles.serviceName}>{booking.serviceId?.name || 'Service'}</Text>
        </View>

        {/* Booking Details */}
        <View style={styles.detailsBox}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booking ID</Text>
            <View style={styles.bookingIdContainer}>
              <Text style={styles.detailValue}>{booking._id.slice(-8).toUpperCase()}</Text>
              <TouchableOpacity style={styles.copyButton} onPress={copyBookingId}>
                <Text style={styles.copyButtonText}>Copy</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Appointment</Text>
            <Text style={styles.detailValue}>{formatDateTime(booking.appointmentDateTime)}</Text>
          </View>

          {booking.duration && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>{booking.duration} minutes</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pet</Text>
            <Text style={styles.detailValue}>
              {booking.petId?.name || 'Pet'}
              {booking.petId?.species && ` (${booking.petId.species})`}
            </Text>
          </View>

          {booking.totalAmount && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Amount</Text>
              <Text style={styles.detailValuePrice}>{formatPrice(booking.totalAmount)}</Text>
            </View>
          )}

          {booking.paymentMethod && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <Text style={styles.detailValue}>{formatPaymentMethod(booking.paymentMethod)}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Status</Text>
            <Text style={[styles.detailValue, {
              color: booking.paymentStatus === 'paid' ? '#4CAF50' :
                     booking.paymentStatus === 'proof-uploaded' ? '#1C86FF' :
                     booking.paymentStatus === 'failed' ? '#FF6B6B' :
                     booking.paymentStatus === 'refunded' ? '#9E9E9E' : '#FF9B79'
            }]}>
              {booking.paymentStatus === 'proof-uploaded' ? 'Proof Uploaded' :
               booking.paymentStatus?.charAt(0).toUpperCase() + booking.paymentStatus?.slice(1) || 'Pending'}
            </Text>
          </View>

          {booking.paymentProof && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Proof</Text>
              <TouchableOpacity
                style={styles.viewProofButton}
                onPress={() => {/* View image logic */}}
              >
                <Ionicons name="image-outline" size={moderateScale(16)} color="#1C86FF" />
                <Text style={styles.viewProofText}>View</Text>
              </TouchableOpacity>
            </View>
          )}

          {booking.paymentRejectionReason && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Rejection</Text>
              <Text style={styles.detailValueNote}>{booking.paymentRejectionReason}</Text>
            </View>
          )}

          {booking.notes && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={styles.detailValueNote}>{booking.notes}</Text>
            </View>
          )}

          {booking.specialRequests && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Special Requests</Text>
              <Text style={styles.detailValueNote}>{booking.specialRequests}</Text>
            </View>
          )}

          {booking.cancellationReason && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cancellation Reason</Text>
              <Text style={styles.detailValueNote}>{booking.cancellationReason}</Text>
            </View>
          )}

          {booking.editRequest && (
            <View style={styles.editRequestSection}>
              <View style={styles.editRequestHeader}>
                <Ionicons
                  name={
                    booking.editRequest.approvalStatus === 'approved' ? 'checkmark-circle' :
                    booking.editRequest.approvalStatus === 'rejected' ? 'close-circle' :
                    'time-outline'
                  }
                  size={moderateScale(24)}
                  color={
                    booking.editRequest.approvalStatus === 'approved' ? '#4CAF50' :
                    booking.editRequest.approvalStatus === 'rejected' ? '#FF6B6B' :
                    '#FF9B79'
                  }
                />
                <Text style={styles.editRequestTitle}>
                  {booking.editRequest.approvalStatus === 'approved' ? 'Edit Request Approved' :
                   booking.editRequest.approvalStatus === 'rejected' ? 'Edit Request Rejected' :
                   'Edit Request Pending'}
                </Text>
              </View>

              {booking.editRequest.approvalStatus === 'pending' && (
                <Text style={styles.editRequestMessage}>
                  Your edit request is waiting for business owner approval.
                </Text>
              )}

              {booking.editRequest.approvalStatus === 'rejected' && booking.editRequest.rejectionReason && (
                <View style={styles.editRequestRejectionBox}>
                  <Text style={styles.editRequestRejectionLabel}>Rejection Reason:</Text>
                  <Text style={styles.editRequestRejectionText}>{booking.editRequest.rejectionReason}</Text>
                </View>
              )}

              {booking.editRequest.appointmentDateTime && (
                <View style={styles.editRequestDetailRow}>
                  <Text style={styles.editRequestDetailLabel}>Requested Date:</Text>
                  <Text style={styles.editRequestDetailValue}>
                    {formatDateTime(booking.editRequest.appointmentDateTime)}
                  </Text>
                </View>
              )}

              <Text style={styles.editRequestTimestamp}>
                Requested on {formatDateTime(booking.editRequest.requestedAt)}
              </Text>
            </View>
          )}

          {booking.rating && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Your Rating</Text>
              <View>
                <Text style={styles.detailValue}>⭐ {booking.rating.score}/5</Text>
                {booking.rating.review && (
                  <Text style={styles.detailValueNote}>{booking.rating.review}</Text>
                )}
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booked On</Text>
            <Text style={styles.detailValue}>{formatDateTime(booking.createdAt)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        {renderActionButtons()}
      </ScrollView>

      {/* Cancellation Modal */}
      <Modal
        visible={showCancelModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Cancel Booking</Text>
            <Text style={styles.modalSubtitle}>Please provide a reason for cancellation</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Reason for cancellation (max 200 characters)"
              placeholderTextColor="#999"
              value={cancellationReason}
              onChangeText={setCancellationReason}
              multiline
              maxLength={200}
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={styles.characterCount}>{cancellationReason.length}/200</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => {
                  setShowCancelModal(false);
                  setCancellationReason('');
                }}
                disabled={isCancelling}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButtonConfirm, isCancelling && styles.modalButtonDisabled]}
                onPress={handleCancelBooking}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonConfirmText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
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
  content: {
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(20),
  },
  statusBar: {
    width: "100%",
    paddingVertical: hp(1.2),
    borderRadius: moderateScale(8),
    alignItems: "center",
    marginBottom: moderateScale(20),
  },
  statusBarText: { color: "#FFF", fontSize: scaleFontSize(16), fontWeight: "600" },
  clinicSection: { alignItems: "center", marginBottom: moderateScale(20) },
  clinicLogo: {
    width: hp(9),
    height: hp(9),
    borderRadius: hp(4.5),
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: moderateScale(10),
  },
  clinicName: { fontSize: scaleFontSize(18), fontWeight: "bold", color: "#333" },
  serviceName: { fontSize: scaleFontSize(14), color: "#666" },
  detailsBox: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: moderateScale(12),
    padding: moderateScale(10),
    marginBottom: hp(3),
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  detailLabel: { fontSize: scaleFontSize(14), fontWeight: "500", color: "#666", flex: 1 },
  detailValue: { fontSize: scaleFontSize(14), color: "#333", fontWeight: "600", flex: 2, textAlign: "right" },
  detailValuePrice: { fontSize: scaleFontSize(16), color: "#4CAF50", fontWeight: "bold", flex: 2, textAlign: "right" },
  detailValueNote: { fontSize: scaleFontSize(13), color: "#555", fontStyle: "italic", flex: 2, textAlign: "right" },
  bookingIdContainer: { flexDirection: "row", alignItems: "center", flex: 2, justifyContent: "flex-end" },
  copyButton: {
    marginLeft: moderateScale(10),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  copyButtonText: { color: "#2196F3", fontSize: scaleFontSize(12), fontWeight: "600" },
  viewProofButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#1C86FF',
    backgroundColor: '#F0F8FF',
  },
  viewProofText: {
    color: '#1C86FF',
    fontSize: scaleFontSize(13),
    fontWeight: '600',
  },
  actionButtonsContainer: { gap: moderateScale(12) },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: moderateScale(40),
  },
  loadingText: {
    marginTop: moderateScale(12),
    fontSize: scaleFontSize(14),
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(8),
  },
  errorText: {
    fontSize: scaleFontSize(18),
    color: "#333",
    marginTop: moderateScale(16),
    marginBottom: moderateScale(24),
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#1C86FF",
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(8),
  },
  retryButtonText: {
    color: "#fff",
    fontSize: scaleFontSize(16),
    fontWeight: "bold",
  },
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
    backgroundColor: "#1C86FF",
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
    borderColor: "#1C86FF",
  },
  sideBySideButtonOutlineText: { color: "#1C86FF", fontSize: scaleFontSize(16), fontWeight: "600" },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(16),
    padding: moderateScale(24),
    width: wp(85),
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: "bold",
    color: "#333",
    marginBottom: moderateScale(8),
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: scaleFontSize(14),
    color: "#666",
    marginBottom: moderateScale(20),
    textAlign: "center",
  },
  modalInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: moderateScale(12),
    fontSize: scaleFontSize(14),
    color: "#333",
    minHeight: moderateScale(100),
    maxHeight: moderateScale(150),
  },
  characterCount: {
    fontSize: scaleFontSize(12),
    color: "#999",
    textAlign: "right",
    marginTop: moderateScale(4),
    marginBottom: moderateScale(20),
  },
  modalButtons: {
    flexDirection: "row",
    gap: moderateScale(12),
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#1C86FF",
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(8),
    alignItems: "center",
  },
  modalButtonCancelText: {
    color: "#1C86FF",
    fontSize: scaleFontSize(16),
    fontWeight: "600",
  },
  modalButtonConfirm: {
    flex: 1,
    backgroundColor: "#FF6B6B",
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(8),
    alignItems: "center",
  },
  modalButtonConfirmText: {
    color: "#fff",
    fontSize: scaleFontSize(16),
    fontWeight: "600",
  },
  modalButtonDisabled: {
    backgroundColor: "#FFB3B3",
  },
  // Cash payment styles
  cashPaymentInfoCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(20),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cashIconContainer: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  cashPaymentTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#00B140',
    marginBottom: moderateScale(8),
    textAlign: 'center',
  },
  cashPaymentDescription: {
    fontSize: scaleFontSize(14),
    color: '#666',
    textAlign: 'center',
    marginBottom: moderateScale(20),
    lineHeight: scaleFontSize(20),
  },
  cashInstructionsBox: {
    width: '100%',
    backgroundColor: '#E3F2FD',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: moderateScale(12),
    borderLeftWidth: moderateScale(4),
    borderLeftColor: '#1C86FF',
  },
  cashInstructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  cashInstructionTitle: {
    fontSize: scaleFontSize(15),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginLeft: moderateScale(8),
  },
  cashInstructionText: {
    fontSize: scaleFontSize(13),
    color: '#333',
    lineHeight: scaleFontSize(20),
  },
  cashReminderBox: {
    width: '100%',
    backgroundColor: '#FFF4E6',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: moderateScale(4),
    borderLeftColor: '#FF9B79',
  },
  cashReminderText: {
    flex: 1,
    fontSize: scaleFontSize(13),
    color: '#666',
    lineHeight: scaleFontSize(19),
    marginLeft: moderateScale(10),
  },
});

export default ScheduleDetail;
