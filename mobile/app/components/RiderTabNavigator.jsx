import { View, TouchableOpacity, Text, StyleSheet, useWindowDimensions } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { moderateScale, scaleFontSize } from "@utils/responsive";

const riderTabs = [
  {
    name: "home",
    route: "/(rider)/(tabs)/home",
    label: "Home",
    icon: "home",
  },
  {
    name: "deliveries",
    route: "/(rider)/(tabs)/deliveries",
    label: "Deliveries",
    icon: "bicycle",
  },
  {
    name: "earnings",
    route: "/(rider)/(tabs)/earnings",
    label: "Earnings",
    icon: "wallet",
  },
  {
    name: "profile",
    route: "/(rider)/(tabs)/profile",
    label: "Profile",
    icon: "person",
  },
];

export default function RiderTabNavigator() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();

  const isVeryNarrow = width < 360;
  const isNarrow = width < 400;

  return (
    <View style={styles.container}>
      {riderTabs.map((tab) => {
        const isFocused = pathname.includes(tab.name);

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
            <Ionicons
              name={tab.icon}
              size={isVeryNarrow ? moderateScale(22) : moderateScale(26)}
              color={isFocused ? "#FF6B35" : "rgba(255,255,255,0.6)"}
            />
            <Text
              style={[
                styles.label,
                isNarrow && styles.labelNarrow,
                { color: isFocused ? "#FF6B35" : "rgba(255,255,255,0.6)" },
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
    backgroundColor: "#FF6B35",
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
  label: {
    fontSize: scaleFontSize(12),
    fontWeight: "500",
    marginTop: moderateScale(4),
  },
  labelNarrow: {
    fontSize: scaleFontSize(10),
    marginTop: moderateScale(2),
  },
});
