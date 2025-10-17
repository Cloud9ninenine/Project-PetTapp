// mobile/app/components/BusinessHeader.jsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { wp, moderateScale, scaleFontSize } from "@utils/responsive";

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

  const handleLogoPress = () => {
    router.push("/(bsn)/(tabs)/profile");
  };

  // Determine which logo to display
  const logoSource = businessLogo || profileImageSource;

  return (
    <View style={[styles.header, { backgroundColor, paddingTop: insets.top + moderateScale(10) }]}>
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
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: wp(5),
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
  },
});

export default BusinessHeader;
