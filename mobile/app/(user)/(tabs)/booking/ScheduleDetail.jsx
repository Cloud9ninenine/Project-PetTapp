import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import Header from "@components/Header";

const ScheduleDetail = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id, title, date, time, type, status } = params;

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText} numberOfLines={1}>
        Schedule Summary
      </Text>
    </View>
  );

  const scheduleDetail = {
    id: id || "100001",
    title: title || "Pet Boarding",
    clinic: "PetCo Clinic",
    service: type || "Pet Boarding",
    status: status || "scheduled",
    bookingId: id || "100001",
    bookingTime: date ? `${date} ${time}` : "mm-dd-yyyy hh-mm",
    paymentTime: "09-25-2025 03-43",
    completedTime: "09-26-2025 04-36",
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "scheduled":
        return { label: "Scheduled", backgroundColor: "#4CAF50" };
      case "cancelled":
        return { label: "Cancelled", backgroundColor: "#FF6B6B" };
      case "completed":
        return { label: "Completed", backgroundColor: "#2196F3" };
      default:
        return { label: "Unknown", backgroundColor: "#9E9E9E" };
    }
  };

  const statusConfig = getStatusConfig(scheduleDetail.status.toLowerCase());

  const copyBookingId = () => {
    Alert.alert("Copied", "Booking ID copied to clipboard");
  };

  const handleChat = () => {
    Alert.alert("Chat", "Opening chat with clinic...");
  };

  const handleCancel = () => {
    Alert.alert("Cancel Booking", "Are you sure?", [
      { text: "No", style: "cancel" },
      { text: "Yes", style: "destructive", onPress: () => console.log("Booking cancelled") },
    ]);
  };

  const handleRate = () => {
    Alert.alert("Rate Service", "Opening rating screen...");
  };

  const renderActionButtons = () => {
    const status = scheduleDetail.status.toLowerCase();

    if (status === "completed") {
      return (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.fullButton} onPress={handleChat}>
            <Text style={styles.fullButtonText}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fullButtonOutline} onPress={handleRate}>
            <Text style={styles.fullButtonOutlineText}>Rate</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (status === "scheduled") {
      return (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.fullButton} onPress={handleChat}>
            <Text style={styles.fullButtonText}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fullButtonOutline} onPress={handleCancel}>
            <Text style={styles.fullButtonOutlineText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Cancelled = only Chat
    return (
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity style={styles.fullButton} onPress={handleChat}>
          <Text style={styles.fullButtonText}>Chat</Text>
        </TouchableOpacity>
      </View>
    );
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
            <Ionicons name="business-outline" size={36} color="#C7C7CC" />
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
  },
  titleText: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'SFProBold',
    textAlign: 'center',
  },
  content: { padding: 20 },
  statusBar: {
    width: "100%",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  statusBarText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  clinicSection: { alignItems: "center", marginBottom: 20 },
  clinicLogo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  clinicName: { fontSize: 18, fontWeight: "bold", color: "#333" },
  serviceName: { fontSize: 14, color: "#666" },
  detailsBox: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 10,
    marginBottom: 30,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  detailLabel: { fontSize: 15, fontWeight: "500", color: "#333" },
  detailValue: { fontSize: 15, color: "#555" },
  bookingIdContainer: { flexDirection: "row", alignItems: "center" },
  copyButton: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  copyButtonText: { color: "#2196F3", fontSize: 12, fontWeight: "600" },
  actionButtonsContainer: { gap: 12 },
  fullButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  fullButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  fullButtonOutline: {
    backgroundColor: "#2196F3",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  fullButtonOutlineText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

export default ScheduleDetail;
