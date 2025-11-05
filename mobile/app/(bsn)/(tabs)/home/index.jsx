import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { wp, hp, moderateScale, scaleFontSize } from "@utils/responsive";
import apiClient from "@config/api";
import BusinessHeader from "@components/BusinessHeader";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BusinessDashboardSkeleton } from "@components/SkeletonLoader";


export default function BusinessDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [businessId, setBusinessId] = useState(null);
  const [businessName, setBusinessName] = useState("Business Dashboard");
  const [businessLogo, setBusinessLogo] = useState(null);

  // Modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileModalConfig, setProfileModalConfig] = useState({
    title: '',
    message: '',
    icon: 'business',
    type: 'create' // 'create' or 'complete'
  });

  // State for API data
  const [dashboardData, setDashboardData] = useState({
    metrics: {
      todaysBookings: 0,
      monthlyBookings: 0,
      todaysRevenue: 0,
      monthlyRevenue: 0,
    },
    pendingBookings: [],
    rescheduleRequests: [],
    todaysSchedule: [],
  });
  const [services, setServices] = useState([]);

  // Check if user profile is complete
  const isUserProfileComplete = (user, profile) => {
    if (!user) return false;

    // Check required fields for a complete user profile
    const hasUserInfo = user.firstName &&
                       user.lastName &&
                       user.email;

    const hasContactNumber = profile && profile.contactNumber;

    return hasUserInfo && hasContactNumber;
  };

  // Check if business profile is complete
  const isBusinessProfileComplete = (business) => {
    if (!business) return false;

    // Check required fields for a complete business profile
    const hasBasicInfo = business.businessName &&
                         business.contactInfo &&
                         business.contactInfo.email &&
                         business.contactInfo.phone;

    const hasAddress = business.address &&
                       business.address.street &&
                       business.address.city;

    return hasBasicInfo && hasAddress;
  };

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const response = await apiClient.get('/users/profile');
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Fetch business details
  const fetchBusinessDetails = async () => {
    try {
      const response = await apiClient.get('/businesses');
      if (response.data && response.data.data && response.data.data.length > 0) {
        const business = response.data.data[0];
        setBusinessName(business.businessName || "Business Dashboard");
        setBusinessLogo(business.images?.logo || business.logo || null);
        return business;
      }
      return null;
    } catch (error) {
      console.error('Error fetching business details:', error);
      return null;
    }
  };

  // Fetch business ID from AsyncStorage
  const fetchBusinessId = async () => {
    try {
      const storedBusinessId = await AsyncStorage.getItem('businessId');
      if (storedBusinessId) {
        setBusinessId(storedBusinessId);
        // Fetch business details to get name and logo
        await fetchBusinessDetails();
        return storedBusinessId;
      } else {
        // Try to fetch from API
        const response = await apiClient.get('/businesses');
        if (response.data && response.data.data && response.data.data.length > 0) {
          const business = response.data.data[0];
          await AsyncStorage.setItem('businessId', business._id);
          setBusinessId(business._id);
          setBusinessName(business.businessName || "Business Dashboard");
          setBusinessLogo(business.images?.logo || business.logo || null);
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
  const fetchDashboardData = async (bId, business = null) => {
    try {
      const response = await apiClient.get('/dashboard', {
        params: { businessId: bId }
      });

      if (response.data && response.data.success) {
        setDashboardData(prevData => ({
          ...response.data.data,
          // Preserve rescheduleRequests and todaysSchedule if they exist in previous state
          rescheduleRequests: prevData.rescheduleRequests || response.data.data.rescheduleRequests || [],
          todaysSchedule: prevData.todaysSchedule || response.data.data.todaysSchedule || []
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);

      // Check if error is due to incomplete profile
      if (business && !isBusinessProfileComplete(business)) {
        setProfileModalConfig({
          title: 'Complete Your Profile',
          message: 'Please complete your business profile to view dashboard data.',
          icon: 'document-text-outline',
          type: 'complete'
        });
        setShowProfileModal(true);
      } else {
        // Only show generic error if profile is complete
        Alert.alert('Error', 'Failed to load dashboard data');
      }
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

  // Fetch reschedule requests
  const fetchRescheduleRequests = async () => {
    try {
      const response = await apiClient.get('/bookings', {
        params: { hasEditRequest: true, limit: 10 }
      });

      if (response.data && response.data.success) {
        const rescheduleData = response.data.data
          .filter(booking => booking.editRequest?.approvalStatus === 'pending')
          .map(booking => ({
            _id: booking._id,
            name: booking.petOwnerId
              ? `${booking.petOwnerId.firstName} ${booking.petOwnerId.lastName}`
              : 'Unknown',
            service: booking.serviceId?.name || 'Unknown Service',
            petName: booking.petId?.name || 'Unknown Pet',
            currentDateTime: booking.appointmentDateTime,
            requestedDateTime: booking.editRequest?.appointmentDateTime || booking.appointmentDateTime,
            requestedAt: booking.editRequest?.requestedAt,
            status: booking.status
          }));

        setDashboardData(prevData => ({
          ...prevData,
          rescheduleRequests: rescheduleData
        }));
      }
    } catch (error) {
      console.error('Error fetching reschedule requests:', error);
      // Don't show alert for reschedule requests error, just log it
    }
  };

  // Fetch today's schedule
  const fetchTodaysSchedule = async () => {
    try {
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Fetch bookings with a reasonable limit
      const response = await apiClient.get('/bookings', {
        params: {
          limit: 100
        }
      });

      if (response.data && response.data.success) {
        // Filter bookings to only include today's appointments
        const scheduleData = response.data.data
          .filter(booking => {
            const appointmentDate = new Date(booking.appointmentDateTime);
            return appointmentDate >= today && appointmentDate < tomorrow;
          })
          .map(booking => ({
            _id: booking._id,
            time: booking.appointmentDateTime,
            name: booking.petOwnerId
              ? `${booking.petOwnerId.firstName} ${booking.petOwnerId.lastName}`
              : 'Unknown',
            service: booking.serviceId?.name || 'Unknown Service',
            petName: booking.petId?.name || 'Unknown Pet',
            status: booking.status
          }));

        setDashboardData(prevData => ({
          ...prevData,
          todaysSchedule: scheduleData
        }));
      }
    } catch (error) {
      console.error('Error fetching today\'s schedule:', error);
      // Don't show alert for schedule error, just log it
    }
  };

  // Load all data
  const loadData = async () => {
    try {
      setLoading(true);

      // First, check if business profile exists and is complete (PRIORITY)
      const business = await fetchBusinessDetails();

      if (!business) {
        setProfileModalConfig({
          title: 'Business Profile Required',
          message: 'Please create your business profile first to access your dashboard.',
          icon: 'business-outline',
          type: 'create'
        });
        setShowProfileModal(true);
        return;
      }

      // Check if business profile is complete
      if (!isBusinessProfileComplete(business)) {
        setProfileModalConfig({
          title: 'Complete Your Business Profile',
          message: 'Please complete your business profile to access the full dashboard features.',
          icon: 'document-text-outline',
          type: 'complete'
        });
        setShowProfileModal(true);
        return;
      }

      // Second, check if user profile is complete
      const userProfileData = await fetchUserProfile();

      if (!userProfileData) {
        setProfileModalConfig({
          title: 'User Profile Required',
          message: 'Please create your user profile to access your dashboard.',
          icon: 'person-outline',
          type: 'create'
        });
        setShowProfileModal(true);
        return;
      }

      const { user, profile } = userProfileData;

      // Check if user profile is complete
      if (!isUserProfileComplete(user, profile)) {
        setProfileModalConfig({
          title: 'Complete Your Profile',
          message: 'Please complete your user profile to access the full dashboard features.',
          icon: 'person-circle-outline',
          type: 'complete'
        });
        setShowProfileModal(true);
        return;
      }

      // Get business ID
      const bId = business._id;
      if (bId) {
        setBusinessId(bId);
        await AsyncStorage.setItem('businessId', bId);

        // Load dashboard data, services, reschedule requests, and today's schedule only if both profiles are complete
        await Promise.all([
          fetchDashboardData(bId, business),
          fetchServices(bId),
          fetchRescheduleRequests(),
          fetchTodaysSchedule()
        ]);
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

  // Quiet refresh data without loading indicators
  const quietRefresh = async () => {
    if (!businessId) return;

    try {
      // Fetch all data quietly in the background
      await Promise.all([
        fetchDashboardData(businessId),
        fetchServices(businessId),
        fetchRescheduleRequests(),
        fetchTodaysSchedule()
      ]);
    } catch (error) {
      console.error('Error during quiet refresh:', error);
      // Don't show alerts during quiet refresh
    }
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Quiet refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (businessId) {
        quietRefresh();
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
      route: "/(bsn)/(tabs)/analytics",
      params: { filter: "today" },
    },
    {
      id: 2,
      title: "Today's Revenue",
      value: formatCurrency(dashboardData.metrics.todaysRevenue),
      icon: "cash",
      color: "#2196F3",
      route: "/(bsn)/(tabs)/revenue",
      params: { filter: "today" },
    },
    {
      id: 3,
      title: "Monthly Bookings",
      value: dashboardData.metrics.monthlyBookings.toString(),
      icon: "time",
      color: "#FF9B79",
      route: "/(bsn)/(tabs)/analytics",
      params: { filter: "thisMonth" },
    },
    {
      id: 4,
      title: "Monthly Revenue",
      value: formatCurrency(dashboardData.metrics.monthlyRevenue),
      icon: "trending-up",
      color: "#FFD700",
      route: "/(bsn)/(tabs)/revenue",
      params: { filter: "month" },
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("@assets/images/PetTapp pattern.png")}
        style={styles.backgroundimg}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="repeat"
      />

      {loading ? (
        <BusinessDashboardSkeleton />
      ) : (
        <>
          {/* Business Header - Loads after data is ready */}
          <BusinessHeader
            businessName={businessName}
            businessLogo={businessLogo}
            backgroundColor="#1C86FF"
            titleColor="#fff"
            showBack={false}
            onNotificationPress={() => router.push("/(bsn)/(tabs)/profile/notifications")}
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
                onPress={() => metric.route && router.push({
                  pathname: metric.route,
                  params: metric.params
                })}
              >
                <View style={[styles.metricIconContainer, { backgroundColor: metric.color }]}>
                  <Ionicons name={metric.icon} size={moderateScale(22)} color="#fff" />
                </View>
                <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>{metric.value}</Text>
                <Text style={styles.metricTitle} numberOfLines={2}>{metric.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Pending Bookings Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Bookings</Text>
            <TouchableOpacity onPress={() => router.push("../booking")}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Pending Bookings List */}
          <View style={styles.pendingBookingsList}>
            {dashboardData.pendingBookings && dashboardData.pendingBookings.length > 0 ? (
              dashboardData.pendingBookings.slice(0, 3).map((booking) => (
                <TouchableOpacity
                  key={booking._id}
                  style={styles.pendingBookingCard}
                  onPress={() => router.push({
                    pathname: "../booking/AppointmentDetails",
                    params: { bookingId: booking._id }
                  })}
                >
                  <View style={styles.pendingBookingIconContainer}>
                    <Ionicons
                      name="time-outline"
                      size={moderateScale(28)}
                      color="#FF9B79"
                    />
                  </View>
                  <View style={styles.pendingBookingInfo}>
                    <Text style={styles.pendingBookingCustomer} numberOfLines={1}>
                      {booking.name || 'Customer'}
                    </Text>
                    <Text style={styles.pendingBookingService} numberOfLines={1}>
                      {booking.service || 'Service'}
                    </Text>
                    <Text style={styles.pendingBookingTime}>⏰ {formatTime(booking.time)}</Text>
                  </View>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>Pending</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-done-outline" size={moderateScale(48)} color="#C7C7CC" />
                <Text style={styles.emptyStateText}>No pending bookings</Text>
              </View>
            )}
          </View>

          {/* Reschedule Requests Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reschedule Requests</Text>
            <TouchableOpacity onPress={() => router.push("../booking")}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Reschedule Requests List */}
          <View style={styles.rescheduleRequestsList}>
            {dashboardData.rescheduleRequests && dashboardData.rescheduleRequests.length > 0 ? (
              dashboardData.rescheduleRequests.slice(0, 3).map((booking) => (
                <TouchableOpacity
                  key={booking._id}
                  style={styles.rescheduleRequestCard}
                  onPress={() => router.push({
                    pathname: "../booking/AppointmentDetails",
                    params: { bookingId: booking._id }
                  })}
                >
                  <View style={styles.rescheduleIconContainer}>
                    <Ionicons
                      name="swap-horizontal-outline"
                      size={moderateScale(28)}
                      color="#FF6B6B"
                    />
                  </View>
                  <View style={styles.rescheduleInfo}>
                    <Text style={styles.rescheduleCustomer} numberOfLines={1}>
                      {booking.name || 'Customer'}
                    </Text>
                    <Text style={styles.rescheduleService} numberOfLines={1}>
                      {booking.service || 'Service'}
                    </Text>
                    <View style={styles.rescheduleTimeContainer}>
                      <Text style={styles.rescheduleOldTime}>
                        {formatTime(booking.currentDateTime)}
                      </Text>
                      <Ionicons name="arrow-forward" size={moderateScale(12)} color="#999" />
                      <Text style={styles.rescheduleNewTime}>
                        {formatTime(booking.requestedDateTime)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.rescheduleRequestBadge}>
                    <Text style={styles.rescheduleRequestBadgeText}>Review</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-done-outline" size={moderateScale(48)} color="#C7C7CC" />
                <Text style={styles.emptyStateText}>No reschedule requests</Text>
              </View>
            )}
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
            {dashboardData.todaysSchedule && dashboardData.todaysSchedule.filter(apt => apt.status !== 'cancelled' && apt.status !== 'pending').length > 0 ? (
              dashboardData.todaysSchedule.filter(apt => apt.status !== 'cancelled' && apt.status !== 'pending').map((appointment) => (
                <TouchableOpacity
                  key={appointment._id}
                  style={styles.appointmentCard}
                  onPress={() => router.push({
                    pathname: "../booking/AppointmentDetails",
                    params: { bookingId: appointment._id }
                  })}
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
              services.map((service) => {
                return (
                  <TouchableOpacity
                    key={service._id}
                    style={styles.serviceCard}
                    onPress={() => router.push({
                      pathname: "../my-services/ServiceDetails",
                      params: { serviceId: service._id }
                    })}
                  >
                    {service.imageUrl ? (
                      <Image
                        source={{ uri: service.imageUrl }}
                        style={styles.serviceImage}
                        resizeMode="cover"
                      />
                    ) : (
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
                    )}

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
                );
              })
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
        </>
      )}

      {/* Styled Profile Required Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showProfileModal}
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Icon Container */}
            <View style={styles.modalIconContainer}>
              <View style={styles.modalIconCircle}>
                <Ionicons
                  name={profileModalConfig.icon}
                  size={moderateScale(48)}
                  color="#1C86FF"
                />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.modalTitle}>{profileModalConfig.title}</Text>

            {/* Message */}
            <Text style={styles.modalMessage}>{profileModalConfig.message}</Text>

            {/* Single Button */}
            <TouchableOpacity
              style={styles.modalFullWidthButton}
              onPress={() => {
                setShowProfileModal(false);
                // Route to user profile or business profile based on modal icon
                if (profileModalConfig.icon === 'person-outline' || profileModalConfig.icon === 'person-circle-outline') {
                  router.push('/(bsn)/(tabs)/profile/settings/profile');
                } else {
                  router.push('/(bsn)/(tabs)/profile/business-info');
                }
              }}
            >
              <Text style={styles.modalFullWidthButtonText}>
                {profileModalConfig.type === 'create' ? 'Create Profile' : 'Complete Profile'}
              </Text>
              <Ionicons name="arrow-forward" size={moderateScale(20)} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  fullScreenLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    gap: moderateScale(6),
  },
  metricCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: moderateScale(14),
    padding: moderateScale(14),
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricIconContainer: {
    width: moderateScale(45),
    height: moderateScale(45),
    borderRadius: moderateScale(22.5),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: moderateScale(8),
  },
  metricValue: {
    fontSize: scaleFontSize(20),
    fontWeight: "bold",
    color: "#333",
    marginBottom: moderateScale(4),
    textAlign: "center",
  },
  metricTitle: {
    fontSize: scaleFontSize(11),
    color: "#666",
    textAlign: "center",
    lineHeight: scaleFontSize(14),
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
  pendingBookingsList: {
    marginBottom: moderateScale(30),
  },
  pendingBookingCard: {
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
    borderLeftWidth: moderateScale(4),
    borderLeftColor: "#FF9B79",
  },
  pendingBookingIconContainer: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(12),
  },
  pendingBookingInfo: {
    flex: 1,
  },
  pendingBookingCustomer: {
    fontSize: scaleFontSize(15),
    fontWeight: "bold",
    color: "#333",
    marginBottom: moderateScale(4),
  },
  pendingBookingService: {
    fontSize: scaleFontSize(13),
    color: "#666",
    marginBottom: moderateScale(4),
  },
  pendingBookingTime: {
    fontSize: scaleFontSize(12),
    color: "#999",
  },
  pendingBadge: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(12),
    backgroundColor: "#FF9B79",
  },
  pendingBadgeText: {
    fontSize: scaleFontSize(11),
    color: "#fff",
    fontWeight: "600",
  },
  rescheduleRequestsList: {
    marginBottom: moderateScale(30),
  },
  rescheduleRequestCard: {
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
    borderLeftWidth: moderateScale(4),
    borderLeftColor: "#FF6B6B",
  },
  rescheduleIconContainer: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: "#FFEBEE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(12),
  },
  rescheduleInfo: {
    flex: 1,
  },
  rescheduleCustomer: {
    fontSize: scaleFontSize(15),
    fontWeight: "bold",
    color: "#333",
    marginBottom: moderateScale(4),
  },
  rescheduleService: {
    fontSize: scaleFontSize(13),
    color: "#666",
    marginBottom: moderateScale(6),
  },
  rescheduleTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
  },
  rescheduleOldTime: {
    fontSize: scaleFontSize(12),
    color: "#999",
    textDecorationLine: "line-through",
  },
  rescheduleNewTime: {
    fontSize: scaleFontSize(12),
    color: "#FF6B6B",
    fontWeight: "600",
  },
  rescheduleRequestBadge: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(12),
    backgroundColor: "#FF6B6B",
  },
  rescheduleRequestBadgeText: {
    fontSize: scaleFontSize(11),
    color: "#fff",
    fontWeight: "600",
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
  serviceImage: {
    width: moderateScale(55),
    height: moderateScale(55),
    borderRadius: moderateScale(28),
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(20),
    padding: moderateScale(30),
    width: '90%',
    maxWidth: moderateScale(400),
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalIconContainer: {
    marginBottom: moderateScale(20),
  },
  modalIconCircle: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: moderateScale(3),
    borderColor: '#1C86FF',
  },
  modalTitle: {
    fontSize: scaleFontSize(22),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: moderateScale(12),
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: scaleFontSize(15),
    color: '#666',
    textAlign: 'center',
    lineHeight: scaleFontSize(22),
    marginBottom: moderateScale(30),
    paddingHorizontal: moderateScale(10),
  },
  modalFullWidthButton: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: moderateScale(16),
    paddingHorizontal: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: '#1C86FF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(10),
    elevation: 4,
    shadowColor: '#1C86FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  modalFullWidthButtonText: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
});
