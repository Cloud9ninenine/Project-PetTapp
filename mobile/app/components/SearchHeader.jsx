// app/components/SearchHeader.jsx
import React, { useState, useEffect } from "react";
import { View, TextInput, StyleSheet, TouchableOpacity, Platform, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hp, wp, moderateScale, scaleFontSize } from "@utils/responsive";
import apiClient from "@config/api";

export default function SearchHeader({ searchQuery, setSearchQuery, onNotifPress, showNotificationBadge = true }) {
  const insets = useSafeAreaInsets();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        // Fetch recent bookings from last 24 hours
        const response = await apiClient.get('/bookings', {
          params: {
            page: 1,
            limit: 50,
            sort: '-createdAt',
          }
        });

        if (response.data && response.data.success) {
          const bookings = response.data.data || [];
          // Count bookings created in the last 24 hours
          const recent = bookings.filter(booking => {
            const createdAt = new Date(booking.createdAt || booking.appointmentDateTime);
            const now = new Date();
            return (now - createdAt) < 24 * 60 * 60 * 1000;
          });
          setUnreadCount(recent.length);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    if (showNotificationBadge) {
      fetchUnreadCount();
      // Refresh count every 5 minutes
      const interval = setInterval(fetchUnreadCount, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [showNotificationBadge]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + moderateScale(15) }]}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={moderateScale(20)} color="#A0AEC0" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#A0AEC0"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Notification bell */}
      <TouchableOpacity style={styles.bellContainer} onPress={onNotifPress}>
        <Ionicons name="notifications-outline" size={moderateScale(22)} color="#1E90FF" />
        {showNotificationBadge && unreadCount > 0 && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1E90FF", // Blue background
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(5),
    paddingBottom: moderateScale(15),
    borderBottomRightRadius: moderateScale(10),
    borderBottomLeftRadius: moderateScale(10),
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(15),
    marginRight: moderateScale(10),
    height: moderateScale(50),
  },
  searchInput: {
    flex: 1,
    marginLeft: moderateScale(8),
    fontSize: scaleFontSize(16),
    color: "#000",
  },
  bellContainer: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(20),
    padding: moderateScale(8),
    justifyContent: "center",
    alignItems: "center",
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: moderateScale(4),
    right: moderateScale(4),
    backgroundColor: '#FF6B6B',
    borderRadius: moderateScale(10),
    minWidth: moderateScale(18),
    height: moderateScale(18),
    paddingHorizontal: moderateScale(4),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: scaleFontSize(10),
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
