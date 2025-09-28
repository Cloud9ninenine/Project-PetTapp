import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useFonts } from 'expo-font';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  // Load SF Pro Rounded Medium font
  const [fontsLoaded] = useFonts({
    'SF-Pro-Rounded-Medium': require('./assets/fonts/SF-Pro-Rounded-Medium.otf'),
  });

  useEffect(() => {
    // Auto-navigate to auth after 3 seconds
    const timer = setTimeout(() => {
      router.replace('/(auth)/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded) {
    return null; // Show nothing while fonts are loading
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('./assets/images/PetTapp Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>PetTapp</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C86FF',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 0,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 400,
    height: 400,
    marginBottom: -100,
  },
  appName: {
    fontSize: 72,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
    textAlign: 'center',
    fontFamily: 'SF-Pro-Rounded-Medium',
  },
});