import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from '@config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationEvents, { NOTIFICATION_EVENTS } from '@utils/notificationEvents';

export default function NotificationsScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Map notification type to icon and colors
  const getNotificationStyle = (type) => {
    const styles = {
      booking: { icon: 'calendar', iconColor: '#4CAF50' },
      business: { icon: 'storefront', iconColor: '#2196F3' },
      payment: { icon: 'cash', iconColor: '#FF9800' },
      rating: { icon: 'star', iconColor: '#FFB300' },
      admin: { icon: 'shield', iconColor: '#9C27B0' },
      reminder: { icon: 'alarm', iconColor: '#FF5722' },
      cancelled: { icon: 'close-circle', iconColor: '#FF6B6B' },
      message: { icon: 'chatbubble', iconColor: '#2196F3' },
    };
    return styles[type] || styles.booking;
  };

  // Format notifications for display
  const formatNotifications = (notifications) => {
    return notifications.map(notification => {
      const style = getNotificationStyle(notification.type);
      const time = getTimeAgo(notification.createdAt);

      // Extract customer/pet info from notification data if available
      const customerName = notification.data?.customerName || notification.title || 'Customer';
      const petName = notification.data?.petName || null;
      const service = notification.data?.serviceName || null;

      return {
        id: notification._id,
        type: notification.type,
        icon: style.icon,
        iconColor: style.iconColor,
        customerName,
        petName,
        service,
        message: notification.message,
        time,
        read: notification.isRead,
        bookingId: notification.data?.bookingId,
        appointmentDate: notification.data?.appointmentDate,
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Fetch real notifications from API
  const fetchNotifications = async () => {
    try {
      const response = await apiClient.get('/notifications', {
        params: {
          page: 1,
          limit: 50,
          sort: '-createdAt',
        }
      });

      if (response.data && response.data.success) {
        const rawNotifications = response.data.data || [];
        const formattedNotifications = formatNotifications(rawNotifications);
        setNotifications(formattedNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      // Emit event to update badge counts everywhere
      notificationEvents.emit(NOTIFICATION_EVENTS.ALL_READ);
      console.log('✅ All notifications marked as read');
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      await fetchNotifications();
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
      loadData();
      // Mark all notifications as read when screen is focused
      markAllAsRead();
    }, [])
  );

  const filterNotifications = () => {
    if (selectedTab === 'all') return notifications;
    return notifications.filter(notif => notif.type === selectedTab);
  };

  const getTabCount = (type) => {
    if (type === 'all') return notifications.length;
    return notifications.filter(notif => notif.type === type).length;
  };

  const handleNotificationPress = (notification) => {
    if (notification.type === 'message') {
      router.push('/(bsn)/(tabs)/messages');
    } else if (notification.type === 'booking' || notification.type === 'cancelled') {
      // Navigate to specific booking details
      if (notification.bookingId) {
        router.push({
          pathname: '/(bsn)/(tabs)/booking/AppointmentDetails',
          params: { bookingId: notification.bookingId }
        });
      } else {
        router.push('/(bsn)/(tabs)/booking');
      }
    }
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
          title="Notifications"
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
      <ImageBackground
        source={require("@assets/images/PetTapp pattern.png")}
        style={styles.backgroundimg}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="repeat"
      />
      <Header
        backgroundColor="#1C86FF"
        titleColor="#fff"
        title="Notifications"
        showBack={true}
      />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
          onPress={() => setSelectedTab('all')}
        >
          <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
            All ({getTabCount('all')})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'booking' && styles.tabActive]}
          onPress={() => setSelectedTab('booking')}
        >
          <Text style={[styles.tabText, selectedTab === 'booking' && styles.tabTextActive]}>
            Bookings ({getTabCount('booking')})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'message' && styles.tabActive]}
          onPress={() => setSelectedTab('message')}
        >
          <Text style={[styles.tabText, selectedTab === 'message' && styles.tabTextActive]}>
            Messages ({getTabCount('message')})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'cancelled' && styles.tabActive]}
          onPress={() => setSelectedTab('cancelled')}
        >
          <Text style={[styles.tabText, selectedTab === 'cancelled' && styles.tabTextActive]}>
            Cancelled ({getTabCount('cancelled')})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filterNotifications().map((notification) => (
          <TouchableOpacity
            key={notification.id}
            style={[styles.notificationCard, !notification.read && styles.notificationUnread]}
            onPress={() => handleNotificationPress(notification)}
          >
            <View style={[styles.notificationIcon, { backgroundColor: `${notification.iconColor}20` }]}>
              <Ionicons name={notification.icon} size={moderateScale(24)} color={notification.iconColor} />
            </View>
            <View style={styles.notificationContent}>
              <View style={styles.notificationHeader}>
                <Text style={styles.customerName}>{notification.customerName}</Text>
                {!notification.read && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
              {notification.service && (
                <View style={styles.serviceTag}>
                  <Ionicons name="paw" size={moderateScale(12)} color="#1C86FF" />
                  <Text style={styles.serviceTagText}>
                    {notification.petName} • {notification.service}
                  </Text>
                </View>
              )}
              {!notification.service && notification.petName && (
                <View style={styles.serviceTag}>
                  <Ionicons name="paw" size={moderateScale(12)} color="#1C86FF" />
                  <Text style={styles.serviceTagText}>{notification.petName}</Text>
                </View>
              )}
              <Text style={styles.notificationTime}>{notification.time}</Text>
            </View>
            <Ionicons name="chevron-forward" size={moderateScale(20)} color="#999" />
          </TouchableOpacity>
        ))}

        {filterNotifications().length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off" size={moderateScale(80)} color="#ccc" />
            <Text style={styles.emptyStateText}>No notifications</Text>
            <Text style={styles.emptyStateSubtext}>
              You'll see notifications about bookings and messages here
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  backgroundimg: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.5 }],
  },
  backgroundImageStyle: {
    opacity: 0.1,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: wp(2),
    paddingVertical: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(4),
    alignItems: 'center',
    borderRadius: moderateScale(8),
  },
  tabActive: {
    backgroundColor: '#E3F2FD',
  },
  tabText: {
    fontSize: scaleFontSize(12),
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#1C86FF',
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(15),
    paddingBottom: moderateScale(100),
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    marginBottom: moderateScale(12),
    alignItems: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  notificationUnread: {
    borderLeftWidth: moderateScale(4),
    borderLeftColor: '#1C86FF',
  },
  notificationIcon: {
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
  customerName: {
    fontSize: scaleFontSize(15),
    fontWeight: '700',
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
    marginBottom: moderateScale(8),
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(8),
    gap: moderateScale(6),
    marginBottom: moderateScale(6),
  },
  serviceTagText: {
    fontSize: scaleFontSize(12),
    color: '#1C86FF',
    fontWeight: '500',
  },
  notificationTime: {
    fontSize: scaleFontSize(12),
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(60),
  },
  emptyStateText: {
    fontSize: scaleFontSize(18),
    fontWeight: '600',
    color: '#666',
    marginTop: moderateScale(20),
  },
  emptyStateSubtext: {
    fontSize: scaleFontSize(14),
    color: '#999',
    textAlign: 'center',
    marginTop: moderateScale(8),
    paddingHorizontal: wp(10),
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
