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
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from "@components/Header";
import { hp, wp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from '@config/api';
import { getOrCreateConversation } from '@services/api/messageApiService';
import { ensureFirebaseAuth } from '@utils/firebaseAuthPersistence';
import { getConversationDetails } from '@utils/messageService';

const AppointmentDetail = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectEditModal, setRejectEditModal] = useState(false);
  const [editRejectionReason, setEditRejectionReason] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);

  // Confirmation modal states
  const [confirmationModal, setConfirmationModal] = useState({
    visible: false,
    title: '',
    message: '',
    action: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmColor: '#1C86FF',
  });

  // Success modal states
  const [successModal, setSuccessModal] = useState({
    visible: false,
    title: '',
    message: '',
    icon: 'checkmark-circle',
    iconColor: '#4CAF50',
  });

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

  const showSuccessModal = (title, message, icon = 'checkmark-circle', iconColor = '#4CAF50') => {
    setSuccessModal({
      visible: true,
      title,
      message,
      icon,
      iconColor,
    });

    // Auto-close after 2 seconds
    setTimeout(() => {
      setSuccessModal(prev => ({ ...prev, visible: false }));
    }, 2000);
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setUpdating(true);

      await apiClient.patch(`/bookings/${params.bookingId}/status`, {
        status: newStatus,
      });

      const statusLabels = {
        'confirmed': 'Confirmed',
        'in-progress': 'In Progress',
        'completed': 'Completed',
        'no-show': 'No Show',
        'cancelled': 'Cancelled',
      };

      setUpdating(false);
      showSuccessModal(
        `${statusLabels[newStatus] || newStatus}`,
        `Booking status updated successfully!`
      );

      // Refresh booking details after modal closes (2 seconds + buffer)
      setTimeout(() => fetchBookingDetails(), 2200);
    } catch (error) {
      console.error('Error updating booking status:', error);
      setUpdating(false);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update booking status');
    }
  };

  const showConfirmationModal = (title, message, action, confirmText = 'Confirm', confirmColor = '#1C86FF') => {
    setConfirmationModal({
      visible: true,
      title,
      message,
      action,
      confirmText,
      cancelText: 'Cancel',
      confirmColor,
    });
  };

  const handleConfirmationConfirm = async () => {
    if (confirmationModal.action) {
      setConfirmationModal(prev => ({ ...prev, visible: false }));

      // Check if action is mark-as-paid
      if (confirmationModal.action === 'mark-as-paid') {
        await confirmMarkAsPaid();
      } else {
        await handleStatusUpdate(confirmationModal.action);
      }
    }
  };

  const handleConfirmationCancel = () => {
    setConfirmationModal(prev => ({ ...prev, visible: false }));
  };

  const handleConfirm = () => {
    showConfirmationModal(
      "Confirm Appointment",
      "Are you sure you want to confirm this appointment?",
      'confirmed',
      'Confirm',
      '#4CAF50'
    );
  };

  const handleStartService = () => {
    showConfirmationModal(
      "Start Service",
      "Mark this appointment as in progress?",
      'in-progress',
      'Start',
      '#FFC107'
    );
  };

  const handleComplete = () => {
    showConfirmationModal(
      "Mark as Complete",
      "Mark this appointment as completed?",
      'completed',
      'Complete',
      '#4CAF50'
    );
  };

  const handleNoShow = () => {
    showConfirmationModal(
      "Mark as No Show",
      "Mark this appointment as no show?",
      'no-show',
      'Confirm',
      '#9E9E9E'
    );
  };

  const handleCancel = () => {
    showConfirmationModal(
      "Cancel Appointment",
      "Are you sure you want to cancel this appointment?",
      'cancelled',
      'Cancel',
      '#FF6B6B'
    );
  };

  const handleVerifyPayment = async () => {
    try {
      setUpdating(true);

      await apiClient.patch(`/bookings/${params.bookingId}/payment-proof/verify`);

      // Only show success modal after API call succeeds
      setUpdating(false);
      showSuccessModal(
        "Payment Verified",
        "Payment has been verified successfully!",
        'checkmark-circle',
        '#4CAF50'
      );
      // Refresh booking details after modal closes (2 seconds + buffer)
      setTimeout(() => fetchBookingDetails(), 2200);
    } catch (error) {
      console.error('Error verifying payment:', error);
      setUpdating(false);
      Alert.alert('Error', error.response?.data?.message || 'Failed to verify payment');
    }
  };

  const handleMarkAsPaid = () => {
    showConfirmationModal(
      "Confirm Cash Payment",
      "Have you received the cash payment from the customer? This action will mark the payment as completed.",
      'mark-as-paid',
      'Mark as Paid',
      '#4CAF50'
    );
  };

  const confirmMarkAsPaid = async () => {
    try {
      setUpdating(true);

      await apiClient.patch(`/bookings/${params.bookingId}/status`, {
        paymentStatus: 'paid',
      });

      setUpdating(false);
      showSuccessModal(
        "Marked as Paid",
        "Payment has been marked as paid successfully!",
        'checkmark-circle',
        '#4CAF50'
      );
      // Refresh booking details after modal closes (2 seconds + buffer)
      setTimeout(() => fetchBookingDetails(), 2200);
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      setUpdating(false);
      Alert.alert('Error', error.response?.data?.message || 'Failed to mark payment as paid');
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

      // Only show success modal after API call succeeds
      setUpdating(false);
      showSuccessModal(
        "Payment Rejected",
        "Payment proof has been rejected successfully!",
        'close-circle',
        '#FF6B6B'
      );
      setRejectionReason('');
      // Refresh booking details after modal closes (2 seconds + buffer)
      setTimeout(() => fetchBookingDetails(), 2200);
    } catch (error) {
      console.error('Error rejecting payment:', error);
      setUpdating(false);
      Alert.alert('Error', error.response?.data?.message || 'Failed to reject payment');
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

  const handleChatCustomer = async () => {
    if (!bookingData || !bookingData.petOwnerId) {
      Alert.alert('Error', 'Customer information not available');
      return;
    }

    if (loadingChat) return;

    try {
      setLoadingChat(true);

      // Step 1: Ensure Firebase authentication
      console.log('🔐 Ensuring Firebase authentication...');
      const isFirebaseAuth = await ensureFirebaseAuth();

      if (!isFirebaseAuth) {
        throw new Error('Failed to authenticate with messaging service');
      }

      console.log('✅ Firebase authentication successful');

      // Step 2: Get customer ID from booking data
      const petOwner = bookingData.petOwnerId;
      const customerId = typeof petOwner === 'object' ? petOwner._id : petOwner;

      if (!customerId) {
        throw new Error('Could not find customer ID');
      }

      console.log('👤 Customer ID:', customerId);

      // Step 3: Get or create conversation with customer (matches web's startConversationWithUser)
      console.log('💬 Getting or creating conversation with customer...');
      const conversationData = await getOrCreateConversation(customerId);

      if (!conversationData || !conversationData.conversationId) {
        throw new Error('Could not create conversation - no conversation ID returned');
      }

      console.log('✅ Conversation ready:', conversationData.conversationId);

      // Step 4: Fetch participant details from Firestore
      console.log('📋 Fetching participant details from Firestore...');
      const conversationDetails = await getConversationDetails(conversationData.conversationId);

      if (!conversationDetails) {
        throw new Error('Could not fetch conversation details from Firestore');
      }

      // Get current user ID to identify the other participant
      const currentUserId = await AsyncStorage.getItem('userId');
      const currentFirebaseUid = `pettapp_${currentUserId}`;

      // Find the other participant (customer)
      const otherParticipantUid = conversationDetails.participants?.find(
        uid => uid !== currentFirebaseUid
      );

      if (!otherParticipantUid) {
        throw new Error('Could not find other participant in conversation');
      }

      // Get participant details from conversation's participantDetails field
      const customerDetails = conversationDetails.participantDetails?.[otherParticipantUid];

      console.log('✅ Customer details loaded:', {
        participantUid: otherParticipantUid,
        fullName: customerDetails?.fullName,
        role: customerDetails?.role
      });

      // Step 5: Navigate to chat screen with participant details from Firestore
      console.log('🚀 Navigating to chat...');
      router.push({
        pathname: '/(bsn)/(tabs)/messages/chat',
        params: {
          conversationId: conversationData.conversationId,
          receiverId: customerDetails?.userId || customerId,
          receiverName: customerDetails?.fullName || 'Customer',
          receiverImage: customerDetails?.profileImage || '',
        },
      });
    } catch (error) {
      console.error('❌ Error starting conversation with customer:', error);
      console.error('Error stack:', error.stack);

      // Provide user-friendly error messages
      let errorMessage = 'Could not start conversation with customer. Please try again.';
      let errorTitle = 'Error';

      if (error.message.includes('authenticate')) {
        errorTitle = 'Authentication Error';
        errorMessage = 'Failed to connect to messaging service. Please check your connection and try again.';
      } else if (error.message.includes('conversation details') || error.message.includes('participant')) {
        errorTitle = 'Connection Issue';
        errorMessage = 'Could not load conversation details. Please wait a moment and try again.';
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        errorTitle = 'Network Error';
        errorMessage = 'Please check your internet connection and try again.';
      } else if (error.code === 'permission-denied') {
        errorTitle = 'Permission Error';
        errorMessage = 'Unable to access conversation. Please try again or contact support.';
      }

      Alert.alert(errorTitle, errorMessage, [{ text: 'OK' }]);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleApproveEdit = async () => {
    Alert.alert(
      'Approve Edit Request',
      'Are you sure you want to approve this booking edit request? The changes will be applied immediately.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              setUpdating(true);
              await apiClient.patch(`/bookings/${params.bookingId}/approve-edit`);
              setUpdating(false);
              showSuccessModal(
                'Edit Request Approved',
                'Booking edit request has been approved successfully!',
                'checkmark-circle',
                '#4CAF50'
              );
              // Refresh booking details after modal closes (2 seconds + buffer)
              setTimeout(() => fetchBookingDetails(), 2200);
            } catch (error) {
              console.error('Error approving edit request:', error);
              setUpdating(false);
              Alert.alert('Error', error.response?.data?.message || 'Failed to approve edit request');
            }
          },
        },
      ]
    );
  };

  const handleRejectEdit = () => {
    setRejectEditModal(true);
  };

  const confirmRejectEdit = async () => {
    if (!editRejectionReason || editRejectionReason.trim() === '') {
      Alert.alert('Error', 'Rejection reason is required');
      return;
    }

    try {
      setUpdating(true);
      setRejectEditModal(false);

      await apiClient.patch(`/bookings/${params.bookingId}/reject-edit`, {
        rejectionReason: editRejectionReason,
      });

      setUpdating(false);
      showSuccessModal(
        'Edit Request Rejected',
        'Booking edit request has been rejected successfully!',
        'close-circle',
        '#FF6B6B'
      );
      setEditRejectionReason('');
      // Refresh booking details after modal closes (2 seconds + buffer)
      setTimeout(() => fetchBookingDetails(), 2200);
    } catch (error) {
      console.error('Error rejecting edit request:', error);
      setUpdating(false);
      Alert.alert('Error', error.response?.data?.message || 'Failed to reject edit request');
    }
  };


  const renderActionButtons = () => {
    if (!bookingData) return null;

    const status = bookingData.status?.toLowerCase();
    const paymentStatus = bookingData.paymentStatus?.toLowerCase();
    const paymentMethod = bookingData.paymentMethod?.toLowerCase();

    // If there's a pending edit request, hide action buttons (notice shown at top)
    if (bookingData.editRequest?.approvalStatus === 'pending') {
      return null;
    }

    if (status === "completed") {
      // Show Mark as Paid button for cash payments with pending payment status
      if (paymentMethod === 'cash' && paymentStatus === 'pending') {
        return (
          <View style={styles.actionButtonsContainer}>
            <View style={styles.cashPaymentStickyInfo}>
              <Ionicons name="information-circle" size={moderateScale(20)} color="#FF9B79" />
              <Text style={styles.cashPaymentStickyInfoText}>
                Service completed. Please confirm cash payment received.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.markAsPaidButtonSticky, updating && styles.buttonDisabled]}
              onPress={handleMarkAsPaid}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={moderateScale(22)} color="#fff" />
                  <Text style={styles.markAsPaidButtonStickyText}>Mark as Paid (Cash)</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        );
      }

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
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[styles.sideBySideButton, updating && styles.buttonDisabled]}
            onPress={handleConfirm}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#fff" />
                <Text style={styles.sideBySideButtonText}>Confirm</Text>
              </>
            )}
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
      <View style={styles.mainContent}>
        <ScrollView contentContainerStyle={styles.content}>

        {/* Action Required Notice - if pending edit request */}
        {bookingData.editRequest?.approvalStatus === 'pending' && (
          <View style={styles.pendingEditNoticeContainer}>
            <View style={styles.pendingEditNoticeBox}>
              <Ionicons name="alert-circle-outline" size={moderateScale(24)} color="#FF9B79" />
              <View style={styles.pendingEditNoticeContent}>
                <Text style={styles.pendingEditNoticeTitle}>Action Required</Text>
                <Text style={styles.pendingEditNoticeText}>
                  Please approve or reject the pending request below before taking any other action on this booking.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Pending Edit Request Section - if exists */}
        {bookingData.editRequest && (bookingData.editRequest.approvalStatus !== 'approved' ||
          bookingData.editRequest.notes || bookingData.editRequest.specialRequests ||
          bookingData.editRequest.paymentMethod) && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons
                name={
                  bookingData.editRequest.approvalStatus === 'approved' ? 'checkmark-circle' :
                  bookingData.editRequest.approvalStatus === 'rejected' ? 'close-circle' :
                  'time-outline'
                }
                size={moderateScale(22)}
                color={
                  bookingData.editRequest.approvalStatus === 'approved' ? '#4CAF50' :
                  bookingData.editRequest.approvalStatus === 'rejected' ? '#FF6B6B' :
                  '#FF9B79'
                }
              />
              <Text style={styles.sectionTitle}>
                {bookingData.editRequest.approvalStatus === 'approved' ? 'Edit Request - Approved' :
                 bookingData.editRequest.approvalStatus === 'rejected' ? 'Edit Request - Rejected' :
                 'Pending Edit Request'}
              </Text>
            </View>

            {bookingData.editRequest.approvalStatus === 'pending' && (
              <View style={styles.editRequestPendingBox}>
                <Ionicons name="alert-circle-outline" size={moderateScale(20)} color="#FF9B79" />
                <Text style={styles.editRequestPendingText}>
                  Customer has requested to edit this booking. Please review the changes below.
                </Text>
              </View>
            )}

            {bookingData.editRequest.appointmentDateTime && (
              <View style={styles.dateComparisonContainer}>
                {/* Original Date */}
                {bookingData.editRequest.originalAppointmentDateTime && (
                  <View style={styles.dateComparisonRow}>
                    <Ionicons name="calendar-outline" size={moderateScale(18)} color="#999" />
                    <View style={styles.dateComparisonContent}>
                      <Text style={styles.dateComparisonLabel}>Original Date/Time</Text>
                      <Text style={styles.dateComparisonOriginalValue}>
                        {formatDateTime(bookingData.editRequest.originalAppointmentDateTime)}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Arrow */}
                <View style={styles.dateArrowContainer}>
                  <Ionicons name="arrow-down" size={moderateScale(24)} color="#FF9B79" />
                </View>

                {/* New Requested Date */}
                <View style={styles.dateComparisonRow}>
                  <Ionicons name="calendar" size={moderateScale(18)} color="#FF9B79" />
                  <View style={styles.dateComparisonContent}>
                    <Text style={styles.dateComparisonLabel}>New Requested Date/Time</Text>
                    <Text style={styles.dateComparisonNewValue}>
                      {formatDateTime(bookingData.editRequest.appointmentDateTime)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {bookingData.editRequest.notes && (
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>New Notes</Text>
                <Text style={[styles.dataValue, styles.dataValueMultiline]}>
                  {bookingData.editRequest.notes}
                </Text>
              </View>
            )}

            {bookingData.editRequest.specialRequests && (
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>New Special Requests</Text>
                <Text style={[styles.dataValue, styles.dataValueMultiline]}>
                  {bookingData.editRequest.specialRequests}
                </Text>
              </View>
            )}

            {bookingData.editRequest.paymentMethod && (
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>New Payment Method</Text>
                <Text style={styles.dataValue}>
                  {getPaymentMethodLabel(bookingData.editRequest.paymentMethod)}
                </Text>
              </View>
            )}

            <View style={[styles.dataRow, styles.dataRowLast]}>
              <Text style={styles.dataLabel}>Requested On</Text>
              <Text style={styles.dataValue}>
                {formatDateTime(bookingData.editRequest.requestedAt)}
              </Text>
            </View>

            {bookingData.editRequest.approvalStatus === 'rejected' && bookingData.editRequest.rejectionReason && (
              <View style={styles.editRejectionBox}>
                <Text style={styles.editRejectionLabel}>Your Rejection Reason:</Text>
                <Text style={styles.editRejectionText}>{bookingData.editRequest.rejectionReason}</Text>
              </View>
            )}

            {bookingData.editRequest.approvalStatus === 'pending' && (
              <View style={styles.editRequestActions}>
                <TouchableOpacity
                  style={[styles.approveEditButton, updating && styles.buttonDisabled]}
                  onPress={handleApproveEdit}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#fff" />
                      <Text style={styles.approveEditButtonText}>Approve</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.rejectEditButton, updating && styles.buttonDisabled]}
                  onPress={handleRejectEdit}
                  disabled={updating}
                >
                  <Ionicons name="close-circle" size={moderateScale(20)} color="#FF6B6B" />
                  <Text style={styles.rejectEditButtonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

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
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Contact</Text>
            <TouchableOpacity onPress={handleCallCustomer} style={styles.callButton}>
              <Ionicons name="call-outline" size={moderateScale(14)} color="#1C86FF" />
              <Text style={styles.callButtonText}>{ownerPhone}</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.dataRow, styles.dataRowLast]}>
            <Text style={styles.dataLabel}>Actions</Text>
            <TouchableOpacity
              onPress={handleChatCustomer}
              style={[styles.chatButton, loadingChat && styles.chatButtonDisabled]}
              disabled={loadingChat}
            >
              {loadingChat ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="chatbubble-outline" size={moderateScale(14)} color="#fff" />
                  <Text style={styles.chatButtonText}>Chat with Customer</Text>
                </>
              )}
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
            {bookingData.editRequest?.approvalStatus === 'approved' && bookingData.editRequest?.appointmentDateTime && (
              <View style={styles.rescheduledBadge}>
                <Ionicons name="sync-outline" size={moderateScale(14)} color="#4CAF50" />
                <Text style={styles.rescheduledBadgeText}>Rescheduled</Text>
              </View>
            )}
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

          {bookingData.editRequest?.approvalStatus === 'approved' && bookingData.editRequest?.appointmentDateTime && (
            <View style={styles.rescheduledInfoBox}>
              <View style={styles.rescheduledInfoHeader}>
                <Ionicons name="information-circle" size={moderateScale(18)} color="#4CAF50" />
                <Text style={styles.rescheduledInfoTitle}>Rescheduled Appointment</Text>
              </View>
              <Text style={styles.rescheduledInfoText}>
                This appointment was rescheduled on {formatDateTime(bookingData.editRequest.approvedAt)}
              </Text>
            </View>
          )}

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

            {proofRejectionReason && (
              <View style={styles.rejectionReasonBox}>
                <Text style={styles.rejectionReasonLabel}>Rejection Reason:</Text>
                <Text style={styles.rejectionReasonText}>{proofRejectionReason}</Text>
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
                      <Text style={styles.verifyButtonText}>Verify</Text>
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

        {/* 7. Mark as Paid Button for Cash Payments - Show in content when status is NOT completed */}
        {bookingData.paymentMethod?.toLowerCase() === 'cash' &&
         paymentStatus === 'pending' &&
         bookingData.status?.toLowerCase() !== 'completed' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="cash-outline" size={moderateScale(22)} color="#4CAF50" />
              <Text style={styles.sectionTitle}>Cash Payment</Text>
            </View>
            <View style={styles.cashPaymentInfo}>
              <Ionicons name="information-circle" size={moderateScale(20)} color="#FF9B79" />
              <Text style={styles.cashPaymentInfoText}>
                Please confirm that you have received the cash payment from the customer.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.markAsPaidButton, updating && styles.buttonDisabled]}
              onPress={handleMarkAsPaid}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#fff" />
                  <Text style={styles.markAsPaidButtonText}>Mark as Paid (Cash)</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* 7. Action Buttons */}
        </ScrollView>
      </View>

      {/* Sticky Action Buttons Footer */}
      {renderActionButtons() && (
        <View style={styles.stickyButtonFooter}>
          {renderActionButtons()}
        </View>
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
              <Text style={styles.modalSectionTitle}>
                Rejection Reason <Text style={{ color: '#FF6B6B' }}>*</Text>
              </Text>
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

      {/* Reject Edit Request Modal */}
      <Modal
        visible={rejectEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRejectEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Edit Request</Text>
              <TouchableOpacity onPress={() => {
                setRejectEditModal(false);
                setEditRejectionReason('');
              }}>
                <Ionicons name="close" size={moderateScale(28)} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalSectionTitle}>
                Rejection Reason <Text style={{ color: '#FF6B6B' }}>*</Text>
              </Text>
              <TextInput
                style={styles.rejectInput}
                value={editRejectionReason}
                onChangeText={setEditRejectionReason}
                placeholder="Please provide a reason for rejecting this edit request..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setRejectEditModal(false);
                    setEditRejectionReason('');
                  }}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalConfirmButton, { backgroundColor: '#FF6B6B' }]}
                  onPress={confirmRejectEdit}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.modalConfirmButtonText}>Reject Edit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        visible={confirmationModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleConfirmationCancel}
      >
        <View style={styles.confirmationOverlay}>
          <View style={styles.confirmationContent}>
            {/* Icon Container */}
            <View
              style={[
                styles.confirmationIconContainer,
                { backgroundColor: `${confirmationModal.confirmColor}20` }
              ]}
            >
              <Ionicons
                name={confirmationModal.action === 'mark-as-paid' ? 'cash' : 'checkmark-circle'}
                size={moderateScale(60)}
                color={confirmationModal.confirmColor}
              />
            </View>

            {/* Title and Message */}
            <Text
              style={[
                styles.confirmationTitle,
                { color: confirmationModal.confirmColor }
              ]}
            >
              {confirmationModal.title}
            </Text>
            <Text style={styles.confirmationMessage}>
              {confirmationModal.message}
            </Text>

            {/* Action Buttons */}
            <View style={styles.confirmationButtonContainer}>
              {/* Cancel Button */}
              <TouchableOpacity
                style={[
                  styles.confirmationCancelButton,
                  updating && styles.confirmationButtonDisabled
                ]}
                onPress={handleConfirmationCancel}
                disabled={updating}
              >
                <Ionicons
                  name="close-circle"
                  size={moderateScale(18)}
                  color="#FF6B6B"
                />
                <Text style={styles.confirmationCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              {/* Confirm Button */}
              <TouchableOpacity
                style={[
                  styles.confirmationConfirmButton,
                  { backgroundColor: confirmationModal.confirmColor },
                  updating && styles.confirmationButtonDisabled
                ]}
                onPress={handleConfirmationConfirm}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle"
                      size={moderateScale(18)}
                      color="#fff"
                    />
                    <Text style={styles.confirmationConfirmButtonText}>
                      {confirmationModal.confirmText}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={successModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSuccessModal(prev => ({ ...prev, visible: false }))}
      >
        <View style={styles.successOverlay}>
          <View style={styles.successContent}>
            {/* Icon Container */}
            <View
              style={[
                styles.successIconContainer,
                { backgroundColor: `${successModal.iconColor}20` }
              ]}
            >
              <Ionicons
                name={successModal.icon}
                size={moderateScale(64)}
                color={successModal.iconColor}
              />
            </View>

            {/* Title and Message */}
            <Text style={[styles.successTitle, { color: successModal.iconColor }]}>
              {successModal.title}
            </Text>
            <Text style={styles.successMessage}>
              {successModal.message}
            </Text>
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
  mainContent: {
    flex: 1,
    overflow: 'hidden',
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
    paddingBottom: moderateScale(20),
  },
  stickyButtonFooter: {
    backgroundColor: '#fff',
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(16),
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    minHeight: moderateScale(80),
    justifyContent: 'center',
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
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    backgroundColor: '#1C86FF',
    borderRadius: moderateScale(8),
    alignSelf: 'flex-end',
  },
  chatButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  chatButtonText: {
    fontSize: scaleFontSize(13),
    color: '#fff',
    fontWeight: '600',
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
  cashPaymentInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF4E6',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    marginBottom: moderateScale(16),
    gap: moderateScale(10),
    borderLeftWidth: moderateScale(4),
    borderLeftColor: '#FF9B79',
  },
  cashPaymentInfoText: {
    flex: 1,
    fontSize: scaleFontSize(14),
    color: '#666',
    lineHeight: scaleFontSize(20),
  },
  markAsPaidButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  markAsPaidButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: '700',
  },
  cashPaymentStickyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    borderRadius: moderateScale(10),
    padding: moderateScale(12),
    marginBottom: moderateScale(12),
    gap: moderateScale(10),
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  cashPaymentStickyInfoText: {
    flex: 1,
    fontSize: scaleFontSize(14),
    color: '#666',
    fontWeight: '500',
    lineHeight: scaleFontSize(18),
  },
  markAsPaidButtonSticky: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  markAsPaidButtonStickyText: {
    color: '#fff',
    fontSize: scaleFontSize(17),
    fontWeight: '700',
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
  actionButtonsContainer: {
    gap: moderateScale(12),
    width: '100%',
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: moderateScale(12),
    width: '100%',
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
  // Rescheduled Styles
  rescheduledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
    gap: moderateScale(4),
    marginLeft: 'auto',
  },
  rescheduledBadgeText: {
    fontSize: scaleFontSize(12),
    fontWeight: '600',
    color: '#4CAF50',
  },
  rescheduledInfoBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    marginVertical: moderateScale(12),
    borderLeftWidth: moderateScale(4),
    borderLeftColor: '#4CAF50',
  },
  rescheduledInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    marginBottom: moderateScale(6),
  },
  rescheduledInfoTitle: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#4CAF50',
  },
  rescheduledInfoText: {
    fontSize: scaleFontSize(13),
    color: '#2E7D32',
    lineHeight: scaleFontSize(18),
    marginLeft: moderateScale(24),
  },
  // Pending Edit Notice Styles
  pendingEditNoticeContainer: {
    marginBottom: moderateScale(20),
  },
  pendingEditNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF4E6',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    gap: moderateScale(12),
    borderWidth: 2,
    borderColor: '#FF9B79',
  },
  pendingEditNoticeContent: {
    flex: 1,
  },
  pendingEditNoticeTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: '700',
    color: '#FF9B79',
    marginBottom: moderateScale(6),
  },
  pendingEditNoticeText: {
    fontSize: scaleFontSize(14),
    color: '#666',
    lineHeight: scaleFontSize(20),
  },
  // Edit Request Styles
  editRequestPendingBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF4E6',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    marginBottom: moderateScale(16),
    gap: moderateScale(10),
    borderLeftWidth: moderateScale(4),
    borderLeftColor: '#FF9B79',
  },
  editRequestPendingText: {
    flex: 1,
    fontSize: scaleFontSize(14),
    color: '#666',
    lineHeight: scaleFontSize(20),
  },
  editRejectionBox: {
    backgroundColor: '#FFF3F3',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    marginTop: moderateScale(12),
    borderWidth: 1,
    borderColor: '#FFD6D6',
  },
  editRejectionLabel: {
    fontSize: scaleFontSize(13),
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: moderateScale(6),
  },
  editRejectionText: {
    fontSize: scaleFontSize(14),
    color: '#666',
    lineHeight: scaleFontSize(20),
  },
  editRequestActions: {
    flexDirection: 'row',
    gap: moderateScale(12),
    marginTop: moderateScale(16),
    paddingTop: moderateScale(16),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  approveEditButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(6),
  },
  approveEditButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(14),
    fontWeight: '600',
  },
  rejectEditButton: {
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
  rejectEditButtonText: {
    color: '#FF6B6B',
    fontSize: scaleFontSize(14),
    fontWeight: '600',
  },
  // Confirmation Modal Styles
  confirmationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(5),
  },
  confirmationContent: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(24),
    padding: moderateScale(32),
    width: '90%',
    maxWidth: wp(90),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  confirmationIconContainer: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2.5),
  },
  confirmationTitle: {
    fontSize: scaleFontSize(24),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: hp(1.5),
    letterSpacing: 0.4,
  },
  confirmationMessage: {
    fontSize: scaleFontSize(15),
    color: '#666',
    textAlign: 'center',
    marginBottom: hp(3),
    lineHeight: scaleFontSize(22),
    paddingHorizontal: moderateScale(8),
  },
  confirmationButtonContainer: {
    flexDirection: 'row',
    gap: moderateScale(12),
    width: '100%',
  },
  confirmationCancelButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: hp(1.6),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(6),
    borderWidth: 2,
    borderColor: '#FF6B6B',
    backgroundColor: '#fff',
  },
  confirmationCancelButtonText: {
    color: '#FF6B6B',
    fontSize: scaleFontSize(14),
    fontWeight: '600',
  },
  confirmationConfirmButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: hp(1.6),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(6),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmationConfirmButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(14),
    fontWeight: '600',
  },
  confirmationButtonDisabled: {
    opacity: 0.6,
  },
  // Success Modal Styles
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(5),
  },
  successContent: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(28),
    padding: moderateScale(40),
    width: '85%',
    maxWidth: wp(85),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 15,
  },
  successIconContainer: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  successTitle: {
    fontSize: scaleFontSize(26),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: hp(1),
    letterSpacing: 0.3,
  },
  successMessage: {
    fontSize: scaleFontSize(15),
    color: '#666',
    textAlign: 'center',
    marginBottom: hp(2.5),
    lineHeight: scaleFontSize(22),
    paddingHorizontal: moderateScale(8),
  },
  successIndicator: {
    marginTop: hp(1),
  },
  // Date Comparison Styles
  dateComparisonContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginVertical: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateComparisonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: moderateScale(12),
  },
  dateComparisonContent: {
    flex: 1,
  },
  dateComparisonLabel: {
    fontSize: scaleFontSize(12),
    fontWeight: '600',
    color: '#666',
    marginBottom: moderateScale(6),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateComparisonOriginalValue: {
    fontSize: scaleFontSize(14),
    color: '#999',
    textDecorationLine: 'line-through',
    fontStyle: 'italic',
  },
  dateComparisonNewValue: {
    fontSize: scaleFontSize(16),
    color: '#FF9B79',
    fontWeight: '700',
  },
  dateArrowContainer: {
    alignItems: 'center',
    paddingVertical: moderateScale(12),
  },
});

export default AppointmentDetail;
