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
  Image,
  ImageBackground,
} from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      // 🟢 Fake condition: if email contains "new", go to setup
      if (email.includes("new")) {
        router.replace("/(auth)/initial-setup");
      } else {
        router.replace("/(user)/(tabs)/home");
      }
    }, 1000);
  };

  const handleForgotPassword = () => {
    router.push("/(auth)/forgot-password");
  };

  const handleSocialLogin = (provider) => {
    Alert.alert("Social Login", `${provider} login coming soon!`);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Background Layer */}
      <ImageBackground
        source={require("@assets/images/PetTapp pattern.png")}
        style={styles.backgroundimg}
        imageStyle={styles.backgroundImageStyle} // <-- important
        resizeMode="repeat"
      />
        {/* Foreground Content */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            {/* Logo & Title */}
            <View style={styles.header}>
              <Image
                source={require("@assets/images/PetTappLogoInverted.png")}
                style={styles.logo}
              />
              <Text style={styles.title}>Login</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Text style={styles.label}>
                Username / Email
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>
                Password
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!isPasswordVisible}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                  <Ionicons
                    name={isPasswordVisible ? "eye" : "eye-off"}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={handleForgotPassword}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? "Logging in..." : "Login"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.signupButton}
                onPress={() => router.push("/(auth)/signup")}
              >
                <Text style={styles.signupButtonText}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Social Login */}
            <View style={styles.socialLogin}>
              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.orContinueWith}>or continue with</Text>
                <View style={styles.divider} />
              </View>

              <View style={styles.socialButtons}>
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialLogin("Google")}
                >
                  <Ionicons name="logo-google" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialLogin("Facebook")}
                >
                  <Ionicons name="logo-facebook" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialLogin("Apple")}
                >
                  <Ionicons name="logo-apple" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backgroundimg: {
      ...StyleSheet.absoluteFillObject, // fills screen
  transform: [{ scale: 1.5 }],     // light zoom
  },

  backgroundImageStyle: {
    opacity: 0.1, // only background fades, not content
  },

  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 50,
  },
  header: {
    alignItems: "center",
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: -75, 
  },
  title: {
    fontSize: 50,
    color: "#1C86FF",
    marginTop: 2, // smaller gap
    fontFamily: "SFProBold",
  },
  label: {
    fontSize: 20,
    color: "#000",
    marginBottom: 6,
    fontFamily: "SFProSB"
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
    marginBottom: 16,
    fontFamily:"SFProReg"
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 12,
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
    fontFamily:"SFProReg"
  },
  eyeButton: {
    padding: 20,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 10,
  },
  forgotPasswordText: {
    color: "Black",
    fontSize: 13,
    fontFamily: "SFProReg",
    textDecorationLine: 'underline',
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  loginButton: {
    flex: 1,
    backgroundColor: "#1C86FF",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "SFProReg",
  },
  signupButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#1C86FF",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  signupButtonText: {
    color: "#1C86FF",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "SFProReg",
  },
  socialLogin: {
    alignItems: "center",
  },
  // --- Divider row
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1.2,
    backgroundColor: "black",

  },
  orContinueWith: {
    fontSize: 13,
    color: "black",
    fontFamily: "SFProMedium",
    marginHorizontal: 14,
  },
  socialButtons: {
    flexDirection: "row",
    gap: 16,
  },
  socialButton: {
    width: 50,
    height: 50,
    backgroundColor: "#000",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});
