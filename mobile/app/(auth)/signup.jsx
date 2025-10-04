import React, { useState, useRef } from "react";
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
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { wp, hp, moderateScale, scaleFontSize, isSmallDevice } from "@utils/responsive";

export default function SignUpScreen() {
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // simulate existing usernames
  const existingUsernames = useRef(["existinguser", "admin", "test"]);

  // simulate API check
  const checkUsernameAvailability = async (value) => {
    if (!value) return null;
    setCheckingUsername(true);
    setUsernameAvailable(null);
    await new Promise((res) => setTimeout(res, 700));
    const exists = existingUsernames.current.includes(value.trim().toLowerCase());
    setCheckingUsername(false);
    setUsernameAvailable(!exists);
    return !exists;
  };

  const validateAll = async () => {
    let ok = true;
    const newErr = { username: "", email: "", password: "", confirmPassword: "" };

    if (!username.trim()) {
      newErr.username = "Username is required";
      ok = false;
    } else if (username.trim().length < 3) {
      newErr.username = "Username must be at least 3 characters";
      ok = false;
    }

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
    }

    if (!confirmPassword) {
      newErr.confirmPassword = "Confirm your password";
      ok = false;
    } else if (confirmPassword !== password) {
      newErr.confirmPassword = "Passwords do not match";
      ok = false;
    }

    setErrors(newErr);

    if (ok) {
      const available =
        usernameAvailable === null ? await checkUsernameAvailability(username) : usernameAvailable;
      if (!available) {
        setErrors((prev) => ({ ...prev, username: "Username already exists" }));
        return false;
      }
    }

    return ok;
  };

  const handleConfirm = async () => {
    const ok = await validateAll();
    if (!ok) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.replace("account-created");
    }, 1200);
  };

  const onUsernameBlur = () => {
    if (!username.trim()) {
      setUsernameAvailable(null);
      return;
    }
    checkUsernameAvailability(username);
  };

  const canSubmit =
    username.trim().length >= 3 &&
    email.trim().length > 0 &&
    /\S+@\S+\.\S+/.test(email) &&
    password.length >= 6 &&
    confirmPassword === password &&
    usernameAvailable === true &&
    !checkingUsername &&
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
            {/* Username */}
            <Text style={styles.label}>Username</Text>
            <TextInput
              value={username}
              onChangeText={(t) => {
                setUsername(t);
                setUsernameAvailable(null);
                if (errors.username) setErrors((p) => ({ ...p, username: "" }));
              }}
              onBlur={onUsernameBlur}
              placeholder="Enter your username"
              style={styles.input}
              autoCapitalize="none"
            />
            {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}

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
                style={styles.passwordInput}
              />
              <TouchableOpacity style={styles.eyeWrap} onPress={() => setShowConfirm((s) => !s)}>
                <Ionicons name={showConfirm ? "eye" : "eye-off"} size={moderateScale(20)} color="#333" />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword ? (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            ) : null}
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


          {/* Social login */}
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

          {/* Center error */}
          {errors.username === "Username already exists" && (
            <Text style={styles.centerError}>Username already exists</Text>
          )}
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
    borderColor: "black",
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
    borderColor: "black",
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

  socialLogin: {
    alignItems: "center",
    width: "100%",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: hp(1.5),
    width: "100%",
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "black",
  },
  orContinueWith: {
    fontSize: scaleFontSize(13),
    color: "#black",
    marginHorizontal: wp(3),
    fontFamily: "SFProMedium",
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
  socialIconPlaceholder: {
    width: moderateScale(28),
    height: moderateScale(28),
    backgroundColor: "#fff",
  },

  errorText: {
    fontSize: scaleFontSize(12),
    color: "red",
    marginBottom: hp(1),
  },
});
