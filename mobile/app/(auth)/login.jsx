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
  Image,
  ImageBackground,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { wp, hp, moderateScale, scaleFontSize, isSmallDevice } from "@utils/responsive";
import apiClient from "../config/api";

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

  try {
    // Step 1: Login to verify credentials
    const loginResponse = await apiClient.post('/auth/login', {
      email: email.trim(),
      password: password,
    });

    if (loginResponse.status === 200 && loginResponse.data?.tokens) {
      const { user, tokens } = loginResponse.data;
      const { accessToken, refreshToken } = tokens;

      // Store tokens
      try {
        await AsyncStorage.multiSet([
          ['accessToken', accessToken],
          ['refreshToken', refreshToken],
        ]);
        console.log('Access and refresh tokens stored successfully');
      } catch (storageError) {
        console.error('AsyncStorage error:', storageError);
        Alert.alert("Warning", "Token saved but storage issue detected.");
      }

      // Step 2: Get user info (optional since you already have user data)
      console.log('User data:', user);

      // Navigate based on role
      const role = user.role;
      if (role === "business-owner") {
        router.replace("/(bsn)/(tabs)/home");
      } else if (role === "pet-owner") {
        router.replace("/(user)/(tabs)/home");
      } else {
        Alert.alert("Error", `Unknown user role: ${role}. Please contact support.`);
      }
    } else {
      Alert.alert("Error", "Invalid login response from server.");
    }
    } catch (error) {
      console.error('Login error:', error);

      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 401) {
          Alert.alert("Login Failed", data?.message || "Invalid email or password.");
        } else if (status === 404) {
          Alert.alert("Login Failed", "User not found. Please check your email or sign up.");
        } else if (status === 422) {
          Alert.alert("Validation Error", data?.message || "Please check your input and try again.");
        } else {
          Alert.alert("Login Failed", data?.message || "An error occurred during login.");
        }
      } else if (error.request) {
        Alert.alert("Network Error", "Please check your connection and try again.");
      } else {
        Alert.alert("Error", "An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push("/(auth)/forgot-password");
  };

  const handleVerifyAccount = () => {
    router.push("/(auth)/verify-email");
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
                Email Address:
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
                Password:
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
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.eyeButton}
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                  <Ionicons
                    name={isPasswordVisible ? "eye" : "eye-off"}
                    size={moderateScale(20)}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.linksRow}>
                <TouchableOpacity
                  style={styles.verifyAccount}
                  onPress={handleVerifyAccount}
                >
                  <Text style={styles.verifyAccountText}>Verify Account</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={handleForgotPassword}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginButtonText}>Login</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.signupButton}
                onPress={() => router.push("/(auth)/signup")}
              >
                <Text style={styles.signupButtonText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
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

  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: wp(isSmallDevice() ? 8 : 13),
    maxWidth: wp(100),
    alignSelf: "center",
    width: "100%",
  },
  header: {
    alignItems: "center",
    marginBottom: hp(2),
  },
  logo: {
    width: moderateScale(isSmallDevice() ? 160 : 180),
    height: moderateScale(isSmallDevice() ? 160 : 180),
    marginBottom: moderateScale(-70),
  },
  title: {
    fontSize: scaleFontSize(isSmallDevice() ? 40 : 50),
    color: "#1C86FF",
    marginTop: moderateScale(5),
    fontFamily: "SFProBold",
  },
  form: {
    width: "100%",
    marginBottom: hp(2),
  },
  label: {
    fontSize: scaleFontSize(18),
    color: "#000",
    marginBottom: hp(0.5),
    fontFamily: "SFProSB"
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "black",
    borderRadius: moderateScale(12),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    fontSize: scaleFontSize(18),
    marginBottom: hp(2),
    fontFamily:"SFProReg",
    width: "100%",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "black",
    borderRadius: moderateScale(12),
    marginBottom: hp(1.5),
    width: "100%",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    fontSize: scaleFontSize(18),
    fontFamily:"SFProReg"
  },
  eyeButton: {
    padding: moderateScale(12),
    paddingHorizontal: wp(4),
  },
  linksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(1),
    width: "100%",
  },
  forgotPassword: {
    alignSelf: "flex-start",
  },
  forgotPasswordText: {
    color: "Black",
    fontSize: scaleFontSize(13),
    fontFamily: "SFProReg",
    textDecorationLine: 'underline',
  },
  verifyAccount: {
    alignSelf: "flex-end",
  },
  verifyAccountText: {
    color: "Black",
    fontSize: scaleFontSize(13),
    fontFamily: "SFProReg",
    textDecorationLine: 'underline',
  },
  buttonRow: {
    flexDirection: "row",
    gap: wp(3),
    marginBottom: hp(1),
    width: "100%",
  },
  loginButton: {
    flex: 1,
    backgroundColor: "#1C86FF",
    paddingVertical: hp(1.5),
    borderRadius: moderateScale(8),
    alignItems: "center",
    justifyContent: "center",
    minHeight: hp(5.5),
  },
  loginButtonText: {
    color: "#fff",
    fontSize: scaleFontSize(16),
    fontFamily: "SFProReg",
  },
  signupButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#1C86FF",
    paddingVertical: hp(1.5),
    borderRadius: moderateScale(8),
    alignItems: "center",
    justifyContent: "center",
    minHeight: hp(5.5),
  },
  signupButtonText: {
    color: "#1C86FF",
    fontSize: scaleFontSize(16),
    fontWeight: "600",
    fontFamily: "SFProReg",
  },
});
