import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '@components/Header';
import CompleteProfileModal from "@components/CompleteProfileModal";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from "../../../config/api";
import { useProfileCompletion } from "../../../_hooks/useProfileCompletion";

export default function NotificationsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [showProfileIncompleteModal, setShowProfileIncompleteModal] = useState(false);
  const { isProfileComplete } = useProfileCompletion();

  // Mock notifications data
  const notifications = [
    {
      id: '1',
      type: 'booking',
      icon: 'calendar',
      iconColor: '#4CAF50',
      iconBg: '#E8F5E9',
      title: 'Booking Confirmed',
      message: 'Your appointment with Animed Veterinary Clinic has been confirmed for Dec 15, 2024 at 2:00 PM',
      time: '2 hours ago',
      read: false,
    },
    {
      id: '2',
      type: 'reminder',
      icon: 'alarm',
      iconColor: '#FF9B79',
      iconBg: '#FFF3E0',
      title: 'Appointment Reminder',
      message: 'Your pet grooming appointment is tomorrow at 10:00 AM',
      time: '5 hours ago',
      read: false,
    },
    {
      id: '3',
      type: 'message',
      icon: 'chatbubble',
      iconColor: '#1C86FF',
      iconBg: '#E3F2FD',
      title: 'New Message',
      message: 'Vetfusion Animal Clinic sent you a message',
      time: '1 day ago',
      read: true,
    },
    {
      id: '4',
      type: 'promo',
      icon: 'pricetag',
      iconColor: '#9C27B0',
      iconBg: '#F3E5F5',
      title: 'Special Offer',
      message: 'Get 20% off on your next grooming service. Valid until Dec 31.',
      time: '2 days ago',
      read: true,
    },
    {
      id: '5',
      type: 'booking',
      icon: 'checkmark-circle',
      iconColor: '#4CAF50',
      iconBg: '#E8F5E9',
      title: 'Service Completed',
      message: 'Your pet boarding service has been completed. Rate your experience!',
      time: '3 days ago',
      read: true,
    },
    {
      id: '6',
      type: 'update',
      icon: 'information-circle',
      iconColor: '#FF5722',
      iconBg: '#FBE9E7',
      title: 'Profile Update',
      message: 'Your profile information has been successfully updated',
      time: '1 week ago',
      read: true,
    },
  ];

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
  
});
