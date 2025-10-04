import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { wp, hp, moderateScale, scaleFontSize, isSmallDevice } from "@utils/responsive";

export default function AccountCreatedScreen() {
  const handleContinueToLogin = () => {
    router.replace("/(auth)/login");
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
          Verify your account through the link sent to your email.
        </Text>

        {/* Button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinueToLogin}
        >
          <Text style={styles.continueButtonText}>Continue to Login</Text>
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
    marginBottom: hp(5),
    lineHeight: moderateScale(24),
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
