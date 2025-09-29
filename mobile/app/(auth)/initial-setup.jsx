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
    opacity: 0.1, // subtle paw prints like your reference
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 50,
  },

  title: {
    fontSize: 40,
    color: "#1C86FF",
    textAlign: "center",
    fontFamily:"SFProBold",
    marginBottom: -15,
  },
  
  subtitle: {
    fontSize: 16,
    fontFamily: "SFProReg",
    color: "black",
    textAlign: "center",
    marginBottom: 30,
  },

  button: {
    backgroundColor: "#1C86FF",
    paddingVertical: 16,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginBottom: 28,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily:"SFProReg",
  },
});
