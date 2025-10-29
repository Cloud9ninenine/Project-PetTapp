// components/BusinessTabNavigator.jsx
import { View, TouchableOpacity, Image, Text, StyleSheet, useWindowDimensions, Keyboard, Platform } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { moderateScale, scaleFontSize } from "@utils/responsive";
import { useState, useEffect } from "react";
import { useUnreadMessages } from "@_hooks/useUnreadMessages";

const businessTabs = [
  {
    name: "home",
    route: "/(bsn)/(tabs)/home",
    label: "Home",
    icon: require("@assets/images/service_icon/home icon.png"),
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
  {
    name: "profile",
    route: "/(bsn)/(tabs)/profile",
    label: "Profile",
    icon: require("@assets/images/service_icon/user icon.png"),
  },
];

export default function BusinessTabNavigator() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const { totalUnread } = useUnreadMessages();

  // Determine if screen is very narrow (slim phone)
  const isVeryNarrow = width < 360;
  const isNarrow = width < 400;

  useEffect(() => {
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
            onPress={() => router.replace(tab.route)}
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
});
