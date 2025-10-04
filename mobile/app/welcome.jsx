import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useFonts } from 'expo-font';
import { wp, hp, moderateScale, scaleFontSize, isSmallDevice } from '@utils/responsive';

export default function WelcomeScreen() {
  const [loaded] = useFonts({
    'SFProBold': require('./assets/fonts/SF-Pro-Rounded-Bold.otf'),
  });

  useEffect(() => {
    if (loaded) {
      const timer = setTimeout(() => {
        router.replace('/(auth)/login');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [loaded]);

  if (!loaded) return null; // prevent fallback font flash

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
    justifyContent: 'center',
    alignItems: 'center',
    width: "100%",
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: "100%",
  },
  logo: {
    width: moderateScale(isSmallDevice() ? 250 : 300),
    height: moderateScale(isSmallDevice() ? 250 : 300),
    marginBottom: moderateScale(-120),
  },
  appName: {
    fontSize: scaleFontSize(isSmallDevice() ? 60 : 72),
    color: '#FFFFFF',
    letterSpacing: 2,
    textAlign: 'center',
    fontFamily: 'SFProBold',
    marginTop: moderateScale(20),
  },

});
