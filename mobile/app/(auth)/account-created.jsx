import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function AccountCreatedScreen() {
  const handleContinueToLogin = () => {
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Background with paw pattern */}
      <ImageBackground
        source={require("@assets/images/PetTapp pattern.png")}
        style={styles.backgroundimg}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="repeat"
      />

      <View style={styles.content}>
        {/* Checkmark */}
        <Ionicons name="checkmark-circle" size={120} color="#1C86FF" style={styles.icon} />


        {/* Title + Subtitle */}
        <Text style={styles.title}>Account Created!</Text>
        <Text style={styles.subtitle}>
          Verify your account through the link sent to your email.
        </Text>

        {/* Button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinueToLogin}
        >
          <Text style={styles.continueButtonText}>Continue to Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backgroundimg: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.5 }],
  },
  backgroundImageStyle: {
    opacity: 0.1,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 50,
  },

  icon: {
    marginBottom: 0,
  },
  title: {
    fontSize: 40,
    fontFamily: "SFProBold",
    color: "#1C86FF",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: "SFProReg",
    color: "black",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
  },

  continueButton: {
    backgroundColor: "#1C86FF",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily:"SFProReg"
  },
});
