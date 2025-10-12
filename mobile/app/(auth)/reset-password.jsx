import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ImageBackground,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { wp, hp, moderateScale, scaleFontSize, isSmallDevice } from "@utils/responsive";
import apiClient from "@config/api";

export default function ResetPasswordScreen() {
  const { email } = useLocalSearchParams();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Auto-focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleOtpChange = (value, index) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      Alert.alert("Error", "Please enter the complete 6-digit OTP");
      return;
    }

    if (!email) {
      Alert.alert("Error", "Email not found. Please go back and try again.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post("/auth/reset-password", {
        email: email,
        otp: otpCode,
      });

      setIsLoading(false);
      Alert.alert(
        "Success",
        "Your password has been reset successfully. Check your email for your new password.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/login"),
          },
        ]
      );
    } catch (error) {
      setIsLoading(false);

      if (error.response) {
        const errorMessage = error.response.data?.message || "Failed to verify OTP";
        Alert.alert("Error", errorMessage);
      } else if (error.request) {
        Alert.alert("Network Error", "Unable to connect to the server. Please check your internet connection.");
      } else {
        Alert.alert("Error", "An unexpected error occurred. Please try again.");
      }
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      Alert.alert("Error", "Email not found. Please go back and try again.");
      return;
    }

    try {
      await apiClient.post("/auth/forgot-password", {
        email: email,
      });

      Alert.alert("Success", "A new OTP has been sent to your email address.");
      // Clear the OTP inputs
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error) {
      if (error.response) {
        const errorMessage = error.response.data?.message || "Failed to resend OTP";
        Alert.alert("Error", errorMessage);
      } else {
        Alert.alert("Error", "Failed to resend OTP. Please try again.");
      }
    }
  };

  const handleBackToForgotPassword = () => {
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={require("@assets/images/PetTapp pattern.png")}
        style={styles.backgroundimg}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="repeat"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{"\n"}
            <Text style={styles.emailText}>{email}</Text>
          </Text>

          {/* OTP Input */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={styles.otpInput}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Resend OTP */}
          <TouchableOpacity onPress={handleResendOtp} style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            <Text style={styles.resendLink}>Resend OTP</Text>
          </TouchableOpacity>

          {/* Buttons */}
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={handleVerifyOtp}
            disabled={isLoading}
          >
            <Text style={styles.verifyButtonText}>
              {isLoading ? "Verifying..." : "Verify & Reset Password"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToForgotPassword}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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

  keyboardView: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: wp(isSmallDevice() ? 10 : 13),
    maxWidth: wp(100),
    alignSelf: "center",
    width: "100%",
  },

  title: {
    fontSize: scaleFontSize(isSmallDevice() ? 35 : 40),
    color: "#1C86FF",
    textAlign: "center",
    marginBottom: hp(1),
    fontFamily: "SFProBold",
  },
  subtitle: {
    fontSize: scaleFontSize(17),
    color: "#333",
    textAlign: "center",
    marginBottom: hp(4),
    lineHeight: scaleFontSize(22),
    paddingHorizontal: wp(5),
  },
  emailText: {
    fontFamily: "SFProSB",
    color: "#1C86FF",
  },

  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: hp(3),
    gap: wp(2),
  },
  otpInput: {
    width: wp(12),
    height: hp(7),
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "black",
    borderRadius: moderateScale(8),
    fontSize: scaleFontSize(24),
    textAlign: "center",
    fontFamily: "SFProSB",
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

  verifyButton: {
    backgroundColor: "#1C86FF",
    paddingVertical: hp(1.5),
    borderRadius: moderateScale(10),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: hp(1.5),
    width: "100%",
    minHeight: hp(5.5),
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: scaleFontSize(16),
    fontFamily: "SFProReg",
  },

  backButton: {
    backgroundColor: "#fff",
    paddingVertical: hp(1.5),
    borderRadius: moderateScale(10),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#000",
    width: "100%",
    minHeight: hp(5.5),
  },
  backButtonText: {
    color: "#000",
    fontSize: scaleFontSize(16),
    fontFamily: "SFProSB",
  },
});
