// mobile/app/components/Header.jsx
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { wp, moderateScale, scaleFontSize } from "@utils/responsive";
import apiClient from "@config/api";

const Header = ({
  title = "",
  showBack = true,
  backgroundColor = "#1C86FF",
  titleColor = "#FFFFFF",
  leftComponent = null,
  rightComponent = null,
  onBackPress = null,
  titleStyle = {},
  customTitle = null,
  showNotificationBadge = false,
  onNotificationPress = null,
}) => {
  const router = useRouter();
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

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      router.push("/(bsn)/(tabs)/profile/notifications");
    }
  };

  return (
    <View style={[styles.header, { backgroundColor, paddingTop: insets.top + moderateScale(10) }]}>
      {/* Left side: Back button or custom component */}
      <View style={styles.side}>
        {showBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackPress || (() => router.back())}
          >
            <Ionicons name="arrow-back" size={moderateScale(28)} color={titleColor} />
          </TouchableOpacity>
        ) : (
          leftComponent
        )}
      </View>

      {/* Title - can be custom component or text */}
      {customTitle || (
        <Text style={[styles.headerTitle, { color: titleColor }, titleStyle]} numberOfLines={1}>
          {title}
        </Text>
      )}

      {/* Right side: Optional icons or actions */}
      <View style={styles.side}>
        {showNotificationBadge ? (
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={handleNotificationPress}
          >
            <Ionicons
              name="notifications-outline"
              size={moderateScale(26)}
              color={titleColor}
            />
            {unreadCount > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          rightComponent
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(20),
    paddingBottom: moderateScale(20),
    gap: moderateScale(13),
    borderBottomLeftRadius: moderateScale(20),
    borderBottomRightRadius: moderateScale(20),
  },
  backButton: { padding: moderateScale(5) },
  headerTitle: {
    fontSize: scaleFontSize(24),
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  side: {
    width: moderateScale(45),
    alignItems: "center",
    justifyContent: "center",
  },
  notificationButton: {
    padding: moderateScale(8),
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

export default Header;
