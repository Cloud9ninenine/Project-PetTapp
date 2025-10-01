import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ImageBackground,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import Header from "@components/Header";
import { hp, wp, moderateScale, scaleFontSize } from '@utils/responsive';

const AppointmentDetail = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

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

  const handleChat = () => {
    router.push({
      pathname: `/(bsn)/(tabs)/messages/${appointmentDetail.id}`,
      params: {
        customerName: appointmentDetail.customerName,
        fromAppointment: 'true',
      }
    });
  };

  const handleAccept = () => {
    Alert.alert("Accept Appointment", "Confirm this appointment?", [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: () => Alert.alert("Success", "Appointment confirmed!") },
    ]);
  };

  const handleReschedule = () => {
    Alert.alert("Reschedule", "Reschedule appointment functionality");
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
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.sideBySideButton} onPress={handleChat}>
            <Ionicons name="chatbubble-outline" size={moderateScale(20)} color="#fff" />
            <Text style={styles.sideBySideButtonText}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sideBySideButtonOutline} onPress={() => Alert.alert("View Review", "Customer review")}>
            <Ionicons name="star-outline" size={moderateScale(20)} color="#ff9b79" />
            <Text style={[styles.sideBySideButtonOutlineText, { color: "#ff9b79" }]}>Review</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (status === "scheduled") {
      return (
        <>
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.sideBySideButton} onPress={handleChat}>
              <Ionicons name="chatbubble-outline" size={moderateScale(20)} color="#fff" />
              <Text style={styles.sideBySideButtonText}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sideBySideButtonOutline} onPress={handleReschedule}>
              <Ionicons name="calendar-outline" size={moderateScale(20)} color="#1C86FF" />
              <Text style={styles.sideBySideButtonOutlineText}>Reschedule</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
            <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#fff" />
            <Text style={styles.completeButtonText}>Mark as Complete</Text>
          </TouchableOpacity>
        </>
      );
    }

    // Cancelled = only Chat
    return (
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity style={styles.fullButton} onPress={handleChat}>
          <Ionicons name="chatbubble-outline" size={moderateScale(20)} color="#fff" />
          <Text style={styles.fullButtonText}>Chat with Customer</Text>
        </TouchableOpacity>
      </View>
    );
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
});

export default AppointmentDetail;
