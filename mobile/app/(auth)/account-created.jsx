import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { wp, hp, moderateScale, scaleFontSize, isSmallDevice } from "@utils/responsive";
import apiClient from "@config/api";

export default function AccountCreatedScreen() {
  const { email } = useLocalSearchParams();
  const [isResending, setIsResending] = useState(false);

  const handleContinueToLogin = () => {
    router.replace("/(auth)/login");
  };

  const handleResendVerification = async () => {
    if (!email) {
      Alert.alert("Error", "Email not found. Please register again.");
      return;
    }

    setIsResending(true);

    try {
      await apiClient.post("/auth/resend-verification", {
        email: email,
      });

      Alert.alert("Success", "Verification email has been resent. Please check your inbox.");
    } catch (error) {
      if (error.response) {
        const errorMessage = error.response.data?.message || "Failed to resend verification email";
        Alert.alert("Error", errorMessage);
      } else if (error.request) {
        Alert.alert("Network Error", "Unable to connect to the server. Please check your internet connection.");
      } else {
        Alert.alert("Error", "An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsResending(false);
    }
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
        <Ionicons name="checkmark-circle" size={moderateScale(120)} color="#1C86FF" style={styles.icon} />


        {/* Title + Subtitle */}
        <Text style={styles.title}>Account Created!</Text>
        <Text style={styles.subtitle}>
          Verify your account through the link sent to{"\n"}
          <Text style={styles.emailText}>{email}</Text>
        </Text>

        {/* Resend Verification */}
        <TouchableOpacity onPress={handleResendVerification} style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the email? </Text>
          <Text style={styles.resendLink}>
            {isResending ? "Sending..." : "Resend"}
          </Text>
        </TouchableOpacity>

        {/* Button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinueToLogin}
          disabled={isResending}
        >
          {isResending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.continueButtonText}>Continue to Login</Text>
          )}
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
    paddingHorizontal: wp(isSmallDevice() ? 10 : 13),
    maxWidth: wp(100),
    alignSelf: "center",
    width: "100%",
  },

  icon: {
    marginBottom: 0,
  },
  title: {
    fontSize: scaleFontSize(isSmallDevice() ? 35 : 40),
    fontFamily: "SFProBold",
    color: "#1C86FF",
    textAlign: "center",
    marginBottom: hp(1),
  },
  subtitle: {
    fontSize: scaleFontSize(18),
    fontFamily: "SFProReg",
    color: "black",
    textAlign: "center",
    marginBottom: hp(2),
    lineHeight: moderateScale(24),
  },
  emailText: {
    fontFamily: "SFProSB",
    color: "#1C86FF",
  },

  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: hp(3),
  },
  resendText: {
    fontSize: scaleFontSize(14),
    color: "#666",
    fontFamily: "SFProReg",
  },
  resendLink: {
    fontSize: scaleFontSize(14),
    color: "#1C86FF",
    fontFamily: "SFProSB",
    textDecorationLine: "underline",
  },

  continueButton: {
    backgroundColor: "#1C86FF",
    paddingVertical: hp(1.5),
    borderRadius: moderateScale(10),
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: hp(5.5),
  },
  continueButtonText: {
    color: "#fff",
    fontSize: scaleFontSize(18),
    fontFamily:"SFProReg"
  },
});
