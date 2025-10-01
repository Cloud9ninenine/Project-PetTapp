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
  Platform,
  Image,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { wp, moderateScale, scaleFontSize, isSmallDevice } from '@utils/responsive';

export default function BusinessInformationScreen() {
  const [businessInfo, setBusinessInfo] = useState({
    businessName: '',
    address: '',
    phoneNumber: '',
    openingTime: '',
    closingTime: '',
  });
  const [businessImage, setBusinessImage] = useState(null);

  const [showOpeningTimePicker, setShowOpeningTimePicker] = useState(false);
  const [showClosingTimePicker, setShowClosingTimePicker] = useState(false);
  const [selectedOpeningTime, setSelectedOpeningTime] = useState(new Date());
  const [selectedClosingTime, setSelectedClosingTime] = useState(new Date());

  const updateBusinessInfo = (field, value) => {
    setBusinessInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleOpeningTimeChange = (event, time) => {
    if (Platform.OS === 'android') {
      setShowOpeningTimePicker(false);
    }

    if (time) {
      setSelectedOpeningTime(time);
      const formattedTime = time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      updateBusinessInfo('openingTime', formattedTime);
    }
  };

  const handleClosingTimeChange = (event, time) => {
    if (Platform.OS === 'android') {
      setShowClosingTimePicker(false);
    }

    if (time) {
      setSelectedClosingTime(time);
      const formattedTime = time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      updateBusinessInfo('closingTime', formattedTime);
    }
  };

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setBusinessImage(result.assets[0].uri);
    }
  };

  const handleNext = () => {
    // Validate fields
    const { businessName, address, phoneNumber, openingTime, closingTime } = businessInfo;

    if (!businessName || !address || !phoneNumber || !openingTime || !closingTime) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    // Navigate to page 2 with current data
    router.push({
      pathname: '/(auth)/business-information-additional',
      params: { ...businessInfo, businessImage }
    });
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
          <Text style={styles.pageTitle}>Business Information</Text>

          {/* Business Logo Upload */}
          <TouchableOpacity style={styles.addCircle} onPress={pickImage}>
            {businessImage ? (
              <Image source={{ uri: businessImage }} style={styles.businessImage} />
            ) : (
              <Ionicons name="add" size={moderateScale(36)} color="#1C86FF" />
            )}
          </TouchableOpacity>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Business Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Name</Text>
              <TextInput
                style={styles.input}
                value={businessInfo.businessName}
                onChangeText={(value) => updateBusinessInfo('businessName', value)}
                placeholder="Enter business name"
              />
            </View>

            {/* Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={businessInfo.address}
                onChangeText={(value) => updateBusinessInfo('address', value)}
                placeholder="Enter business address"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={businessInfo.phoneNumber}
                onChangeText={(value) => updateBusinessInfo('phoneNumber', value)}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            </View>

            {/* Operating Hours */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Operating Hours</Text>
              <View style={styles.timeRow}>
                {/* Opening Time */}
                <TouchableOpacity style={styles.timeWrapper} onPress={() => setShowOpeningTimePicker(true)}>
                  <View style={styles.timeInputContainer}>
                    <Text style={[styles.timeInput, !businessInfo.openingTime && styles.placeholderTextInput]}>
                      {businessInfo.openingTime || 'Opening'}
                    </Text>
                    <Ionicons name="time-outline" size={moderateScale(20)} color="#666" style={styles.timeIcon} />
                  </View>
                </TouchableOpacity>

                <Text style={styles.timeSeparator}>-</Text>

                {/* Closing Time */}
                <TouchableOpacity style={styles.timeWrapper} onPress={() => setShowClosingTimePicker(true)}>
                  <View style={styles.timeInputContainer}>
                    <Text style={[styles.timeInput, !businessInfo.closingTime && styles.placeholderTextInput]}>
                      {businessInfo.closingTime || 'Closing'}
                    </Text>
                    <Ionicons name="time-outline" size={moderateScale(20)} color="#666" style={styles.timeIcon} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Next Button */}
            <TouchableOpacity style={styles.confirmButton} onPress={handleNext}>
              <Text style={styles.confirmButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Opening Time Picker */}
      {showOpeningTimePicker && (
        <DateTimePicker
          value={selectedOpeningTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleOpeningTimeChange}
        />
      )}

      {/* Closing Time Picker */}
      {showClosingTimePicker && (
        <DateTimePicker
          value={selectedClosingTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleClosingTimeChange}
        />
      )}
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
    fontSize: scaleFontSize(isSmallDevice() ? 30 : 36),
    fontFamily: 'SFProBold',
    color: '#1C86FF',
    textAlign: 'center',
    marginBottom: moderateScale(20),
  },
  addCircle: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    borderWidth: 2,
    borderColor: '#1C86FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(30),
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  businessImage: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(50),
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
    borderColor: '#1C86FF',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    fontSize: scaleFontSize(20),
    fontFamily: 'SFProReg',
  },
  textArea: {
    height: moderateScale(90),
    paddingTop: moderateScale(14),
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#1C86FF',
    borderRadius: moderateScale(10),
  },
  timeInput: {
    flex: 1,
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    fontSize: scaleFontSize(20),
    fontFamily: 'SFProReg',
    color: '#333',
  },
  placeholderTextInput: {
    color: '#999',
  },
  timeIcon: {
    paddingHorizontal: moderateScale(12),
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  timeWrapper: {
    flex: 1,
  },
  timeSeparator: {
    fontSize: scaleFontSize(24),
    color: '#1C86FF',
    fontFamily: 'SFProBold',
  },
  confirmButton: {
    backgroundColor: '#1C86FF',
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    marginTop: moderateScale(10),
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(18),
    fontFamily: 'SFProReg',
  },
});