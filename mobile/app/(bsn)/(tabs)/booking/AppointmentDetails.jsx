import React, { useState } from "react";
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
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from '@react-native-community/datetimepicker';
import Header from "@components/Header";
import { hp, wp, moderateScale, scaleFontSize } from '@utils/responsive';

const AppointmentDetail = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText} numberOfLines={1}>
        Appointment Details
      </Text>
    </View>
  );

  const formatDateTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return "Not specified";
    const [month, day, year] = dateStr.split('-');
    const dateObj = new Date(year, month - 1, day);

    const formattedDate = dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return `${formattedDate} • ${timeStr}`;
  };

  // Use dynamic data from params - Business perspective
  const appointmentDetail = {
    id: params.id || "100001",
    customerName: params.customerName || "Customer Name",
    petName: params.petName || "Pet Name",
    petType: params.petType || "Pet Type",
    service: params.service || "Service",
    status: params.status || "scheduled",
    bookingId: params.id || "100001",
    icon: params.icon || "calendar-outline",
    phone: params.phone || "+63 XXX XXX XXXX",
    appointmentTime: formatDateTime(params.date, params.time),
    paymentTime: "Sep 25, 2025 • 3:43 PM",
    completedTime: "Sep 26, 2025 • 4:36 PM",
  };

  const getStatusConfig = (status) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "scheduled":
        return { label: "Scheduled", backgroundColor: "#4CAF50" };
      case "cancelled":
        return { label: "Cancelled", backgroundColor: "#FF6B6B" };
      case "completed":
        return { label: "Completed", backgroundColor: "#2196F3" };
      default:
        return { label: status, backgroundColor: "#9E9E9E" };
    }
  };

  const statusConfig = getStatusConfig(appointmentDetail.status);

  const copyBookingId = () => {
    Alert.alert("Copied", "Booking ID copied to clipboard");
  };

  const handleAccept = () => {
    Alert.alert("Accept Appointment", "Confirm this appointment?", [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: () => Alert.alert("Success", "Appointment confirmed!") },
    ]);
  };

  const handleReschedule = () => {
    setRescheduleModal(true);
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
  };

  const handleComplete = () => {
    Alert.alert("Mark as Complete", "Mark this appointment as completed?", [
      { text: "No", style: "cancel" },
      { text: "Yes", onPress: () => Alert.alert("Success", "Appointment marked as completed!") },
    ]);
  };

  const renderActionButtons = () => {
    const status = appointmentDetail.status.toLowerCase();

    if (status === "completed") {
      return (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.fullButton} onPress={() => Alert.alert("View Review", "Customer review")}>
            <Ionicons name="star-outline" size={moderateScale(20)} color="#fff" />
            <Text style={styles.fullButtonText}>View Review</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (status === "scheduled") {
      return (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.fullButton} onPress={handleReschedule}>
            <Ionicons name="calendar-outline" size={moderateScale(20)} color="#fff" />
            <Text style={styles.fullButtonText}>Reschedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
            <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#fff" />
            <Text style={styles.completeButtonText}>Mark as Complete</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Cancelled = no buttons
    return null;
  };

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
            <Ionicons name="person" size={hp(4.5)} color="#1C86FF" />
          </View>
          <Text style={styles.customerName}>{appointmentDetail.customerName}</Text>
          <Text style={styles.petInfo}>{appointmentDetail.petName} • {appointmentDetail.petType}</Text>
          <TouchableOpacity style={styles.phoneButton}>
            <Ionicons name="call-outline" size={moderateScale(16)} color="#1C86FF" />
            <Text style={styles.phoneText}>{appointmentDetail.phone}</Text>
          </TouchableOpacity>
        </View>

        {/* Appointment Details */}
        <View style={styles.detailsBox}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booking ID</Text>
            <View style={styles.bookingIdContainer}>
              <Text style={styles.detailValue}>{appointmentDetail.bookingId}</Text>
              <TouchableOpacity style={styles.copyButton} onPress={copyBookingId}>
                <Text style={styles.copyButtonText}>Copy</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service</Text>
            <Text style={styles.detailValue}>{appointmentDetail.service}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Appointment Time</Text>
            <Text style={styles.detailValue}>{appointmentDetail.appointmentTime}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Time</Text>
            <Text style={styles.detailValue}>{appointmentDetail.paymentTime}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Completed Time</Text>
            <Text style={styles.detailValue}>{appointmentDetail.completedTime}</Text>
          </View>
        </View>

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
  customerSection: { alignItems: "center", marginBottom: moderateScale(20) },
  customerLogo: {
    width: hp(9),
    height: hp(9),
    borderRadius: hp(4.5),
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: moderateScale(10),
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
  detailLabel: { fontSize: scaleFontSize(15), fontWeight: "500", color: "#333" },
  detailValue: { fontSize: scaleFontSize(15), color: "#555" },
  bookingIdContainer: { flexDirection: "row", alignItems: "center" },
  copyButton: {
    marginLeft: moderateScale(10),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  copyButtonText: { color: "#2196F3", fontSize: scaleFontSize(12), fontWeight: "600" },
  actionButtonsContainer: { gap: moderateScale(12) },
  actionButtonsRow: {
    flexDirection: "row",
    gap: moderateScale(12),
    marginBottom: moderateScale(12),
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
});

export default AppointmentDetail;
