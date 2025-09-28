// mobile/app/components/Header.jsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const Header = ({
  title = "",
  showBack = true,
  backgroundColor = "#2196F3",
  titleColor = "#FFFFFF",
  leftComponent = null,
  rightComponent = null,
  onBackPress = null,
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
            <Ionicons name="arrow-back" size={24} color={titleColor} />
          </TouchableOpacity>
        ) : (
          leftComponent
        )}
      </View>

      {/* Title */}
      <Text style={[styles.headerTitle, { color: titleColor }]} numberOfLines={1}>
        {title}
      </Text>

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
    height: 100, // 🔑 uniform across app
    paddingHorizontal: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: { padding: 5 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  side: {
    width: 40, // keeps spacing uniform left & right
    alignItems: "center",
    justifyContent: "center",
  },
});

export default Header;
