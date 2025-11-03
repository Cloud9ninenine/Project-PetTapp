// app/_layout.jsx
import { Stack } from "expo-router";
import { usePathname } from "expo-router";
import { View, StyleSheet } from "react-native";
import BusinessTabNavigator from "@components/BusinessTabNavigator";

export default function RootLayout() {
  const pathname = usePathname();

  // Screens where you don't want the footer
  const hideFooterOn = [
    "/home/service-details",
    "/(bsn)/(tabs)/messages/chat",
    "AppointmentDetails"
  ];

  const shouldHideFooter = hideFooterOn.some((path) =>
    pathname.includes(path) || pathname.includes('/messages/chat')
  );

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false, // 🔑 hides that ugly back header
        }}
      />
      {!shouldHideFooter && <BusinessTabNavigator />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
