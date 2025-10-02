import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ImageBackground,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from "@utils/responsive";

export default function BusinessDashboard() {
  const router = useRouter();
  const businessName = "Pawsome Pet Care";

  // Business services
  const businessServices = [
    {
      id: 1,
      name: "Veterinary Check-up",
      category: "Veterinary",
      price: "₱500",
      duration: "30 mins",
      icon: "medical",
      color: "#4CAF50",
      available: true,
    },
    {
      id: 2,
      name: "Pet Grooming",
      category: "Grooming",
      price: "₱800",
      duration: "1 hour",
      icon: "cut",
      color: "#2196F3",
      available: true,
    },
    {
      id: 3,
      name: "Pet Boarding",
      category: "Boarding",
      price: "₱1,200/day",
      duration: "Full day",
      icon: "home",
      color: "#FF9B79",
      available: true,
    },
    {
      id: 4,
      name: "Vaccination",
      category: "Veterinary",
      price: "₱300",
      duration: "15 mins",
      icon: "medical",
      color: "#4CAF50",
      available: false,
    },
  ];

  // Business metrics cards
  const businessMetrics = [
    {
      id: 1,
      title: "Total Bookings",
      value: "245",
      icon: "calendar",
      color: "#4CAF50",
      route: "../booking",
    },
    {
      id: 2,
      title: "Revenue",
      value: "₱45.2K",
      icon: "cash",
      color: "#2196F3",
      route: "../profile/revenue",
    },
    {
      id: 3,
      title: "Pending",
      value: "12",
      icon: "time",
      color: "#FF9B79",
    },
    {
      id: 4,
      title: "Reviews",
      value: "4.8⭐",
      icon: "star",
      color: "#FFD700",
    },
  ];

  // Today's appointments / Recent bookings
  const todaysAppointments = [
    {
      id: 1,
      customerName: "John Doe",
      petName: "Max",
      service: "Veterinary Check-up",
      time: "10:00 AM",
      status: "confirmed",
      icon: "medical",
    },
    {
      id: 2,
      customerName: "Jane Smith",
      petName: "Luna",
      service: "Grooming",
      time: "2:30 PM",
      status: "pending",
      icon: "cut",
    },
    {
      id: 3,
      customerName: "Mike Johnson",
      petName: "Buddy",
      service: "Pet Boarding",
      time: "4:00 PM",
      status: "confirmed",
      icon: "home",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return '#4CAF50';
      case 'pending':
        return '#FF9B79';
      case 'cancelled':
        return '#FF6B6B';
      default:
        return '#999';
    }
  };

  const renderCustomTitle = () => (
    <View style={styles.headerContent}>
      {/* Left Side */}
      <View style={styles.headerLeftContent}>
        <TouchableOpacity style={styles.profileImageContainer}>
          <View style={styles.profilePlaceholder}>
            <Ionicons name="storefront" size={moderateScale(24)} color="#1C86FF" />
          </View>
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.welcomeText}>Welcome Back!</Text>
          <Text style={styles.businessNameHeader}>{businessName}</Text>
        </View>
      </View>

      {/* Right Side - Notifications */}
      <TouchableOpacity
        style={styles.notificationButton}
        onPress={() => router.push("/(bsn)/(tabs)/profile/notifications")}
      >
        <Ionicons
          name="notifications-outline"
          size={moderateScale(26)}
          color="#fff"
        />
      </TouchableOpacity>
    </View>
  );

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
        customTitle={renderCustomTitle()}
        showBack={false}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.mainContent}>

          {/* Business Metrics Grid */}
          <View style={styles.metricsGrid}>
            {businessMetrics.map((metric) => (
              <TouchableOpacity
                key={metric.id}
                style={styles.metricCard}
                onPress={() => metric.route && router.push(metric.route)}
              >
                <View style={[styles.metricIconContainer, { backgroundColor: metric.color }]}>
                  <Ionicons name={metric.icon} size={moderateScale(24)} color="#fff" />
                </View>
                <Text style={styles.metricValue}>{metric.value}</Text>
                <Text style={styles.metricTitle}>{metric.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Today's Schedule Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Appointments</Text>
            <TouchableOpacity onPress={() => router.push("../booking")}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Appointments List */}
          <View style={styles.appointmentsList}>
            {todaysAppointments.map((appointment) => (
              <TouchableOpacity
                key={appointment.id}
                style={styles.appointmentCard}
                onPress={() => router.push("../booking")}
              >
                <View style={styles.appointmentIconContainer}>
                  <Ionicons
                    name={appointment.icon}
                    size={moderateScale(28)}
                    color="#1C86FF"
                  />
                </View>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.appointmentCustomer}>{appointment.customerName}</Text>
                  <Text style={styles.appointmentService}>
                    {appointment.service} • {appointment.petName}
                  </Text>
                  <Text style={styles.appointmentTime}>⏰ {appointment.time}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(appointment.status) }
                ]}>
                  <Text style={styles.statusText}>
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* My Services Section */}
          <View style={styles.servicesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Services</Text>
              <TouchableOpacity onPress={() => router.push("../my-services")}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {businessServices.slice(0, 3).map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                onPress={() => router.push("../my-services")}
              >
                <View style={[styles.serviceIconContainer, { backgroundColor: service.color }]}>
                  <Ionicons name={service.icon} size={moderateScale(28)} color="#fff" />
                </View>

                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceCategory}>{service.category}</Text>
                  <View style={styles.serviceDetails}>
                    <Text style={styles.servicePrice}>{service.price}</Text>
                    <Text style={styles.serviceDuration}> • {service.duration}</Text>
                  </View>
                </View>

                <View style={[
                  styles.availabilityBadge,
                  service.available ? styles.availableBadge : styles.unavailableBadge
                ]}>
                  <Text style={styles.availabilityText}>
                    {service.available ? 'Available' : 'Unavailable'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  backgroundimg: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.5 }],
  },
  backgroundImageStyle: {
    opacity: 0.05,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },
  headerLeftContent: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: moderateScale(16),
  },
  profileImageContainer: {
    marginRight: moderateScale(12),
  },
  profilePlaceholder: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextContainer: {
    justifyContent: "center",
  },
  notificationButton: {
    padding: moderateScale(8),
  },
  welcomeText: {
    fontSize: scaleFontSize(12),
    color: "#fff",
    fontFamily: "SFProReg",
  },
  businessNameHeader: {
    fontSize: scaleFontSize(16),
    fontWeight: "bold",
    color: "#fff",
    fontFamily: "SFProBold",
  },
  mainContent: {
    paddingHorizontal: wp(5),
    paddingTop: moderateScale(20),
    paddingBottom: moderateScale(30),
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: moderateScale(30),
    gap: moderateScale(12),
  },
  metricCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricIconContainer: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: moderateScale(10),
  },
  metricValue: {
    fontSize: scaleFontSize(24),
    fontWeight: "bold",
    color: "#333",
    marginBottom: moderateScale(4),
  },
  metricTitle: {
    fontSize: scaleFontSize(12),
    color: "#666",
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(15),
  },
  sectionTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: "bold",
    color: "#1C86FF",
    marginBottom: moderateScale(15),
  },
  viewAllText: {
    fontSize: scaleFontSize(14),
    color: "#1C86FF",
    fontWeight: "600",
  },
  appointmentsList: {
    marginBottom: moderateScale(30),
  },
  appointmentCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    marginBottom: moderateScale(12),
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  appointmentIconContainer: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(12),
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentCustomer: {
    fontSize: scaleFontSize(15),
    fontWeight: "bold",
    color: "#333",
    marginBottom: moderateScale(4),
  },
  appointmentService: {
    fontSize: scaleFontSize(13),
    color: "#666",
    marginBottom: moderateScale(4),
  },
  appointmentTime: {
    fontSize: scaleFontSize(12),
    color: "#999",
  },
  statusBadge: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(12),
  },
  statusText: {
    fontSize: scaleFontSize(11),
    color: "#fff",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  servicesSection: {
    width: "100%",
  },
  serviceCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    marginBottom: moderateScale(12),
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  serviceIconContainer: {
    width: moderateScale(55),
    height: moderateScale(55),
    borderRadius: moderateScale(28),
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(12),
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: scaleFontSize(16),
    fontWeight: "bold",
    color: "#333",
    marginBottom: moderateScale(4),
  },
  serviceCategory: {
    fontSize: scaleFontSize(13),
    color: "#666",
    marginBottom: moderateScale(4),
  },
  serviceDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  servicePrice: {
    fontSize: scaleFontSize(14),
    fontWeight: "600",
    color: "#1C86FF",
  },
  serviceDuration: {
    fontSize: scaleFontSize(12),
    color: "#999",
  },
  availabilityBadge: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(12),
  },
  availableBadge: {
    backgroundColor: "#4CAF50",
  },
  unavailableBadge: {
    backgroundColor: "#FF6B6B",
  },
  availabilityText: {
    fontSize: scaleFontSize(11),
    color: "#fff",
    fontWeight: "600",
  },
});
