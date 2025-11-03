import React, { useState, useEffect, useRef } from "react";
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
  Animated,
  Dimensions,
  PanResponder,
  Image,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'react-native-calendars';
import Header from "@components/Header";
import { hp, wp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from "@config/api";

const { height: screenHeight } = Dimensions.get('window');

const ScheduleDetail = () => {
  const router = useRouter();
  const navigation = useNavigation();
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
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);

  // Animation and scroll tracking for edit modal
  const [editSlideAnim] = useState(new Animated.Value(screenHeight));
  const editScrollViewRef = useRef(null);
  const [isEditScrollAtTop, setIsEditScrollAtTop] = useState(true);

  // Hide tab bar on this screen
  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: { display: 'none' }
    });
  }, [navigation]);

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
        year: 'numeric'
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

  // Animation effect for edit modal
  useEffect(() => {
    if (showEditModal) {
      Animated.spring(editSlideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(editSlideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showEditModal]);

  // PanResponder for swipe-down-to-dismiss edit modal
  const editPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > 2;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        return gestureState.dy > 2;
      },
      onPanResponderGrant: () => {
        editSlideAnim.stopAnimation();
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy > 0) {
          editSlideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const threshold = 150;
        const velocity = gestureState.vy;

        if (gestureState.dy > threshold || velocity > 0.5) {
          Animated.timing(editSlideAnim, {
            toValue: screenHeight,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setShowEditModal(false);
          });
        } else {
          Animated.spring(editSlideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(editSlideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      },
    })
  ).current;

  // Handle scroll events for edit modal
  const handleEditScroll = (event) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    setIsEditScrollAtTop(scrollY <= 0);
  };

  // Payment methods
  const paymentMethods = [
    {
      value: 'cash',
      label: 'Cash',
      icon: 'cash-outline',
      description: 'Pay in cash when you receive the service'
    },
    {
      value: 'qr-payment',
      label: 'QR Payment',
      icon: 'qr-code-outline',
      description: 'Pay via GCash, PayMaya, or Bank Transfer'
    },
  ];

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

  const onDateChange = (day) => {
    if (day) {
      const newDate = new Date(day.dateString);
      const currentDateTime = editFormData.appointmentDateTime || new Date();
      newDate.setHours(currentDateTime.getHours());
      newDate.setMinutes(currentDateTime.getMinutes());
      setEditFormData({ ...editFormData, appointmentDateTime: newDate });
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
      // For cash payment, show edit and cancel buttons
      if (paymentMethod === "cash") {
        return (
          <View style={styles.actionButtonsContainer}>
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity style={styles.sideBySideButton} onPress={handleEditPress}>
                <Ionicons name="create-outline" size={moderateScale(20)} color="#fff" />
                <Text style={styles.sideBySideButtonText}>Reschedule</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.sideBySideButton, { backgroundColor: '#FF6B6B' }]} onPress={handleCancelPress}>
                <Ionicons name="close-circle-outline" size={moderateScale(20)} color="#fff" />
                <Text style={styles.sideBySideButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }

      // For other payment methods, show QR, edit, and cancel buttons
      return (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.fullButton} onPress={handleViewQR}>
            <Ionicons name="qr-code" size={moderateScale(20)} color="#fff" />
            <Text style={styles.fullButtonText}>View QR</Text>
          </TouchableOpacity>
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.sideBySideButton} onPress={handleEditPress}>
              <Ionicons name="create-outline" size={moderateScale(20)} color="#fff" />
              <Text style={styles.sideBySideButtonText}>Reschedule</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sideBySideButton, { backgroundColor: '#FF6B6B' }]} onPress={handleCancelPress}>
              <Ionicons name="close-circle-outline" size={moderateScale(20)} color="#fff" />
              <Text style={styles.sideBySideButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
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
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.sideBySideButton} onPress={handleEditPress}>
              <Ionicons name="create-outline" size={moderateScale(20)} color="#fff" />
              <Text style={styles.sideBySideButtonText}>Reschedule</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sideBySideButton, { backgroundColor: '#FF6B6B' }]} onPress={handleCancelPress}>
              <Ionicons name="close-circle-outline" size={moderateScale(20)} color="#fff" />
              <Text style={styles.sideBySideButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Show edit and cancel buttons for pending/confirmed bookings with proof uploaded or paid
    if ((status === "pending" || status === "confirmed") && (paymentStatus === "proof-uploaded" || paymentStatus === "paid")) {
      return (
        <View style={styles.actionButtonsContainer}>
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.sideBySideButton} onPress={handleEditPress}>
              <Ionicons name="create-outline" size={moderateScale(20)} color="#fff" />
              <Text style={styles.sideBySideButtonText}>Reschedule</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sideBySideButton, { backgroundColor: '#FF6B6B' }]} onPress={handleCancelPress}>
              <Ionicons name="close-circle-outline" size={moderateScale(20)} color="#fff" />
              <Text style={styles.sideBySideButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
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
        {/* Business/Service Info */}
        <View style={styles.clinicSection}>
          {booking.serviceId?.image ? (
            <Image
              source={{ uri: booking.serviceId.image }}
              style={styles.serviceImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.clinicLogo}>
              <Ionicons name={getServiceIcon(booking.serviceId)} size={hp(4.5)} color="#1C86FF" />
            </View>
          )}
          <Text style={styles.clinicName}>{booking.businessId?.businessName || 'Business Name'}</Text>
          <Text style={styles.serviceName}>{booking.serviceId?.name || 'Service'}</Text>
        </View>

        {/* Rescheduled Alert - if approved */}
        {booking.editRequest?.approvalStatus === 'approved' && booking.editRequest?.appointmentDateTime && (
          <View style={styles.rescheduledAlertCard}>
            <Ionicons name="checkmark-circle" size={moderateScale(24)} color="#4CAF50" />
            <View style={styles.rescheduledAlertContent}>
              <Text style={styles.rescheduledAlertTitle}>Reschedule Approved</Text>
              <Text style={styles.rescheduledAlertText}>
                Your appointment has been successfully rescheduled to {formatDate(booking.appointmentDateTime)} at {formatTime(booking.appointmentDateTime)}
              </Text>
            </View>
          </View>
        )}

        {/* Cash Payment Info Card */}
        {booking.paymentMethod === 'cash' && booking.paymentStatus === 'pending' &&
         (booking.status === 'pending' || booking.status === 'confirmed') && (
          <View style={styles.cashPaymentInfoCard}>
            <Text style={styles.cashPaymentTitle}>Cash Payment</Text>

            <View style={styles.cashInstructionsBox}>
              <View style={styles.cashInstructionRow}>
                <Ionicons name="information-circle" size={moderateScale(20)} color="#1C86FF" />
                <Text style={styles.cashInstructionTitle}>Payment Instructions</Text>
              </View>

              <View style={styles.cashAmountBox}>
                <Text style={styles.cashAmountLabel}>Amount to Pay:</Text>
                <Text style={styles.cashAmountValue}>{formatPrice(booking.totalAmount)}</Text>
              </View>

              <View style={styles.cashInstructionItem}>
                <Ionicons name="checkmark-circle" size={moderateScale(16)} color="#4CAF50" />
                <Text style={styles.cashInstructionItemText}>Bring exact amount or sufficient cash</Text>
              </View>

              <View style={styles.cashInstructionItem}>
                <Ionicons name="checkmark-circle" size={moderateScale(16)} color="#4CAF50" />
                <Text style={styles.cashInstructionItemText}>Payment will be made at business location</Text>
              </View>

              <View style={styles.cashInstructionItem}>
                <Ionicons name="checkmark-circle" size={moderateScale(16)} color="#4CAF50" />
                <Text style={styles.cashInstructionItemText}>Present your booking details when you arrive</Text>
              </View>
            </View>

            <View style={styles.cashReminderBox}>
              <Ionicons name="time-outline" size={moderateScale(20)} color="#FF9B79" />
              <Text style={styles.cashReminderText}>
                Please arrive on time. Late arrivals may result in service delays or cancellation.
              </Text>
            </View>
          </View>
        )}

        {/* Booking Details */}
        <View style={styles.detailsBox}>
          <Text style={styles.sectionTitle}>Booking Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={[styles.detailValue, { color: statusConfig.backgroundColor }]}>
              {statusConfig.label}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pet</Text>
            <Text style={styles.detailValue}>
              {booking.petId?.name || 'Pet'}
              {booking.petId?.species && ` (${booking.petId.species})`}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>
              {formatDate(booking.appointmentDateTime)} {formatTime(booking.appointmentDateTime)}
            </Text>
          </View>

          {booking.duration && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>{booking.duration} minutes</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service Type</Text>
            <Text style={styles.detailValue}>{booking.serviceId?.name || 'Service'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>
              {booking.businessId?.businessName || 'Business Name'}
              {booking.businessId?.address?.city && `, ${booking.businessId.address.city}`}
            </Text>
          </View>

          {booking.businessId?.contact && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Contact</Text>
              <Text style={styles.detailValue}>{booking.businessId.contact}</Text>
            </View>
          )}

          {booking.businessId?.email && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{booking.businessId.email}</Text>
            </View>
          )}
        </View>

        {/* Payment Information Section - Hide for cash payments */}
        {booking.paymentMethod !== 'cash' && (
          <View style={styles.paymentInfoSection}>
            <Text style={styles.sectionTitle}>Payment Information</Text>

          {/* Amount */}
          <View style={styles.paymentInfoRow}>
            <Text style={styles.paymentInfoLabel}>Amount:</Text>
            <Text style={styles.paymentInfoAmount}>{formatPrice(booking.totalAmount)}</Text>
          </View>

          {/* Payment Status */}
          <View style={styles.paymentInfoRow}>
            <Text style={styles.paymentInfoLabel}>Status:</Text>
            <View style={[
              styles.paymentStatusBadge,
              {
                backgroundColor:
                  booking.paymentStatus === 'paid' ? '#E8F5E9' :
                  booking.paymentStatus === 'proof-uploaded' ? '#E3F2FD' :
                  booking.paymentStatus === 'failed' ? '#FFEBEE' :
                  booking.paymentStatus === 'refunded' ? '#F5F5F5' : '#FFF4E6'
              }
            ]}>
              <Text style={[
                styles.paymentStatusText,
                {
                  color:
                    booking.paymentStatus === 'paid' ? '#4CAF50' :
                    booking.paymentStatus === 'proof-uploaded' ? '#1C86FF' :
                    booking.paymentStatus === 'failed' ? '#FF6B6B' :
                    booking.paymentStatus === 'refunded' ? '#9E9E9E' : '#FF9B79'
                }
              ]}>
                {booking.paymentStatus === 'proof-uploaded' ? 'PROOF UPLOADED' :
                 booking.paymentStatus === 'pending' ? 'PENDING PAYMENT' :
                 booking.paymentStatus?.toUpperCase() || 'PENDING'}
              </Text>
            </View>
          </View>

          {/* Payment Method */}
          {booking.paymentMethod && (
            <View style={styles.paymentMethodRow}>
              <Text style={styles.paymentInfoLabel}>Method:</Text>
              <View style={styles.paymentMethodInfo}>
                <Text style={styles.paymentMethodText}>{formatPaymentMethod(booking.paymentMethod)}</Text>
              </View>
            </View>
          )}

          {/* Payment Method Subtext */}
          {booking.paymentMethod === 'cash' && booking.paymentStatus === 'pending' && (
            <Text style={styles.paymentMethodSubtext}>Pay in cash when you receive the service</Text>
          )}
          </View>
        )}

        {/* Conditional sections - only show if they have content */}
        {(booking.paymentProof || booking.paymentRejectionReason || booking.notes ||
          booking.specialRequests || booking.cancellationReason || booking.editRequest || booking.rating) && (
          <View style={styles.detailsBox}>
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
          </View>
        )}

        {/* Booked On Section */}
        <View style={styles.bookedOnSection}>
          <View style={styles.bookedOnRow}>
            <Text style={styles.bookedOnLabel}>Booked On:</Text>
            <Text style={styles.bookedOnValue}>{formatDateTime(booking.createdAt)}</Text>
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

      {/* Edit Booking Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.editModalOverlay}>
          <TouchableOpacity
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={() => setShowEditModal(false)}
          />

          <Animated.View
            style={[
              styles.editModalContainer,
              {
                transform: [{ translateY: editSlideAnim }]
              }
            ]}
          >
            {/* Swipeable Header Area */}
            <View style={styles.swipeableHeader} {...editPanResponder.panHandlers}>
              <View style={styles.handleBar} />
              <Text style={styles.modalTitle}>Edit Booking</Text>
              <Text style={styles.modalSubtitle}>Request changes to your booking</Text>
            </View>

            <ScrollView
              ref={editScrollViewRef}
              style={styles.editFormScroll}
              showsVerticalScrollIndicator={false}
              onScroll={handleEditScroll}
              scrollEventThrottle={16}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Separator Line */}
              <View style={styles.separatorLine} />

              {/* Info Box */}
              <View style={styles.editInfoBox}>
                <Ionicons name="information-circle" size={moderateScale(20)} color="#1C86FF" />
                <Text style={styles.editInfoText}>
                  Your edit request will be sent to the business owner for approval. You'll be notified once they review your changes.
                </Text>
              </View>

              {/* Date Section */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Select Date</Text>
                <View style={styles.calendarWrapper}>
                  <Calendar
                    current={editFormData.appointmentDateTime ? editFormData.appointmentDateTime.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                    minDate={new Date().toISOString().split('T')[0]}
                    maxDate={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    onDayPress={onDateChange}
                    markedDates={{
                      [editFormData.appointmentDateTime ? editFormData.appointmentDateTime.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]]: {
                        selected: true,
                        selectedColor: '#1C86FF',
                        selectedTextColor: '#fff',
                      },
                    }}
                    theme={{
                      backgroundColor: '#ffffff',
                      calendarBackground: '#ffffff',
                      textSectionTitleColor: '#1C86FF',
                      selectedDayBackgroundColor: '#1C86FF',
                      selectedDayTextColor: '#ffffff',
                      todayTextColor: '#1C86FF',
                      dayTextColor: '#333333',
                      textDisabledColor: '#d9d9d9',
                      dotColor: '#1C86FF',
                      selectedDotColor: '#ffffff',
                      arrowColor: '#1C86FF',
                      monthTextColor: '#1C86FF',
                      textDayFontWeight: '400',
                      textMonthFontWeight: 'bold',
                      textDayHeaderFontWeight: '600',
                      textDayFontSize: scaleFontSize(14),
                      textMonthFontSize: scaleFontSize(16),
                      textDayHeaderFontSize: scaleFontSize(12),
                    }}
                    style={styles.calendar}
                  />
                </View>
              </View>

              {/* Time Section */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Time</Text>
                <TouchableOpacity
                  style={styles.inputField}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.inputText}>
                    {editFormData.appointmentDateTime
                      ? formatTime(editFormData.appointmentDateTime.toISOString())
                      : 'Select Time'}
                  </Text>
                  <Ionicons name="chevron-down" size={moderateScale(20)} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Payment Method Section */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Payment Method</Text>
                <TouchableOpacity
                  style={styles.pickerContainer}
                  onPress={() => setShowPaymentPicker(true)}
                >
                  <Ionicons name="wallet-outline" size={moderateScale(22)} color="#fff" style={styles.inputIcon} />
                  <Text style={styles.pickerText}>
                    {editFormData.paymentMethod ?
                      paymentMethods.find(m => m.value === editFormData.paymentMethod)?.label
                      : 'Choose payment method'}
                  </Text>
                  <Ionicons name="chevron-down" size={moderateScale(20)} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Notes Section */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  Notes (Optional) {editFormData.notes.length > 0 && `- ${editFormData.notes.length}/500`}
                </Text>
                <View style={styles.textAreaContainer}>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Additional notes (max 500 characters)"
                    placeholderTextColor="#999"
                    value={editFormData.notes}
                    onChangeText={(text) => setEditFormData({ ...editFormData, notes: text })}
                    multiline
                    maxLength={500}
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              {/* Special Requests Section */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  Special Requests (Optional) {editFormData.specialRequests.length > 0 && `- ${editFormData.specialRequests.length}/300`}
                </Text>
                <View style={styles.textAreaContainer}>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Special requests (max 300 characters)"
                    placeholderTextColor="#999"
                    value={editFormData.specialRequests}
                    onChangeText={(text) => setEditFormData({ ...editFormData, specialRequests: text })}
                    multiline
                    maxLength={300}
                    numberOfLines={2}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalButtonsContainer}>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonCancel}
                  onPress={() => setShowEditModal(false)}
                  disabled={isSubmittingEdit}
                >
                  <Text style={styles.modalButtonCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButtonConfirm, { backgroundColor: '#1C86FF' }, isSubmittingEdit && styles.modalButtonDisabled]}
                  onPress={handleSubmitEdit}
                  disabled={isSubmittingEdit}
                >
                  {isSubmittingEdit ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.modalButtonConfirmText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={editFormData.appointmentDateTime || new Date()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
        />
      )}

      {/* Payment Method Picker Modal */}
      <Modal
        visible={showPaymentPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaymentPicker(false)}
      >
        <View style={styles.selectionModalOverlay}>
          <View style={styles.selectionModalContainer}>
            <View style={styles.selectionModalHeader}>
              <Text style={styles.selectionModalTitle}>Payment Method</Text>
              <TouchableOpacity onPress={() => setShowPaymentPicker(false)}>
                <Ionicons name="close" size={moderateScale(24)} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.selectionModalScroll}>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.value}
                  style={[
                    styles.selectionModalItem,
                    editFormData.paymentMethod === method.value && styles.selectionModalItemSelected
                  ]}
                  onPress={() => {
                    setEditFormData({ ...editFormData, paymentMethod: method.value });
                    setShowPaymentPicker(false);
                  }}
                >
                  <View style={styles.selectionModalItemContent}>
                    <Ionicons
                      name={method.icon}
                      size={moderateScale(24)}
                      color={editFormData.paymentMethod === method.value ? '#1C86FF' : '#666'}
                    />
                    <View style={styles.selectionModalItemText}>
                      <Text style={[
                        styles.selectionModalItemLabel,
                        editFormData.paymentMethod === method.value && styles.selectionModalItemLabelSelected
                      ]}>
                        {method.label}
                      </Text>
                      <Text style={styles.selectionModalItemDescription}>
                        {method.description}
                      </Text>
                    </View>
                  </View>
                  {editFormData.paymentMethod === method.value && (
                    <Ionicons name="checkmark-circle" size={moderateScale(24)} color="#1C86FF" />
                  )}
                </TouchableOpacity>
              ))}
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
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: moderateScale(12),
    padding: moderateScale(18),
    marginTop: moderateScale(16),
    marginBottom: moderateScale(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: "700",
    color: "#2C3E50",
    marginBottom: moderateScale(16),
    paddingBottom: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  // Payment Information Section Styles
  paymentInfoSection: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    padding: moderateScale(18),
    marginBottom: moderateScale(16),
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  paymentInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(12),
  },
  paymentMethodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: moderateScale(8),
  },
  paymentInfoLabel: {
    fontSize: scaleFontSize(14),
    fontWeight: "600",
    color: "#666",
  },
  paymentInfoAmount: {
    fontSize: scaleFontSize(18),
    fontWeight: "700",
    color: "#2C3E50",
  },
  paymentStatusBadge: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(6),
  },
  paymentStatusText: {
    fontSize: scaleFontSize(12),
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  paymentMethodInfo: {
    alignItems: "flex-end",
  },
  paymentMethodText: {
    fontSize: scaleFontSize(14),
    fontWeight: "500",
    color: "#2C3E50",
    textTransform: "capitalize",
  },
  paymentMethodSubtext: {
    fontSize: scaleFontSize(12),
    color: "#666",
    fontStyle: "italic",
    marginTop: moderateScale(4),
    marginBottom: moderateScale(8),
    lineHeight: scaleFontSize(18),
    paddingLeft: moderateScale(4),
  },
  // Booked On Section Styles
  bookedOnSection: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    padding: moderateScale(18),
    marginBottom: moderateScale(16),
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bookedOnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bookedOnLabel: {
    fontSize: scaleFontSize(14),
    fontWeight: "600",
    color: "#666",
  },
  bookedOnValue: {
    fontSize: scaleFontSize(14),
    fontWeight: "500",
    color: "#2C3E50",
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
    color: "#1C86FF",
    marginBottom: moderateScale(8),
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: scaleFontSize(14),
    color: "#666",
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
    marginBottom: moderateScale(12),
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
    fontWeight: '700',
    color: '#1C86FF',
    marginLeft: moderateScale(8),
  },
  cashAmountBox: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(8),
    padding: moderateScale(14),
    marginVertical: moderateScale(12),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1C86FF',
  },
  cashAmountLabel: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#666',
  },
  cashAmountValue: {
    fontSize: scaleFontSize(20),
    fontWeight: '700',
    color: '#00B140',
  },
  cashInstructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: moderateScale(10),
    paddingLeft: moderateScale(4),
  },
  cashInstructionItemText: {
    fontSize: scaleFontSize(13),
    color: '#333',
    lineHeight: scaleFontSize(19),
    marginLeft: moderateScale(10),
    flex: 1,
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
  // Rescheduled alert card
  rescheduledAlertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginHorizontal: wp(5),
    marginTop: moderateScale(16),
    gap: moderateScale(12),
    borderWidth: 2,
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rescheduledAlertContent: {
    flex: 1,
  },
  rescheduledAlertTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: moderateScale(6),
  },
  rescheduledAlertText: {
    fontSize: scaleFontSize(13),
    color: '#666',
    lineHeight: scaleFontSize(19),
  },
  // Edit modal styles
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  editModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    paddingBottom: moderateScale(30),
    maxHeight: screenHeight * 0.95,
  },
  swipeableHeader: {
    paddingHorizontal: moderateScale(18),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(20),
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    minHeight: moderateScale(100),
  },
  handleBar: {
    width: moderateScale(40),
    height: moderateScale(4),
    backgroundColor: '#E0E0E0',
    borderRadius: moderateScale(2),
    alignSelf: 'center',
    marginBottom: moderateScale(15),
  },
  editFormScroll: {
    maxHeight: hp(55),
  },
  scrollContent: {
    paddingHorizontal: moderateScale(18),
    paddingTop: 0,
  },
  separatorLine: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: moderateScale(16),
  },
  modalButtonsContainer: {
    paddingHorizontal: moderateScale(18),
    paddingTop: moderateScale(10),
    backgroundColor: '#fff',
  },
  inputContainer: {
    marginBottom: moderateScale(16),
  },
  inputLabel: {
    fontSize: scaleFontSize(14),
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: moderateScale(10),
    letterSpacing: 0.3,
  },
  inputIcon: {
    marginRight: moderateScale(12),
    opacity: 0.95,
  },
  inputField: {
    backgroundColor: '#1C86FF',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(15),
    height: moderateScale(50),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    flex: 1,
    fontSize: scaleFontSize(16),
    color: '#fff',
  },
  pickerContainer: {
    backgroundColor: '#1C86FF',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(15),
    height: moderateScale(56),
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1C86FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  pickerText: {
    flex: 1,
    fontSize: scaleFontSize(15),
    color: '#fff',
    fontWeight: '500',
  },
  textAreaContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    padding: moderateScale(12),
    fontSize: scaleFontSize(14),
    color: '#333',
    minHeight: moderateScale(60),
    maxHeight: moderateScale(100),
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(10),
    marginBottom: moderateScale(8),
  },
  paymentMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#1C86FF',
    backgroundColor: '#fff',
  },
  paymentMethodButtonActive: {
    backgroundColor: '#1C86FF',
    borderColor: '#1C86FF',
  },
  paymentMethodButtonText: {
    fontSize: scaleFontSize(13),
    color: '#1C86FF',
    fontWeight: '600',
  },
  paymentMethodButtonTextActive: {
    color: '#fff',
  },
  editInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    gap: moderateScale(10),
    marginBottom: moderateScale(20),
  },
  editInfoText: {
    flex: 1,
    fontSize: scaleFontSize(13),
    color: '#1C86FF',
    lineHeight: scaleFontSize(18),
  },
  // Calendar Styles
  calendarWrapper: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    marginBottom: moderateScale(12),
  },
  calendar: {
    borderRadius: moderateScale(12),
  },
  // Selection Modal Styles
  selectionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  selectionModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    paddingBottom: moderateScale(30),
    maxHeight: screenHeight * 0.7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  selectionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(20),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectionModalTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: '700',
    color: '#2C3E50',
    letterSpacing: 0.3,
  },
  selectionModalScroll: {
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(12),
  },
  selectionModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(16),
    paddingHorizontal: moderateScale(16),
    marginVertical: moderateScale(6),
    borderRadius: moderateScale(12),
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  selectionModalItemSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#1C86FF',
    shadowColor: '#1C86FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  selectionModalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectionModalItemText: {
    marginLeft: moderateScale(14),
    flex: 1,
  },
  selectionModalItemLabel: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: moderateScale(4),
  },
  selectionModalItemLabelSelected: {
    color: '#1C86FF',
    fontWeight: '700',
  },
  selectionModalItemDescription: {
    fontSize: scaleFontSize(13),
    color: '#7F8C8D',
    lineHeight: scaleFontSize(18),
  },
  editRequestSection: {
    marginTop: moderateScale(12),
    padding: moderateScale(16),
    backgroundColor: '#F9F9F9',
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  editRequestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
    marginBottom: moderateScale(8),
  },
  editRequestTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: '700',
    color: '#333',
  },
  editRequestMessage: {
    fontSize: scaleFontSize(14),
    color: '#666',
    lineHeight: scaleFontSize(20),
    marginBottom: moderateScale(12),
  },
  editRequestRejectionBox: {
    backgroundColor: '#FFEBEE',
    borderRadius: moderateScale(6),
    padding: moderateScale(10),
    marginBottom: moderateScale(10),
  },
  editRequestRejectionLabel: {
    fontSize: scaleFontSize(13),
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: moderateScale(4),
  },
  editRequestRejectionText: {
    fontSize: scaleFontSize(13),
    color: '#333',
    lineHeight: scaleFontSize(18),
  },
  editRequestDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  editRequestDetailLabel: {
    fontSize: scaleFontSize(13),
    fontWeight: '600',
    color: '#666',
  },
  editRequestDetailValue: {
    fontSize: scaleFontSize(13),
    color: '#333',
    fontWeight: '500',
  },
  editRequestTimestamp: {
    fontSize: scaleFontSize(12),
    color: '#999',
    marginTop: moderateScale(8),
    fontStyle: 'italic',
  },
});

export default ScheduleDetail;
