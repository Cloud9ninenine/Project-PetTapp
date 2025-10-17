import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ImageBackground,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { wp, hp, moderateScale, scaleFontSize } from "@utils/responsive";
import apiClient from "@config/api";
import BusinessHeader from "@components/BusinessHeader";
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function BusinessDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [businessId, setBusinessId] = useState(null);
  const [businessName, setBusinessName] = useState("Business Dashboard");

  // State for API data
  const [dashboardData, setDashboardData] = useState({
    metrics: {
      todaysBookings: 0,
      monthlyBookings: 0,
      todaysRevenue: 0,
      monthlyRevenue: 0,
    },
    pendingBookings: [],
    todaysSchedule: [],
  });
  const [services, setServices] = useState([]);

  // Fetch business ID from AsyncStorage
  const fetchBusinessId = async () => {
    try {
      const storedBusinessId = await AsyncStorage.getItem('businessId');
      if (storedBusinessId) {
        setBusinessId(storedBusinessId);
        return storedBusinessId;
      } else {
        // Try to fetch from API
        const response = await apiClient.get('/businesses');
        if (response.data && response.data.data && response.data.data.length > 0) {
          const business = response.data.data[0];
          await AsyncStorage.setItem('businessId', business._id);
          setBusinessId(business._id);
          setBusinessName(business.businessName || "Business Dashboard");
          return business._id;
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching business ID:', error);
      return null;
    }
  };

  // Fetch dashboard data
  const fetchDashboardData = async (bId) => {
    try {
      const response = await apiClient.get('/dashboard', {
        params: { businessId: bId }
      });

      if (response.data && response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    }
  };

  // Fetch services
  const fetchServices = async (bId) => {
    try {
      const response = await apiClient.get(`/services/business/${bId}`, {
        params: { limit: 3, page: 1 }
      });

      if (response.data && response.data.success) {
        setServices(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      // Don't show alert for services error, just log it
    }
  };

  // Load all data
  const loadData = async () => {
    try {
      setLoading(true);
      const bId = await fetchBusinessId();

      if (bId) {
        await Promise.all([
          fetchDashboardData(bId),
          fetchServices(bId)
        ]);
      } else {
        Alert.alert(
          'Business Profile Required',
          'Please complete your business profile first.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Go to Profile',
              onPress: () => router.push('/(bsn)/(tabs)/profile')
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Load data on mount and when screen is focused
  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (businessId) {
        loadData();
      }
    }, [businessId])
  );

  // Helper functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return '#4CAF50';
      case 'pending':
        return '#FF9B79';
      case 'cancelled':
      case 'no-show':
        return '#FF6B6B';
      case 'in-progress':
        return '#2196F3';
      case 'completed':
        return '#4CAF50';
      default:
        return '#999';
    }
  };

  const formatCurrency = (amount) => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatTime = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} mins`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getCategoryIcon = (category) => {
    const iconMap = {
      veterinary: 'medical',
      grooming: 'cut',
      boarding: 'home',
      daycare: 'sunny',
      training: 'school',
      emergency: 'alert-circle',
      consultation: 'chatbubbles',
      other: 'ellipsis-horizontal'
    };
    return iconMap[category] || 'briefcase';
  };

  const getCategoryColor = (category) => {
    const colorMap = {
      veterinary: '#4CAF50',
      grooming: '#2196F3',
      boarding: '#FF9B79',
      daycare: '#FFD700',
      training: '#9C27B0',
      emergency: '#FF6B6B',
      consultation: '#00BCD4',
      other: '#999'
    };
    return colorMap[category] || '#1C86FF';
  };

  // Business metrics cards - From API
  const businessMetrics = [
    {
      id: 1,
      title: "Today's Bookings",
      value: dashboardData.metrics.todaysBookings.toString(),
      icon: "calendar",
      color: "#4CAF50",
      route: "../booking",
    },
    {
      id: 2,
      title: "Today's Revenue",
      value: formatCurrency(dashboardData.metrics.todaysRevenue),
      icon: "cash",
      color: "#2196F3",
      route: "../profile/revenue",
    },
    {
      id: 3,
      title: "Monthly Bookings",
      value: dashboardData.metrics.monthlyBookings.toString(),
      icon: "time",
      color: "#FF9B79",
    },
    {
      id: 4,
      title: "Monthly Revenue",
      value: formatCurrency(dashboardData.metrics.monthlyRevenue),
      icon: "trending-up",
      color: "#FFD700",
      route: "../profile/revenue",
    },
  ];

  const renderCustomTitle = () => (
    <View style={styles.headerContent}>
      <View style={styles.headerLeftContent}>
        <TouchableOpacity style={styles.profileImageContainer}>
          <View style={styles.profilePlaceholder}>
            <Ionicons name="storefront" size={moderateScale(24)} color="#1C86FF" />
          </View>
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.welcomeText}>Welcome Back!</Text>
          <Text style={styles.businessNameHeader} numberOfLines={1}>{businessName}</Text>
        </View>
      </View>

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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ImageBackground
          source={require("@assets/images/PetTapp pattern.png")}
          style={styles.backgroundimg}
          imageStyle={styles.backgroundImageStyle}
          resizeMode="repeat"
        />

        {/* Custom Header */}
        <View style={[styles.customHeader, { paddingTop: insets.top + moderateScale(10) }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeftContent}>
              <TouchableOpacity style={styles.profileImageContainer}>
                <View style={styles.profilePlaceholder}>
                  <Ionicons name="storefront" size={moderateScale(24)} color="#1C86FF" />
                </View>
              </TouchableOpacity>

              <View style={styles.headerTextContainer}>
                <Text style={styles.welcomeText}>Welcome Back!</Text>
                <Text style={styles.businessNameHeader} numberOfLines={1}>{businessName}</Text>
              </View>
            </View>

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
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1C86FF" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("@assets/images/PetTapp pattern.png")}
        style={styles.backgroundimg}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="repeat"
      />

      {/* Custom Header */}
        <BusinessHeader
          backgroundColor="#1C86FF"
          titleColor="#fff"
          customTitle={renderCustomTitle()}
          showBack={false}
        />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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
                <Text style={styles.metricTitle} numberOfLines={2}>{metric.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Today's Schedule Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <TouchableOpacity onPress={() => router.push("../booking")}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Appointments List */}
          <View style={styles.appointmentsList}>
            {dashboardData.todaysSchedule && dashboardData.todaysSchedule.length > 0 ? (
              dashboardData.todaysSchedule.map((appointment) => (
                <TouchableOpacity
                  key={appointment._id}
                  style={styles.appointmentCard}
                  onPress={() => router.push("../booking")}
                >
                  <View style={styles.appointmentIconContainer}>
                    <Ionicons
                      name="calendar"
                      size={moderateScale(28)}
                      color="#1C86FF"
                    />
                  </View>
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.appointmentCustomer} numberOfLines={1}>
                      {appointment.name || 'Customer'}
                    </Text>
                    <Text style={styles.appointmentService} numberOfLines={1}>
                      {appointment.service || 'Service'}
                    </Text>
                    <Text style={styles.appointmentTime}>⏰ {formatTime(appointment.time)}</Text>
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
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={moderateScale(48)} color="#C7C7CC" />
                <Text style={styles.emptyStateText}>No appointments scheduled for today</Text>
              </View>
            )}
          </View>

          {/* My Services Section */}
          <View style={styles.servicesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Services</Text>
              <TouchableOpacity onPress={() => router.push("../my-services")}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {services && services.length > 0 ? (
              services.map((service) => (
                <TouchableOpacity
                  key={service._id}
                  style={styles.serviceCard}
                  onPress={() => router.push("../my-services")}
                >
                  <View style={[
                    styles.serviceIconContainer,
                    { backgroundColor: getCategoryColor(service.category) }
                  ]}>
                    <Ionicons
                      name={getCategoryIcon(service.category)}
                      size={moderateScale(28)}
                      color="#fff"
                    />
                  </View>

                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName} numberOfLines={1}>{service.name}</Text>
                    <Text style={styles.serviceCategory}>
                      {service.category.charAt(0).toUpperCase() + service.category.slice(1)}
                    </Text>
                    <View style={styles.serviceDetails}>
                      <Text style={styles.servicePrice}>
                        {formatCurrency(service.price?.amount || 0)}
                      </Text>
                      <Text style={styles.serviceDuration}>
                        {' • '}{formatDuration(service.duration)}
                      </Text>
                    </View>
                  </View>

                  <View style={[
                    styles.availabilityBadge,
                    service.isActive ? styles.availableBadge : styles.unavailableBadge
                  ]}>
                    <Text style={styles.availabilityText}>
                      {service.isActive ? 'Available' : 'Unavailable'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="briefcase-outline" size={moderateScale(48)} color="#C7C7CC" />
                <Text style={styles.emptyStateText}>No services added yet</Text>
                <TouchableOpacity
                  style={styles.addServiceButton}
                  onPress={() => router.push("../my-services")}
                >
                  <Text style={styles.addServiceButtonText}>Add Service</Text>
                </TouchableOpacity>
              </View>
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(40),
  },
  loadingText: {
    marginTop: moderateScale(12),
    fontSize: scaleFontSize(14),
    color: '#666',
    fontFamily: 'SFProReg',
  },
  customHeader: {
    backgroundColor: "#1C86FF",
    paddingHorizontal: wp(5),
    paddingBottom: moderateScale(20),
    borderBottomLeftRadius: moderateScale(20),
    borderBottomRightRadius: moderateScale(20),
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
    flex: 1,
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
    flex: 1,
  },
  notificationButton: {
    padding: moderateScale(8),
  },
  welcomeText: {
    fontSize: scaleFontSize(12),
    color: "#FF0000",
    fontFamily: "SFProReg",
  },
  businessNameHeader: {
    fontSize: scaleFontSize(16),
    fontWeight: "bold",
    color: "#FF0000",
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(40),
    paddingHorizontal: moderateScale(20),
  },
  emptyStateText: {
    marginTop: moderateScale(12),
    fontSize: scaleFontSize(14),
    color: '#999',
    textAlign: 'center',
    fontFamily: 'SFProReg',
  },
  addServiceButton: {
    marginTop: moderateScale(16),
    backgroundColor: '#1C86FF',
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(8),
  },
  addServiceButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    fontFamily: 'SFProBold',
  },
});
