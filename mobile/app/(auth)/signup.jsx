import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ImageBackground,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

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
      router.replace("initial-setup");
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
                <Ionicons name={showPassword ? "eye" : "eye-off"} size={20} color="#333" />
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
                <Ionicons name={showConfirm ? "eye" : "eye-off"} size={20} color="#333" />
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
            activeOpacity={0.7} // para may tap feedback kahit naka "disabled" look
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
    paddingHorizontal: 50,
  },

  title: {
    fontSize: 48,
    color: "#1C86FF",
    textAlign: "center",
    fontFamily: "SFProBold",
    marginBottom: 20,
  },

  form: { marginBottom: 10 },

  label: {
  fontSize: 18,
  color: "#black",
  marginBottom: 4,
  fontFamily: "SFProSB",
},

  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
    marginBottom: 10,
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 10,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 20,
  },

  eyeWrap: { paddingHorizontal: 20 },

  alreadyRow: { alignSelf: "flex-end", marginBottom: 12 },
  alreadyText: { color: "black", fontSize: 14, textDecorationLine: 'underline', },

  confirmButton: {
    backgroundColor: "#1C86FF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 14,
  },
  disabledButton: { opacity: 0.6 },
  confirmText: { color: "#fff", fontSize: 16, fontFamily: "SFProBold" },

  socialLogin: { alignItems: "center" },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
  divider: { flex: 1, height: 1, backgroundColor: "black" },
  orContinueWith: { fontSize: 13, color: "#black", marginHorizontal: 14, fontFamily: "SFProMedium" },

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
  socialIconPlaceholder: { width: 28, height: 28, backgroundColor: "#fff" },

  errorText: {
    fontSize: 12,
    color: "red",
    marginBottom: 8,
  },
});
