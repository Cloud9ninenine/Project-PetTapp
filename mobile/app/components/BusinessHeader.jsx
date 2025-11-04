// mobile/app/components/BusinessHeader.jsx
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { wp, moderateScale, scaleFontSize } from "@utils/responsive";
import { useNotificationCount } from "@utils/useNotificationCount";
import { performCompleteLogout } from '@utils/logoutHelper';
import apiClient from '@config/api';

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
  const [showDropdown, setShowDropdown] = useState(false);
  const [greeting, setGreeting] = useState("Good Day");

  // Use custom hook for notification count
  const { unreadCount } = useNotificationCount(showNotificationBadge);

  // Get time-based greeting
  useEffect(() => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return "Good Morning";
      if (hour < 17) return "Good Afternoon";
      return "Good Evening";
    };
    setGreeting(getGreeting());
  }, []);

  const handleLogoPress = () => {
    setShowDropdown(!showDropdown);
  };

  const handleProfileMenuPress = () => {
    setShowDropdown(false);
    router.push('/(bsn)/(tabs)/profile');
  };

  const handleNotificationPress = () => {
    setShowDropdown(false);
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      router.push("/(bsn)/(tabs)/profile/notifications");
    }
  };

  const handleLogoutPress = async () => {
    setShowDropdown(false);
    try {
      // Call backend logout API
      try {
        await apiClient.post('/auth/logout');
      } catch (apiError) {
        console.error('Backend logout error:', apiError);
        // Continue with local cleanup even if backend fails
      }

      // Clear all local data
      await performCompleteLogout();

      // Navigate to login screen
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigate to login even if there's an error
      router.replace('/(auth)/login');
    }
  };

  // Determine which logo to display
  const logoSource = businessLogo || profileImageSource;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.header, { paddingTop: insets.top + moderateScale(15) }]}>
        {customTitle ? (
          customTitle
        ) : (
          <View style={styles.headerContent}>
            {/* Left side: Greeting and Business Info */}
            <View style={styles.headerLeft}>
              <View style={styles.greetingContainer}>
                <Text style={[styles.greetingText, { color: titleColor }]}>
                  {greeting} 👋
                </Text>
                <Text style={[styles.businessNameText, { color: titleColor }]} numberOfLines={1} ellipsizeMode="tail">
                  {businessName}
                </Text>
              </View>
            </View>

            {/* Right side: Business logo/profile button */}
            <TouchableOpacity
              style={styles.logoButton}
              onPress={handleLogoPress}
              activeOpacity={0.8}
            >
              <View style={styles.logoWrapper}>
                {logoSource ? (
                  <Image
                    source={{ uri: logoSource }}
                    style={styles.logoImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Ionicons name="storefront" size={moderateScale(26)} color="#1C86FF" />
                  </View>
                )}
                {showNotificationBadge && unreadCount > 0 && (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Dropdown Menu */}
      {showDropdown && (
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={handleProfileMenuPress}
            activeOpacity={0.7}
          >
            <Ionicons name="person-outline" size={moderateScale(20)} color="#333" />
            <Text style={styles.dropdownText}>Profile</Text>
          </TouchableOpacity>

          <View style={styles.dropdownDivider} />

          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={handleNotificationPress}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={moderateScale(20)} color="#333" />
            <Text style={styles.dropdownText}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.dropdownBadge}>
                <Text style={styles.dropdownBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.dropdownDivider} />

          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={handleLogoutPress}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={moderateScale(20)} color="#FF3B30" />
            <Text style={[styles.dropdownText, { color: '#FF3B30' }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 1000,
    elevation: 10,
  },
  header: {
    backgroundColor: '#1C86FF',
    paddingHorizontal: wp(5),
    paddingBottom: moderateScale(20),
    borderBottomLeftRadius: moderateScale(25),
    borderBottomRightRadius: moderateScale(25),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flex: 1,
    marginRight: moderateScale(12),
  },
  greetingContainer: {
    justifyContent: "center",
  },
  greetingText: {
    fontSize: scaleFontSize(15),
    fontFamily: "SFProReg",
    marginBottom: moderateScale(2),
    opacity: 0.95,
    letterSpacing: 0.3,
  },
  businessNameText: {
    fontSize: scaleFontSize(22),
    fontWeight: "bold",
    fontFamily: "SFProBold",
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  logoButton: {
    position: 'relative',
  },
  logoWrapper: {
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  logoImage: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(26),
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#fff',
  },
  logoPlaceholder: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(26),
    backgroundColor: '#fff',
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: '#fff',
  },
  badgeContainer: {
    position: 'absolute',
    top: moderateScale(-2),
    right: moderateScale(-2),
    backgroundColor: '#FF3B30',
    borderRadius: moderateScale(12),
    minWidth: moderateScale(22),
    height: moderateScale(22),
    paddingHorizontal: moderateScale(6),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: scaleFontSize(10),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dropdownContainer: {
    position: 'absolute',
    top: moderateScale(90),
    right: wp(5),
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    marginTop: moderateScale(5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 999,
    overflow: 'hidden',
    minWidth: wp(50),
    maxWidth: wp(68),
    width: 'auto',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(14),
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#333',
    marginLeft: moderateScale(12),
    flex: 1,
    flexShrink: 1,
    letterSpacing: 0.2,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: moderateScale(14),
  },
  dropdownBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: moderateScale(12),
    minWidth: moderateScale(22),
    height: moderateScale(22),
    paddingHorizontal: moderateScale(6),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: moderateScale(8),
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  dropdownBadgeText: {
    color: '#fff',
    fontSize: scaleFontSize(10),
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default BusinessHeader;
