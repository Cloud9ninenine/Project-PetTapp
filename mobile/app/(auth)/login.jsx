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
} from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { wp, hp, moderateScale, scaleFontSize, isSmallDevice } from "@utils/responsive";

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

      // Check for business credentials
      if (email.toLowerCase() === "business" && password === "business123") {
        router.replace("/(bsn)/(tabs)/home");
      }
      // Check for rider credentials
      else if (email.toLowerCase() === "rider" && password === "rider123") {
        router.replace("/(rider)/(tabs)/home");
      }
      // Check for new user credentials (initial setup)
      else if (email.toLowerCase() === "newuser" && password === "newuser123") {
        router.replace("/(auth)/initial-setup");
      }
      // Check for regular user credentials
      else if (email.toLowerCase() === "user" && password === "user123") {
        router.replace("/(user)/(tabs)/home");
      }
      // Invalid credentials
      else {
        Alert.alert("Login Failed", "Invalid credentials. Try:\nuser/user123\nbusiness/business123\nnewuser/newuser123");
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
                    size={moderateScale(20)}
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
                  <Ionicons name="logo-google" size={moderateScale(24)} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialLogin("Facebook")}
                >
                  <Ionicons name="logo-facebook" size={moderateScale(24)} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialLogin("Apple")}
                >
                  <Ionicons name="logo-apple" size={moderateScale(24)} color="#fff" />
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: hp(1),
  },
  forgotPasswordText: {
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
  socialLogin: {
    alignItems: "center",
    width: "100%",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: hp(2),
    width: "100%",
  },
  divider: {
    flex: 1,
    height: 1.2,
    backgroundColor: "black",
  },
  orContinueWith: {
    fontSize: scaleFontSize(13),
    color: "black",
    fontFamily: "SFProMedium",
    marginHorizontal: wp(3),
  },
  socialButtons: {
    flexDirection: "row",
    gap: wp(4),
    justifyContent: "center",
    alignItems: "center",
  },
  socialButton: {
    width: moderateScale(50),
    height: moderateScale(50),
    backgroundColor: "#000",
    borderRadius: moderateScale(10),
    justifyContent: "center",
    alignItems: "center",
  },
});
