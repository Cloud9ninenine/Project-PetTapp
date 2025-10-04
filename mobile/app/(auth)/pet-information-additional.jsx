import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { wp, hp, moderateScale, scaleFontSize, isSmallDevice } from '@utils/responsive';

export default function PetInformationAdditionalScreen() {
  const params = useLocalSearchParams();

  const [weight, setWeight] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  const handleConfirm = () => {
    // Validate fields
    if (!weight) {
      Alert.alert('Error', 'Please enter your pet\'s weight');
      return;
    }

    // Combine all pet information
    const completePetInfo = {
      ...params,
      weight,
      additionalInfo,
    };

    // TODO: Save all information to backend
    console.log('Complete Pet Info:', completePetInfo);

    // Navigate to welcome screen
    router.replace('/(auth)/welcome');
  };

  const handleBack = () => {
    router.back();
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Pet Info',
      'You can complete your pet profile later in settings. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: () => router.replace('/(auth)/welcome') }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={require("@assets/images/PetTapp pattern.png")}
        style={styles.backgroundimg}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="repeat"
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          {/* Page Title */}
          <Text style={styles.pageTitle}>Additional Information</Text>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Weight */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                placeholder="Enter weight"
                keyboardType="numeric"
              />
            </View>

            {/* Additional Info */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Additional Info</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={additionalInfo}
                onChangeText={setAdditionalInfo}
                placeholder="Enter any additional information about your pet"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Button Row */}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Skip */}
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: wp(isSmallDevice() ? 8 : 13),
    paddingTop: hp(5),
    paddingBottom: hp(5),
    alignItems: 'center',
    maxWidth: wp(100),
    alignSelf: "center",
    width: "100%",
  },
  pageTitle: {
    fontSize: scaleFontSize(isSmallDevice() ? 35 : 40),
    fontFamily: 'SFProBold',
    color: '#1C86FF',
    textAlign: 'center',
    marginBottom: hp(5),
  },
  formSection: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: hp(1.5),
    width: "100%",
  },
  label: {
    fontSize: scaleFontSize(16),
    color: 'black',
    marginBottom: hp(0.5),
    fontFamily: 'SFProSB',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: 'black',
    borderRadius: moderateScale(10),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    fontSize: scaleFontSize(18),
    fontFamily: 'SFProReg',
    width: "100%",
  },
  textArea: {
    height: hp(15),
    paddingTop: hp(1.5),
  },
  buttonRow: {
    flexDirection: 'row',
    gap: wp(3),
    marginTop: hp(1.5),
    width: "100%",
  },
  backButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#1C86FF',
    paddingVertical: hp(1.8),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: hp(6),
  },
  backButtonText: {
    color: '#1C86FF',
    fontSize: scaleFontSize(16),
    fontFamily: 'SFProReg',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#1C86FF',
    paddingVertical: hp(1.8),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: hp(6),
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontFamily: 'SFProReg',
  },
  skipButton: {
    marginTop: hp(2.5),
  },
  skipButtonText: {
    color: 'black',
    fontSize: scaleFontSize(14),
    fontFamily: 'SFProReg',
    textDecorationLine: 'underline',
  },
});