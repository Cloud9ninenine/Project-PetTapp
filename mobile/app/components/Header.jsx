// mobile/app/components/Header.jsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

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

  return (
    <View style={[styles.header, { backgroundColor }]}>
      {/* Left side: Back button or custom component */}
      <View style={styles.side}>
        {showBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackPress || (() => router.back())}
          >
            <Ionicons name="arrow-back" size={28} color={titleColor} />
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
    height: 110,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 20,
    paddingTop: 50,
    gap: 13,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: { padding: 5 },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  side: {
    width: 45,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default Header;
