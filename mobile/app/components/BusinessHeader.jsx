// mobile/app/components/BusinessHeader.jsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { wp, moderateScale, scaleFontSize } from "@utils/responsive";

const BusinessHeader = ({
  businessName = "Business Dashboard",
  onNotificationPress = null,
  showProfileImage = true,
  profileImageSource = null,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      router.push("/(bsn)/(tabs)/profile/notifications");
    }
  };

  return (
    <View style={[styles.header, { paddingTop: insets.top + moderateScale(10) }]}>
      <View style={styles.headerContent}>
        {/* Left side: Profile image and business info */}
        <View style={styles.headerLeft}>
          {showProfileImage && (
            <TouchableOpacity style={styles.profileImageContainer}>
              <View style={styles.profilePlaceholder}>
                <Ionicons name="storefront" size={moderateScale(24)} color="#1C86FF" />
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.headerTextContainer}>
            <Text style={styles.welcomeText}>Welcome Back!</Text>
            <Text style={styles.businessNameText} numberOfLines={1}>
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
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#1C86FF",
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(20),
    paddingBottom: moderateScale(20),
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
    fontSize: scaleFontSize(12),
    color: "#fff",
    fontFamily: "SFProReg",
  },
  businessNameText: {
    fontSize: scaleFontSize(16),
    fontWeight: "bold",
    color: "#fff",
    fontFamily: "SFProBold",
  },
  notificationButton: {
    padding: moderateScale(8),
  },
});

export default BusinessHeader;
