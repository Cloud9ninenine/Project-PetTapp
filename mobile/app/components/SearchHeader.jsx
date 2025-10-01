// app/components/SearchHeader.jsx
import React from "react";
import { View, TextInput, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hp, wp, moderateScale, scaleFontSize } from "@utils/responsive";

export default function SearchHeader({ searchQuery, setSearchQuery }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + moderateScale(15) }]}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={moderateScale(20)} color="#A0AEC0" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#A0AEC0"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Notification bell */}
      <TouchableOpacity style={styles.bellContainer}>
        <Ionicons name="notifications-outline" size={moderateScale(22)} color="#1E90FF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1E90FF", // Blue background
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(5),
    paddingBottom: moderateScale(15),
    borderBottomRightRadius: moderateScale(10),
    borderBottomLeftRadius: moderateScale(10),
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(15),
    marginRight: moderateScale(10),
    height: moderateScale(50),
  },
  searchInput: {
    flex: 1,
    marginLeft: moderateScale(8),
    fontSize: scaleFontSize(16),
    color: "#000",
  },
  bellContainer: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(20),
    padding: moderateScale(8),
    justifyContent: "center",
    alignItems: "center",
  },
});
