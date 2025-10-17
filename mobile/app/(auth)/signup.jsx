import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ImageBackground,
  ActivityIndicator,
  useWindowDimensions,
  Alert,
  Switch,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { wp, hp, moderateScale, scaleFontSize, isSmallDevice } from "@utils/responsive";
import apiClient from "../config/api";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("pet-owner"); // default role is "pet-owner"

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const validateAll = async () => {
    let ok = true;
    const newErr = { email: "", password: "", confirmPassword: "" };

    if (!email.trim()) {
      newErr.email = "Email is required";
      ok = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErr.email = "Enter a valid email";
      ok = false;
    }

    if (!password) {
      newErr.password = "Password is required";
      ok = false;
    } else if (password.length < 6) {
      newErr.password = "Password must be at least 6 characters";
      ok = false;
    } else if (!/(?=.*[A-Z])/.test(password)) {
      newErr.password = "Password must contain at least one uppercase letter";
      ok = false;
    } else if (!/(?=.*\d)/.test(password)) {
      newErr.password = "Password must contain at least one number";
      ok = false;
    } else if (!/(?=.*[@$!%*?&#])/.test(password)) {
      newErr.password = "Password must contain at least one special character (@$!%*?&#)";
      ok = false;
    }

    if (!confirmPassword) {
      newErr.confirmPassword = "Confirm your password";
      ok = false;
    } else if (confirmPassword !== password) {
      newErr.confirmPassword = "Passwords do not match";
      ok = false;
    }

    setErrors(newErr);
    return ok;
  };

  const handleConfirm = async () => {
    const ok = await validateAll();
    if (!ok) return;

    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/register', {
        email: email.trim(),
        password: password,
        role: role
      });

      // 201 - Registration successful
      if (response.status === 201) {
        router.replace({
          pathname: "account-created",
          params: { email: email.trim().toLowerCase() },
        });
      }
    } catch (error) {
      console.error('Registration error:', error);

      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        // 409 - Email or Username already exists
        if (status === 409) {
          const message = data?.message || "";

          if (message.toLowerCase().includes("email")) {
            setErrors((prev) => ({
              ...prev,
              email: data?.message || "Email already exists"
            }));
            Alert.alert("Registration Failed", "This email is already registered. Please use a different email.");
          } else {
            Alert.alert("Registration Failed", data?.message || "User already exists.");
          }
        }
        // 422 - Validation errors
        else if (status === 422) {
          const validationErrors = data?.errors || {};
          const newErrors = { email: "", password: "", confirmPassword: "" };

          if (validationErrors.email) {
            newErrors.email = validationErrors.email;
          }
          if (validationErrors.password) {
            newErrors.password = validationErrors.password;
          }

          setErrors(newErrors);
          Alert.alert("Validation Error", data?.message || "Please check your input and try again.");
        }
        // Other errors
        else {
          const errorMessage = data?.message || data?.error || "An error occurred during registration";
          Alert.alert("Registration Failed", errorMessage);
        }
      } else if (error.request) {
        // Request made but no response
        Alert.alert("Network Error", "Please check your connection and try again.");
      } else {
        Alert.alert("Error", "An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit =
    email.trim().length > 0 &&
    /\S+@\S+\.\S+/.test(email) &&
    password.length >= 6 &&
    confirmPassword === password &&
    !isLoading;

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
          <Text style={styles.title}>Sign Up</Text>

          {/* Form */}
          <View style={styles.form}>
            {/* Email */}
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (errors.email) setErrors((p) => ({ ...p, email: "" }));
              }}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (errors.password) setErrors((p) => ({ ...p, password: "" }));
                }}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                textContentType="password"
                autoComplete="password"
                autoCapitalize="none"
                style={styles.passwordInput}
              />
              <TouchableOpacity style={styles.eyeWrap} onPress={() => setShowPassword((s) => !s)}>
                <Ionicons name={showPassword ? "eye" : "eye-off"} size={moderateScale(20)} color="#333" />
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

            {/* Confirm Password */}
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: "" }));
                }}
                placeholder="Re-enter your password"
                secureTextEntry={!showConfirm}
                textContentType="password"
                autoComplete="password"
                autoCapitalize="none"
                style={styles.passwordInput}
              />
              <TouchableOpacity style={styles.eyeWrap} onPress={() => setShowConfirm((s) => !s)}>
                <Ionicons name={showConfirm ? "eye" : "eye-off"} size={moderateScale(20)} color="#333" />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword ? (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            ) : null}

            {/* Role Selection */}
            <Text style={styles.label}>Account Type</Text>
            <Text style={styles.accountTypeSubtitle}>Select the type of account you want to create.</Text>

            <View style={styles.roleOption}>
              <View style={styles.roleContent}>
                <Text style={styles.roleTitle}>
                  {role === "pet-owner" ? "Pet Owner" : "Business Owner"}
                </Text>
                <Text style={styles.roleDescription}>
                  {role === "pet-owner"
                    ? "Find and book services for your pets."
                    : "Offer pet services and manage bookings."}
                </Text>
              </View>
              <Switch
                value={role === "business-owner"}
                onValueChange={(value) => setRole(value ? "business-owner" : "pet-owner")}
                trackColor={{ false: "#1C86FF", true: "#ff9b79" }}
                thumbColor="#fff"
                ios_backgroundColor="#D1D5DB"
              />
            </View>
          </View>

          {/* Already have account */}
          <TouchableOpacity
            onPress={() => router.push("/(auth)/login")}
            style={styles.alreadyRow}
          >
            <Text style={styles.alreadyText}>Already have an account?</Text>
          </TouchableOpacity>

          {/* Confirm button */}
          <TouchableOpacity
            style={[styles.confirmButton, !canSubmit && styles.disabledButton]}
            onPress={handleConfirm}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmText}>Confirm</Text>
            )}
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* Styles */
const styles = StyleSheet.create({
  backgroundimg: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.5 }],
  },

  backgroundImageStyle: { opacity: 0.1 },

  keyboardView: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: wp(isSmallDevice() ? 8 : 13),
    maxWidth: wp(100),
    alignSelf: "center",
    width: "100%",
  },

  title: {
    fontSize: scaleFontSize(isSmallDevice() ? 38 : 48),
    color: "#1C86FF",
    textAlign: "center",
    fontFamily: "SFProBold",
    marginBottom: hp(2.5),
  },

  form: {
    marginBottom: hp(1),
    width: "100%",
  },

  label: {
    fontSize: scaleFontSize(16),
    color: "#black",
    marginBottom: hp(0.5),
    fontFamily: "SFProSB",
  },

  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: moderateScale(10),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    fontSize: scaleFontSize(18),
    marginBottom: hp(1.2),
    width: "100%",
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: moderateScale(10),
    backgroundColor: "#fff",
    marginBottom: hp(1.2),
    width: "100%",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: wp(3),
    paddingVertical: hp(1.5),
    fontSize: scaleFontSize(18),
  },

  eyeWrap: {
    paddingHorizontal: wp(4),
  },

  alreadyRow: {
    alignSelf: "flex-end",
    marginBottom: hp(1.5),
  },
  alreadyText: {
    color: "black",
    fontSize: scaleFontSize(14),
    textDecorationLine: 'underline',
  },

  confirmButton: {
    backgroundColor: "#1C86FF",
    paddingVertical: hp(1.5),
    borderRadius: moderateScale(10),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: hp(1.5),
    width: "100%",
    minHeight: hp(5.5),
  },
  disabledButton: { opacity: 0.6 },
  confirmText: {
    color: "#fff",
    fontSize: scaleFontSize(16),
    fontFamily: "SFProBold",
  },



  errorText: {
    fontSize: scaleFontSize(12),
    color: "red",
    marginBottom: hp(1),
  },

  accountTypeSubtitle: {
    fontSize: scaleFontSize(12),
    color: "#666",
    marginBottom: hp(0.8),
    fontFamily: "SFProReg",
  },

  roleOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#fff",
    marginBottom: hp(1.2),
  },

  roleContent: {
    flex: 1,
    marginRight: wp(3),
  },

  roleTitle: {
    fontSize: scaleFontSize(14),
    color: "#000",
    fontFamily: "SFProSB",
    marginBottom: hp(0.2),
  },

  roleDescription: {
    fontSize: scaleFontSize(11),
    color: "#666",
    fontFamily: "SFProReg",
    lineHeight: scaleFontSize(14),
  },
});
