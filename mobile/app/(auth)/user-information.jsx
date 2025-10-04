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
  Image,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { wp, hp, moderateScale, scaleFontSize, isSmallDevice } from '@utils/responsive';

export default function UserInformationScreen() {
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    homeAddress: '',
    phoneNumber: '',
  });
  const [profileImage, setProfileImage] = useState(null);

  const updateUserInfo = (field, value) => {
    setUserInfo(prev => ({ ...prev, [field]: value }));
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
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleConfirm = () => {
    // Validate fields
    const { firstName, lastName, homeAddress, phoneNumber } = userInfo;
    if (!firstName || !lastName || !homeAddress || !phoneNumber) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    // Combine all user information
    const completeUserInfo = {
      ...userInfo,
      profileImage,
    };

    // TODO: Save all information to backend
    console.log('Complete User Info:', completeUserInfo);

    // Navigate to pet information
    router.push('/(auth)/pet-information');
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
          <Text style={styles.pageTitle}>User Information</Text>

          {/* Profile Photo Upload */}
          <TouchableOpacity style={styles.addCircle} onPress={pickImage}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <Ionicons name="add" size={moderateScale(36)} color="#1C86FF" />
            )}
          </TouchableOpacity>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* First Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                value={userInfo.firstName}
                onChangeText={(value) => updateUserInfo('firstName', value)}
                placeholder="Enter first name"
              />
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={userInfo.lastName}
                onChangeText={(value) => updateUserInfo('lastName', value)}
                placeholder="Enter last name"
              />
            </View>

            {/* Home Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Home Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={userInfo.homeAddress}
                onChangeText={(value) => updateUserInfo('homeAddress', value)}
                placeholder="Enter home address"
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
                value={userInfo.phoneNumber}
                onChangeText={(value) => updateUserInfo('phoneNumber', value)}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            </View>

            {/* Confirm Button */}
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
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
    width: "100%",
  },
  pageTitle: {
    fontSize: scaleFontSize(isSmallDevice() ? 35 : 40),
    fontFamily: 'SFProBold',
    color: '#1C86FF',
    textAlign: 'center',
    marginBottom: hp(2.5),
  },
  addCircle: {
    width: wp(25),
    height: wp(25),
    borderRadius: wp(12.5),
    borderWidth: 2,
    borderColor: '#1C86FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(3.5),
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: wp(12.5),
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
    height: hp(11),
    paddingTop: hp(1.5),
  },
  confirmButton: {
    backgroundColor: '#1C86FF',
    paddingVertical: hp(1.8),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(1.5),
    width: "100%",
    minHeight: hp(6),
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontFamily: 'SFProReg',
  },
});