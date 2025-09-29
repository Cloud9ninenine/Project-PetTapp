import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ImageBackground,
} from "react-native";
import { router } from "expo-router";

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
    opacity: 0.1, // 🔹 faint paw prints
  },

  keyboardView: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 50,
  },

  title: {
    fontSize: 40,
    color: "#1C86FF",
    textAlign: "center",
    marginBottom: 8,
    fontFamily: "SFProBold",
  },
  subtitle: {
    fontSize: 19,
    color: "#333",
    textAlign: "center",
    marginBottom: 50,
    lineHeight: 20,
  },

  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 18,
    color: "#333",
    marginBottom: 6,
    fontFamily: "SFProSB",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "black",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
  },

  sendCodeButton: {
    backgroundColor: "#1C86FF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  sendCodeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "SFProReg",
  },

  backToLoginButton: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#000",
  },
  backToLoginButtonText: {
    color: "#000",
    fontSize: 16,
    fontFamily: "SFProSB",
  },
});
