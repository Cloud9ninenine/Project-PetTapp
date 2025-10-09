import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import Header from "@components/Header";
import { hp, wp, moderateScale, scaleFontSize } from '@utils/responsive';

const ScheduleDetail = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText} numberOfLines={1}>
        Schedule Summary
      </Text>
    </View>
  );

  const formatDateTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return "Not specified";
    // Parse the date string (format: 10-08-2025)
    const [month, day, year] = dateStr.split('-');
    const dateObj = new Date(year, month - 1, day);

    const formattedDate = dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return `${formattedDate} • ${timeStr}`;
  };

  // Use dynamic data from params
  const scheduleDetail = {
    id: params.id || "100001",
    title: params.title || "Service Booking",
    clinic: params.businessName || "Pet Service",
    service: params.businessType || params.title || "Service",
    status: params.status || "scheduled",
    bookingId: params.id || "100001",
    icon: params.icon || "calendar-outline",
    bookingTime: formatDateTime(params.date, params.time),
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

  const statusConfig = getStatusConfig(scheduleDetail.status);

  const copyBookingId = () => {
    Alert.alert("Copied", "Booking ID copied to clipboard");
  };

  const handleCancel = () => {
    Alert.alert("Cancel Booking", "Are you sure?", [
      { text: "No", style: "cancel" },
      { text: "Yes", style: "destructive", onPress: () => console.log("Booking cancelled") },
    ]);
  };

  const handleRate = () => {
    router.push({
      pathname: '../booking/review-service',
      params: {
        clinic: scheduleDetail.clinic,
        service: scheduleDetail.service,
        bookingId: scheduleDetail.bookingId,
      },
    });
  };

  const renderActionButtons = () => {
    const status = scheduleDetail.status.toLowerCase();

    if (status === "completed") {
      return (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.fullButton} onPress={handleRate}>
            <Ionicons name="star-outline" size={moderateScale(20)} color="#fff" />
            <Text style={styles.fullButtonText}>Rate</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (status === "scheduled") {
      return (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.fullButton} onPress={handleCancel}>
            <Ionicons name="close-circle-outline" size={moderateScale(20)} color="#fff" />
            <Text style={styles.fullButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Cancelled = no buttons
    return null;
  };

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

        {/* Clinic Info */}
        <View style={styles.clinicSection}>
          <View style={styles.clinicLogo}>
            <Ionicons name={scheduleDetail.icon} size={hp(4.5)} color="#1C86FF" />
          </View>
          <Text style={styles.clinicName}>{scheduleDetail.clinic}</Text>
          <Text style={styles.serviceName}>{scheduleDetail.service}</Text>
        </View>

        {/* Booking Details */}
        <View style={styles.detailsBox}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booking ID</Text>
            <View style={styles.bookingIdContainer}>
              <Text style={styles.detailValue}>{scheduleDetail.bookingId}</Text>
              <TouchableOpacity style={styles.copyButton} onPress={copyBookingId}>
                <Text style={styles.copyButtonText}>Copy</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booking Time</Text>
            <Text style={styles.detailValue}>{scheduleDetail.bookingTime}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Time</Text>
            <Text style={styles.detailValue}>{scheduleDetail.paymentTime}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Completed Time</Text>
            <Text style={styles.detailValue}>{scheduleDetail.completedTime}</Text>
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
});

export default ScheduleDetail;
