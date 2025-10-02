import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';

export default function NotificationsScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('all');

  const notifications = [
    {
      id: 1,
      type: 'booking',
      icon: 'calendar',
      iconColor: '#4CAF50',
      customerName: 'Sarah Johnson',
      petName: 'Max',
      service: 'Pet Grooming',
      message: 'New booking request',
      time: '5 minutes ago',
      read: false,
    },
    {
      id: 2,
      type: 'message',
      icon: 'chatbubble',
      iconColor: '#2196F3',
      customerName: 'Michael Chen',
      petName: 'Luna',
      message: 'Sent you a message about appointment time',
      time: '15 minutes ago',
      read: false,
    },
    {
      id: 3,
      type: 'cancelled',
      icon: 'close-circle',
      iconColor: '#FF6B6B',
      customerName: 'Emma Garcia',
      petName: 'Charlie',
      service: 'Veterinary Check-up',
      message: 'Cancelled booking',
      time: '1 hour ago',
      read: false,
    },
    {
      id: 4,
      type: 'booking',
      icon: 'calendar',
      iconColor: '#4CAF50',
      customerName: 'David Martinez',
      petName: 'Whiskers',
      service: 'Pet Boarding',
      message: 'New booking request',
      time: '2 hours ago',
      read: true,
    },
    {
      id: 5,
      type: 'message',
      icon: 'chatbubble',
      iconColor: '#2196F3',
      customerName: 'Lisa Anderson',
      petName: 'Rocky',
      message: 'Asking about boarding availability',
      time: '3 hours ago',
      read: true,
    },
    {
      id: 6,
      type: 'booking',
      icon: 'calendar',
      iconColor: '#4CAF50',
      customerName: 'James Wilson',
      petName: 'Buddy',
      service: 'Pet Delivery',
      message: 'Confirmed booking',
      time: '5 hours ago',
      read: true,
    },
    {
      id: 7,
      type: 'cancelled',
      icon: 'close-circle',
      iconColor: '#FF6B6B',
      customerName: 'Rachel Kim',
      petName: 'Milo',
      service: 'Pet Grooming',
      message: 'Cancelled booking due to schedule conflict',
      time: '1 day ago',
      read: true,
    },
    {
      id: 8,
      type: 'message',
      icon: 'chatbubble',
      iconColor: '#2196F3',
      customerName: 'Tom Brown',
      petName: 'Bella',
      message: 'Thanked you for the excellent service',
      time: '1 day ago',
      read: true,
    },
  ];

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
      router.push('/(bsn)/(tabs)/booking');
    }
  };

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

      <ScrollView contentContainerStyle={styles.content}>
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
});
