import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';

export default function MessagesScreen() {
  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText}>Messages</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("@assets/images/PetTapp pattern.png")}
        style={styles.backgroundimg}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="repeat"
      />
      <Header
        backgroundColor="#1C86FF"
        titleColor="#fff"
        customTitle={renderTitle()}
        showBack={false}
      />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="chatbubbles" size={moderateScale(80)} color="#1C86FF" />
        </View>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>Chat with pet service providers</Text>
        <Text style={styles.comingSoon}>Coming Soon</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  backgroundimg: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.5 }],
  },
  backgroundImageStyle: {
    opacity: 0.1,
  },
  titleContainer: {
    flex: 1,
  },
  titleText: {
    color: '#fff',
    fontSize: scaleFontSize(24),
    fontFamily: 'SFProBold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
  },
  iconContainer: {
    width: moderateScale(150),
    height: moderateScale(150),
    borderRadius: moderateScale(75),
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(25),
  },
  title: {
    fontSize: scaleFontSize(24),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(8),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: scaleFontSize(16),
    color: '#666',
    marginBottom: moderateScale(20),
    textAlign: 'center',
  },
  comingSoon: {
    fontSize: scaleFontSize(14),
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
