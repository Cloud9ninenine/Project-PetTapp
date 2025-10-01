import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  wp,
  hp,
  moderateScale,
  scaleFontSize,
  isSmallDevice,
  isTablet,
  getDeviceSize,
  getResponsivePadding
} from '@utils/responsive';

const PAW_BACKGROUND = require('@assets/images/PetTapp pattern.png');

export default function WelcomeScreen() {
  useEffect(() => {
    // Auto-navigate to home after 2.5 seconds
    const timer = setTimeout(() => {
      router.replace('/(user)/(tabs)/home');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const deviceSize = getDeviceSize();

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={PAW_BACKGROUND}
        style={styles.backgroundimg}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="repeat"
      />
      <View style={[styles.content, { paddingHorizontal: getResponsivePadding(wp(10)) }]}>
        <Text style={[
          styles.title,
          deviceSize === 'small' && styles.titleSmall,
          deviceSize === 'tablet' && styles.titleTablet,
        ]}>
          PetTapp
        </Text>
        <Text style={[
          styles.subtitle,
          deviceSize === 'small' && styles.subtitleSmall,
          deviceSize === 'tablet' && styles.subtitleTablet,
        ]}>
          Pet care wellness, one tap away!
        </Text>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(5),
  },

  title: {
    fontSize: scaleFontSize(60),
    fontFamily: "SFProBold",
    color: '#1C86FF',
    textAlign: 'center',
    marginBottom: hp(1.5),
  },
  titleSmall: {
    fontSize: scaleFontSize(48),
    marginBottom: hp(1),
  },
  titleTablet: {
    fontSize: scaleFontSize(80),
    marginBottom: hp(2),
  },

  subtitle: {
    fontFamily: "SFProReg",
    fontSize: scaleFontSize(24),
    color: '#FF6F61',
    textAlign: 'center',
    marginTop: moderateScale(10),
    paddingHorizontal: wp(5),
  },
  subtitleSmall: {
    fontSize: scaleFontSize(18),
    marginTop: moderateScale(8),
  },
  subtitleTablet: {
    fontSize: scaleFontSize(32),
    marginTop: moderateScale(15),
    paddingHorizontal: wp(10),
  },
});
