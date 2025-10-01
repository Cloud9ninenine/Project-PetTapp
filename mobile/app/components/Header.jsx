// mobile/app/components/Header.jsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { wp, moderateScale, scaleFontSize } from "@utils/responsive";

const Header = ({
  title = "",
  showBack = true,
  backgroundColor = "#1C86FF ",
  titleColor = "#FFFFFF",
  leftComponent = null,
  rightComponent = null,
  onBackPress = null,
  titleStyle = {},
  customTitle = null,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { backgroundColor, paddingTop: insets.top + moderateScale(10) }]}>
      {/* Left side: Back button or custom component */}
      <View style={styles.side}>
        {showBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackPress || (() => router.back())}
          >
            <Ionicons name="arrow-back" size={moderateScale(28)} color={titleColor} />
          </TouchableOpacity>
        ) : (
          leftComponent
        )}
      </View>

      {/* Title - can be custom component or text */}
      {customTitle || (
        <Text style={[styles.headerTitle, { color: titleColor }, titleStyle]} numberOfLines={1}>
          {title}
        </Text>
      )}

      {/* Right side: Optional icons or actions */}
      <View style={styles.side}>{rightComponent}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(20),
    paddingBottom: moderateScale(20),
    gap: moderateScale(13),
    borderBottomLeftRadius: moderateScale(20),
    borderBottomRightRadius: moderateScale(20),
  },
  backButton: { padding: moderateScale(5) },
  headerTitle: {
    fontSize: scaleFontSize(24),
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  side: {
    width: moderateScale(45),
    alignItems: "center",
    justifyContent: "center",
  },
});

export default Header;
