import React, { useState } from "react";
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
import { router } from "expo-router";
import { wp, moderateScale, scaleFontSize, isSmallDevice } from "@utils/responsive";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    if (!email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        "Code Sent",
        "A reset code has been sent to your email address.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    }, 1000);
  };

  const handleBackToLogin = () => {
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
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            Fill in your email and we'll send a link to reset your password
          </Text>

          {/* Email input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          {/* Buttons */}
          <TouchableOpacity
            style={styles.sendCodeButton}
            onPress={handleSendCode}
            disabled={isLoading}
          >
            <Text style={styles.sendCodeButtonText}>
              {isLoading ? "Sending..." : "Send Code"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backToLoginButton}
            onPress={handleBackToLogin}
          >
            <Text style={styles.backToLoginButtonText}>Back to Login</Text>
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
  },

  title: {
    fontSize: scaleFontSize(isSmallDevice() ? 35 : 40),
    color: "#1C86FF",
    textAlign: "center",
    marginBottom: moderateScale(8),
    fontFamily: "SFProBold",
  },
  subtitle: {
    fontSize: scaleFontSize(17),
    color: "#333",
    textAlign: "center",
    marginBottom: moderateScale(50),
    lineHeight: moderateScale(20),
  },

  inputGroup: { marginBottom: moderateScale(20) },
  label: {
    fontSize: scaleFontSize(16),
    color: "#333",
    marginBottom: moderateScale(6),
    fontFamily: "SFProSB",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "black",
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    fontSize: scaleFontSize(18),
  },

  sendCodeButton: {
    backgroundColor: "#1C86FF",
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(10),
    alignItems: "center",
    marginBottom: moderateScale(12),
  },
  sendCodeButtonText: {
    color: "#fff",
    fontSize: scaleFontSize(16),
    fontFamily: "SFProReg",
  },

  backToLoginButton: {
    backgroundColor: "#fff",
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(10),
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#000",
  },
  backToLoginButtonText: {
    color: "#000",
    fontSize: scaleFontSize(16),
    fontFamily: "SFProSB",
  },
});
