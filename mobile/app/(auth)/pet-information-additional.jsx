import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ImageBackground,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { wp, moderateScale, scaleFontSize, isSmallDevice } from '@utils/responsive';

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
    paddingTop: moderateScale(40),
    paddingBottom: moderateScale(40),
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: scaleFontSize(isSmallDevice() ? 35 : 40),
    fontFamily: 'SFProBold',
    color: '#1C86FF',
    textAlign: 'center',
    marginBottom: moderateScale(40),
  },
  formSection: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: moderateScale(12),
  },
  label: {
    fontSize: scaleFontSize(18),
    color: 'black',
    marginBottom: moderateScale(6),
    fontFamily: 'SFProSB',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: 'black',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    fontSize: scaleFontSize(20),
    fontFamily: 'SFProReg',
  },
  textArea: {
    height: moderateScale(120),
    paddingTop: moderateScale(14),
  },
  buttonRow: {
    flexDirection: 'row',
    gap: moderateScale(12),
    marginTop: moderateScale(10),
  },
  backButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#1C86FF',
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(10),
    alignItems: 'center',
  },
  backButtonText: {
    color: '#1C86FF',
    fontSize: scaleFontSize(18),
    fontFamily: 'SFProReg',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#1C86FF',
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(10),
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(18),
    fontFamily: 'SFProReg',
  },
  skipButton: {
    marginTop: moderateScale(20),
  },
  skipButtonText: {
    color: 'black',
    fontSize: scaleFontSize(14),
    fontFamily: 'SFProReg',
    textDecorationLine: 'underline',
  },
});