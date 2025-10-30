// components/BusinessTabNavigator.jsx
import { View, TouchableOpacity, Image, Text, StyleSheet, useWindowDimensions, Keyboard, Platform, Modal } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { moderateScale, scaleFontSize } from "@utils/responsive";
import { useState, useEffect } from "react";
import { useUnreadMessages } from "@_hooks/useUnreadMessages";
import { Ionicons } from '@expo/vector-icons';
import apiClient from '@config/api';

const businessTabs = [
  {
    name: "home",
    route: "/(bsn)/(tabs)/home",
    label: "Home",
    icon: require("@assets/images/service_icon/home icon.png"),
  },
  {
    name: "analytics",
    route: "/(bsn)/(tabs)/analytics",
    label: "Analytics",
    icon: require("@assets/images/service_icon/donut-chart.png"),
  },
  {
    name: "messages",
    route: "/(bsn)/(tabs)/messages",
    label: "Messages",
    icon: require("@assets/images/service_icon/message icon.png"),
    badge: 0, // Unread message count
  },
  {
    name: "my-services",
    route: "/(bsn)/(tabs)/my-services",
    label: "Services",
    icon: require("@assets/images/service_icon/Pet Icon.png"),
  },
  {
    name: "booking",
    route: "/(bsn)/(tabs)/booking",
    label: "Booking",
    icon: require("@assets/images/service_icon/calendar icon.png"),
  },

];

export default function BusinessTabNavigator() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const { totalUnread } = useUnreadMessages();
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  // Determine if screen is very narrow (slim phone)
  const isVeryNarrow = width < 360;
  const isNarrow = width < 400;

  // Check if business profile is complete
  const checkBusinessProfile = async () => {
    try {
      setIsCheckingProfile(true);
      const response = await apiClient.get('/businesses');
      if (response.data && response.data.data && response.data.data.length > 0) {
        const business = response.data.data[0];

        const hasBasicInfo = business.businessName &&
                             business.contactInfo?.email &&
                             business.contactInfo?.phone;

        const hasAddress = business.address?.street &&
                           business.address?.city;

        const isComplete = hasBasicInfo && hasAddress;
        setIsProfileComplete(isComplete);
        return isComplete;
      } else {
        setIsProfileComplete(false);
        return false;
      }
    } catch (error) {
      console.error('Error checking business profile:', error);
      setIsProfileComplete(false);
      return false;
    } finally {
      setIsCheckingProfile(false);
    }
  };

  useEffect(() => {
    checkBusinessProfile();

    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Handle tab navigation with profile check
  const handleTabPress = async (tab) => {
    // Allow navigation if currently on business-info page (profile editing)
    if (pathname.includes('business-info')) {
      router.replace(tab.route);
      return;
    }

    // Re-check profile status before allowing navigation
    const profileComplete = await checkBusinessProfile();

    // Check if profile is complete for all tabs
    if (!profileComplete) {
      setShowWarningModal(true);
      return;
    }

    router.replace(tab.route);
  };

  if (isKeyboardVisible) {
    return null;
  }

  return (
    <View style={styles.container}>
      {businessTabs.map((tab) => {
        const isFocused = pathname.includes(tab.name);
        // Use dynamic unread count for messages tab
        const badgeCount = tab.name === 'messages' ? totalUnread : tab.badge;

        return (
          <TouchableOpacity
            key={tab.name}
            style={[
              styles.tab,
              isFocused && styles.tabActive,
              isVeryNarrow && styles.tabNarrow
            ]}
            onPress={() => handleTabPress(tab)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Image
                source={tab.icon}
                style={[
                  styles.icon,
                  isVeryNarrow && styles.iconSmall,
                  { tintColor: isFocused ? "#1C86FF" : "rgba(255,255,255,0.6)" },
                ]}
              />
              {badgeCount !== undefined && badgeCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.label,
                isNarrow && styles.labelNarrow,
                { color: isFocused ? "#1C86FF" : "rgba(255,255,255,0.6)" },
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* Warning Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showWarningModal}
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Icon Container */}
            <View style={styles.modalIconContainer}>
              <View style={styles.modalIconCircle}>
                <Ionicons
                  name="business-outline"
                  size={moderateScale(48)}
                  color="#1C86FF"
                />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.modalTitle}>Business Profile Required</Text>

            {/* Message */}
            <Text style={styles.modalMessage}>
              Please complete your business profile setup to access other features.
            </Text>

            {/* Single Button */}
            <TouchableOpacity
              style={styles.modalFullWidthButton}
              onPress={() => {
                setShowWarningModal(false);
                router.replace('/(bsn)/(tabs)/profile/business-info');
              }}
            >
              <Text style={styles.modalFullWidthButtonText}>Complete Profile</Text>
              <Ionicons name="arrow-forward" size={moderateScale(20)} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#1C86FF",
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    height: moderateScale(85),
    paddingHorizontal: moderateScale(4),
  },
  tab: {
    alignItems: "center",
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(8),
    borderRadius: moderateScale(12),
    minWidth: moderateScale(60),
    flex: 1,
  },
  tabNarrow: {
    paddingHorizontal: moderateScale(4),
    paddingVertical: moderateScale(8),
    minWidth: moderateScale(50),
  },
  tabActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  icon: {
    width: moderateScale(26),
    height: moderateScale(26),
    resizeMode: "contain",
  },
  iconSmall: {
    width: moderateScale(22),
    height: moderateScale(22),
  },
  label: {
    fontSize: scaleFontSize(12),
    fontWeight: "500",
    marginTop: moderateScale(4),
  },
  labelNarrow: {
    fontSize: scaleFontSize(10),
    marginTop: moderateScale(2),
  },
  iconContainer: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -moderateScale(4),
    right: -moderateScale(8),
    backgroundColor: "#FF3B30",
    borderRadius: moderateScale(10),
    minWidth: moderateScale(18),
    height: moderateScale(18),
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: moderateScale(4),
    borderWidth: 2,
    borderColor: "#1C86FF",
  },
  badgeText: {
    color: "#fff",
    fontSize: scaleFontSize(10),
    fontWeight: "bold",
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
