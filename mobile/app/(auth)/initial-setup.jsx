import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ImageBackground,
} from "react-native";
import { router } from "expo-router";
import { wp, moderateScale, scaleFontSize, isSmallDevice } from "@utils/responsive";

export default function InitialSetupScreen() {
  const [selectedProfile, setSelectedProfile] = useState(null);

  const handleSelect = (profile) => {
    setSelectedProfile(profile);
    if (profile === "petowner") {
      router.push("/(auth)/user-information");
    } else if (profile === "business") {
      router.push("/(auth)/business-information");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Background with paw pattern */}
      <ImageBackground
        source={require("@assets/images/PetTapp pattern.png")} // paw pattern file
        style={styles.backgroundimg}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="repeat"
      />

      <View style={styles.content}>
        <Text style={styles.title}>Continue as</Text>
        <Text style={styles.subtitle}>Select a user profile to continue</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => handleSelect("petowner")}
        >
          <Text style={styles.buttonText}>Pet Owner</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => handleSelect("business")}
        >
          <Text style={styles.buttonText}>Business</Text>
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
  },

  title: {
    fontSize: scaleFontSize(isSmallDevice() ? 35 : 40),
    color: "#1C86FF",
    textAlign: "center",
    fontFamily:"SFProBold",
    marginBottom: moderateScale(-15),
  },

  subtitle: {
    fontSize: scaleFontSize(16),
    fontFamily: "SFProReg",
    color: "black",
    textAlign: "center",
    marginBottom: moderateScale(30),
  },

  button: {
    backgroundColor: "#1C86FF",
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(10),
    width: "100%",
    alignItems: "center",
    marginBottom: moderateScale(28),
  },

  buttonText: {
    color: "#fff",
    fontSize: scaleFontSize(16),
    fontFamily:"SFProReg",
  },
});
