import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '@components/Header';
import CompleteProfileModal from "@components/CompleteProfileModal";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from "../../../config/api";
import { useProfileCompletion } from "../../../_hooks/useProfileCompletion";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NotificationsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [showProfileIncompleteModal, setShowProfileIncompleteModal] = useState(false);
  const { isProfileComplete } = useProfileCompletion();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [userId, setUserId] = useState(null);

  // Fetch user ID
  const fetchUserId = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      if (storedUserId) {
        setUserId(storedUserId);
        return storedUserId;
      } else {
        const response = await apiClient.get('/auth/me');
        if (response.data && response.data.user) {
          const user = response.data.user;
          await AsyncStorage.setItem('userId', user._id);
          setUserId(user._id);
          return user._id;
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching user ID:', error);
      return null;
    }
  };

  // Convert bookings to notifications
  const convertBookingsToNotifications = (bookings) => {
    return bookings.map(booking => {
      const business = booking.businessId || {};
      const businessName = business.businessName || 'Service Provider';
      const serviceName = booking.serviceId?.name || 'Service';
      const petName = booking.petId?.name || 'Your pet';

      let type = 'booking';
      let icon = 'calendar';
      let iconColor = '#4CAF50';
      let iconBg = '#E8F5E9';
      let title = 'Booking Update';
      let message = '';

      // Determine notification type and message based on booking status
      if (booking.status === 'pending') {
        type = 'booking';
        icon = 'time-outline';
        iconColor = '#FF9B79';
        iconBg = '#FFF3E0';
        title = 'Booking Pending';
        message = `Your ${serviceName} appointment for ${petName} at ${businessName} is pending confirmation`;
      } else if (booking.status === 'confirmed') {
        type = 'booking';
        icon = 'checkmark-circle';
        iconColor = '#4CAF50';
        iconBg = '#E8F5E9';
        title = 'Booking Confirmed';
        message = `Your ${serviceName} appointment for ${petName} at ${businessName} has been confirmed`;
      } else if (booking.status === 'cancelled') {
        type = 'booking';
        icon = 'close-circle';
        iconColor = '#FF6B6B';
        iconBg = '#FFEBEE';
        title = 'Booking Cancelled';
        message = `Your ${serviceName} appointment for ${petName} has been cancelled`;
      } else if (booking.status === 'in-progress') {
        type = 'booking';
        icon = 'play-circle';
        iconColor = '#2196F3';
        iconBg = '#E3F2FD';
        title = 'Service In Progress';
        message = `${serviceName} for ${petName} is currently in progress`;
      } else if (booking.status === 'completed') {
        type = 'booking';
        icon = 'checkmark-done';
        iconColor = '#4CAF50';
        iconBg = '#E8F5E9';
        title = 'Service Completed';
        message = `Your ${serviceName} for ${petName} has been completed. Rate your experience!`;
      } else if (booking.status === 'no-show') {
        type = 'booking';
        icon = 'alert-circle';
        iconColor = '#999';
        iconBg = '#F5F5F5';
        title = 'Missed Appointment';
        message = `You missed your ${serviceName} appointment for ${petName}`;
      }

      // Calculate time ago
      const time = getTimeAgo(booking.createdAt || booking.appointmentDateTime);

      // Mark recent bookings (last 24 hours) as unread
      const isRecent = new Date() - new Date(booking.createdAt || booking.appointmentDateTime) < 24 * 60 * 60 * 1000;

      return {
        id: booking._id,
        type,
        icon,
        iconColor,
        iconBg,
        title,
        message,
        time,
        read: !isRecent,
        bookingId: booking._id,
        appointmentDate: booking.appointmentDateTime,
      };
    });
  };

  // Helper function to calculate time ago
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Fetch bookings and convert to notifications
  const fetchNotifications = async (uId) => {
    try {
      // Fetch user's bookings
      const response = await apiClient.get('/bookings', {
        params: {
          page: 1,
          limit: 50,
          sort: '-createdAt',
        }
      });

      if (response.data && response.data.success) {
        const bookings = response.data.data || [];
        const notificationsList = convertBookingsToNotifications(bookings);
        setNotifications(notificationsList);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      const uId = userId || await fetchUserId();

      if (uId) {
        await fetchNotifications(uId);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
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
      if (userId) {
        loadData();
      }
    }, [userId])
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = activeTab === 'all'
    ? notifications
    : notifications.filter(n => !n.read);

  // Show modal if profile is incomplete
  useEffect(() => {
    if (!isProfileComplete) {
      setShowProfileIncompleteModal(true);
    }
  }, [isProfileComplete]);

  const handleNotificationPress = (notification) => {
    if (notification.bookingId) {
      router.push({
        pathname: '/(user)/(tabs)/booking/ScheduleDetail',
        params: { bookingId: notification.bookingId }
      });
    } else {
      router.push('/(user)/(tabs)/booking');
    }
  };

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText}>Notifications</Text>
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount}</Text>
        </View>
      )}
    </View>
  );

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.read && styles.unreadCard]}
      activeOpacity={0.7}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
        <Ionicons name={item.icon} size={moderateScale(24)} color={item.iconColor} />
      </View>

      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {item.message}
        </Text>
        <View style={styles.notificationFooter}>
          <Ionicons name="time-outline" size={moderateScale(14)} color="#999" />
          <Text style={styles.notificationTime}>{item.time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="notifications-off-outline" size={moderateScale(60)} color="#ccc" />
      </View>
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyMessage}>
        You're all caught up! Check back later for updates.
      </Text>
    </View>
  );

  if (loading) {
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
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header
        backgroundColor="#1C86FF"
        titleColor="#fff"
        customTitle={renderTitle()}
        showBack={true}
      />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All
          </Text>
          <View style={[styles.tabBadge, activeTab === 'all' && styles.activeTabBadge]}>
            <Text style={[styles.tabBadgeText, activeTab === 'all' && styles.activeTabBadgeText]}>
              {notifications.length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'unread' && styles.activeTab]}
          onPress={() => setActiveTab('unread')}
        >
          <Text style={[styles.tabText, activeTab === 'unread' && styles.activeTabText]}>
            Unread
          </Text>
          {unreadCount > 0 && (
            <View style={[styles.tabBadge, activeTab === 'unread' && styles.activeTabBadge]}>
              <Text style={[styles.tabBadgeText, activeTab === 'unread' && styles.activeTabBadgeText]}>
                {unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        renderEmptyState()
      )}

      {/* Profile Incomplete Modal */}
      <CompleteProfileModal
        visible={showProfileIncompleteModal}
        onClose={() => setShowProfileIncompleteModal(false)}
        message="Please complete your profile information before viewing notifications. You need to provide your first name, last name, address, and contact number."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    color: '#fff',
    fontSize: scaleFontSize(24),
    fontFamily: 'SFProBold',
  },
  badge: {
    backgroundColor: '#FF5722',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    marginLeft: moderateScale(8),
    minWidth: moderateScale(20),
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: scaleFontSize(12),
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(12),
    gap: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(20),
    backgroundColor: '#f5f5f5',
    gap: moderateScale(8),
  },
  activeTab: {
    backgroundColor: '#1C86FF',
  },
  tabText: {
    fontSize: scaleFontSize(15),
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  tabBadge: {
    backgroundColor: '#E0E0E0',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    minWidth: moderateScale(22),
    alignItems: 'center',
  },
  activeTabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabBadgeText: {
    color: '#666',
    fontSize: scaleFontSize(12),
    fontWeight: 'bold',
  },
  activeTabBadgeText: {
    color: '#fff',
  },
  listContent: {
    padding: moderateScale(16),
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: moderateScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#1C86FF',
  },
  iconContainer: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  notificationTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  unreadDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#1C86FF',
    marginLeft: moderateScale(8),
  },
  notificationMessage: {
    fontSize: scaleFontSize(14),
    color: '#666',
    lineHeight: moderateScale(20),
    marginBottom: moderateScale(8),
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
  },
  notificationTime: {
    fontSize: scaleFontSize(12),
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(40),
  },
  emptyIconCircle: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(20),
  },
  emptyTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#999',
    marginBottom: moderateScale(8),
  },
  emptyMessage: {
    fontSize: scaleFontSize(14),
    color: '#bbb',
    textAlign: 'center',
    lineHeight: moderateScale(20),
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
  },
});
