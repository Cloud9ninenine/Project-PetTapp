// mobile/app/components/BusinessHeader.jsx
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { wp, moderateScale, scaleFontSize } from "@utils/responsive";
import apiClient from "@config/api";
import AsyncStorage from '@react-native-async-storage/async-storage';

const BusinessHeader = ({
  businessName = "Business Dashboard",
  businessLogo = null,
  onNotificationPress = null,
  showProfileImage = true,
  profileImageSource = null,
  backgroundColor = "#1C86FF",
  titleColor = "#fff",
  customTitle = null,
  showBack = false,
  showNotificationBadge = true,
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

  const handleLogoPress = () => {
    router.push("/(bsn)/(tabs)/profile");
  };

  // Determine which logo to display
  const logoSource = businessLogo || profileImageSource;

  return (
    <View style={[styles.header, { backgroundColor, paddingTop: insets.top + moderateScale(20) }]}>
      {customTitle ? (
        customTitle
      ) : (
        <View style={styles.headerContent}>
          {/* Left side: Profile image and business info */}
          <View style={styles.headerLeft}>
            {showProfileImage && (
              <TouchableOpacity style={styles.profileImageContainer} onPress={handleLogoPress}>
                {logoSource ? (
                  <Image
                    source={{ uri: logoSource }}
                    style={styles.profileImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.profilePlaceholder}>
                    <Ionicons name="storefront" size={moderateScale(24)} color="#1C86FF" />
                  </View>
                )}
              </TouchableOpacity>
            )}

            <View style={styles.headerTextContainer}>
              <Text style={[styles.welcomeText, { color: titleColor }]}>Welcome Back!</Text>
              <Text style={[styles.businessNameText, { color: titleColor }]} numberOfLines={1} ellipsizeMode="tail">
                {businessName}
              </Text>
            </View>
          </View>

          {/* Right side: Notification button */}
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={handleNotificationPress}
          >
            <Ionicons
              name="notifications-outline"
              size={moderateScale(26)}
              color={titleColor}
            />
            {showNotificationBadge && unreadCount > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: wp(5),
    paddingBottom: moderateScale(25),
    borderBottomLeftRadius: moderateScale(20),
    borderBottomRightRadius: moderateScale(20),
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: moderateScale(16),
  },
  profileImageContainer: {
    marginRight: moderateScale(12),
  },
  profileImage: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
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
    flex: 1,
    justifyContent: "center",
  },
  welcomeText: {
    fontSize: scaleFontSize(14),
    fontFamily: "SFProReg",
    textAlign: "center",
  },
  businessNameText: {
    fontSize: scaleFontSize(18),
    fontWeight: "bold",
    fontFamily: "SFProBold",
  },
  notificationButton: {
    padding: moderateScale(8),
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: moderateScale(20),
    width: moderateScale(44),
    height: moderateScale(44),
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    top: moderateScale(0),
    right: moderateScale(0),
    backgroundColor: '#FF3B30',
    borderRadius: moderateScale(10),
    minWidth: moderateScale(20),
    height: moderateScale(20),
    paddingHorizontal: moderateScale(5),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1C86FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: scaleFontSize(10),
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default BusinessHeader;
