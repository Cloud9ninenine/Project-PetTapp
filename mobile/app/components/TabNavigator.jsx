// components/FooterTabs.jsx
import { View, TouchableOpacity, Image, Text, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";

const tabs = [
  {
    name: "home",
    route: "/(user)/(tabs)/home",
    label: "Home",
    icon: require("@assets/images/service_icon/home icon.png"),
  },
  {
    name: "messages",
    route: "/(user)/(tabs)/messages",
    label: "Messages",
    icon: require("@assets/images/service_icon/message icon.png"),
  },
  {
    name: "my-pets",
    route: "/(user)/(tabs)/my-pets",
    label: "My Pets",
    icon: require("@assets/images/service_icon/Pet Icon.png"),
  },
  {
    name: "booking",
    route: "/(user)/(tabs)/booking",
    label: "Booking",
    icon: require("@assets/images/service_icon/calendar icon.png"),
  },
  {
    name: "profile",
    route: "/(user)/(tabs)/profile",
    label: "Profile",
    icon: require("@assets/images/service_icon/user icon.png"),
  },
];

export default function FooterTabs() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isFocused = pathname.includes(tab.name);

        return (
          <TouchableOpacity
            key={tab.name}
            style={[
              styles.tab,
              isFocused && styles.tabActive
            ]}
            onPress={() => router.replace(tab.route)}
            activeOpacity={0.7}
          >
            <Image
              source={tab.icon}
              style={[
                styles.icon,
                { tintColor: isFocused ? "#1C86FF" : "rgba(255,255,255,0.6)" },
              ]}
            />
            <Text
              style={[
                styles.label,
                { color: isFocused ? "#1C86FF" : "rgba(255,255,255,0.6)" },
              ]}
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: 85,
    paddingHorizontal: 10,
  },
  tab: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 75,
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
    width: 26,
    height: 26,
    resizeMode: "contain",
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
});
