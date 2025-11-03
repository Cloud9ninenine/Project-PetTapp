// app/_layout.jsx
import { Stack } from "expo-router";
import { usePathname } from "expo-router";
import { View, StyleSheet } from "react-native";
import TabNavigator from "@components/TabNavigator";

export default function RootLayout() {
  const pathname = usePathname();

  // Screens where you don't want the footer
  const hideFooterOn = [
    "/home/service-details",
    "/home/nearby-service-map",
    "/home/service-scheduled",
    "/home/schedule-booking",
    "/booking/review-service",
    "/booking/payment-qr",
    "/booking/ScheduleDetail",
    "/notification",
    "/(user)/(tabs)/messages/chat"
  ];

  const shouldHideFooter = hideFooterOn.some((path) =>
    pathname.startsWith(path) || pathname.includes('/messages/chat')
  );

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false, // 🔑 hides that ugly back header
        }}
      />
      {!shouldHideFooter && <TabNavigator />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
