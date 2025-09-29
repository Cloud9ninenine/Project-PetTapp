import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, SafeAreaView } from 'react-native';
import { router } from 'expo-router';

const PAW_BACKGROUND = require('@assets/images/PetTapp pattern.png');

export default function WelcomeScreen() {
  useEffect(() => {
    // Auto-navigate to home after 2.5 seconds
    const timer = setTimeout(() => {
      router.replace('/(user)/(tabs)/home');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={PAW_BACKGROUND}
        style={styles.backgroundimg}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="repeat"
      />
      <View style={styles.content}>
        <Text style={styles.title}>PetTapp</Text>
        <Text style={styles.subtitle}>Pet care wellness, one tap away!</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  backgroundimg: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.5 }],
  },
  backgroundImageStyle: {
    opacity: 0.1,
  },

  content: {
    flex: 1, // 👈 takes full height
    justifyContent: 'center', // 👈 centers vertically
    alignItems: 'center', // 👈 centers horizontally
    paddingHorizontal: 50,
  },

  title: {
    fontSize: 60,
    fontFamily: "SFProBold",
    color: '#1C86FF',
    paddingHorizontal: 60,
  },
  subtitle: {
    fontFamily: "SFProReg",
    fontSize: 25,
    color: '#FF6F61',
    textAlign: 'center',
    marginTop: 10,
  },
});
