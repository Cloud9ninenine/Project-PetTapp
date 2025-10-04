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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { wp, hp, moderateScale, scaleFontSize, isSmallDevice } from '@utils/responsive';

const BUSINESS_TYPE_OPTIONS = [
  { label: 'Select business type', value: '' },
  { label: 'Veterinary Clinic', value: 'veterinary-clinic' },
  { label: 'Pet Shop', value: 'pet-shop' },
  { label: 'Pet Grooming', value: 'pet-grooming' },
  { label: 'Pet Hotel/Boarding', value: 'pet-hotel' },
  { label: 'Pet Training', value: 'pet-training' },
  { label: 'Pet Spa', value: 'pet-spa' },
  { label: 'Pet Food Store', value: 'pet-food-store' },
  { label: 'Animal Shelter', value: 'animal-shelter' },
  { label: 'Other', value: 'other' },
];

export default function BusinessInformationAdditionalScreen() {
  const params = useLocalSearchParams();

  const [businessType, setBusinessType] = useState('');
  const [validId, setValidId] = useState(null);
  const [birLicense, setBirLicense] = useState(null);
  const [showBusinessTypeModal, setShowBusinessTypeModal] = useState(false);

  const handleBusinessTypeSelect = (value, label) => {
    setBusinessType(value);
    setShowBusinessTypeModal(false);
  };

  const getBusinessTypeLabel = () => {
    const selected = BUSINESS_TYPE_OPTIONS.find(option => option.value === businessType);
    return selected ? selected.label : 'Select business type';
  };

  const pickDocument = async (type) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success' || !result.canceled) {
        const file = result.assets ? result.assets[0] : result;

        if (type === 'validId') {
          setValidId(file);
          Alert.alert('Success', 'Valid ID uploaded successfully');
        } else if (type === 'birLicense') {
          setBirLicense(file);
          Alert.alert('Success', 'BIR License uploaded successfully');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload document');
      console.error('Document picker error:', error);
    }
  };

  const handleConfirm = () => {
    // Validate fields
    if (!businessType) {
      Alert.alert('Error', 'Please select a business type');
      return;
    }

    if (!validId) {
      Alert.alert('Error', 'Please upload a valid ID');
      return;
    }

    if (!birLicense) {
      Alert.alert('Error', 'Please upload BIR license');
      return;
    }

    // Combine all business information
    const completeBusinessInfo = {
      ...params,
      businessType,
      validId: validId.name,
      birLicense: birLicense.name,
    };

    // TODO: Save all information to backend
    console.log('Complete Business Info:', completeBusinessInfo);

    // Navigate to welcome screen
    router.replace('/(auth)/welcome');
  };

  const handleBack = () => {
    router.back();
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
            {/* Valid ID Upload */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Valid Identification</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => pickDocument('validId')}
              >
                <Ionicons
                  name={validId ? "checkmark-circle" : "cloud-upload-outline"}
                  size={moderateScale(24)}
                  color={validId ? "#28a745" : "#1C86FF"}
                />
                <Text style={[styles.uploadButtonText, validId && styles.uploadedText]}>
                  {validId ? `Uploaded: ${validId.name}` : 'Upload Valid ID (PDF/Image)'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* BIR License Upload */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>BIR License</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => pickDocument('birLicense')}
              >
                <Ionicons
                  name={birLicense ? "checkmark-circle" : "cloud-upload-outline"}
                  size={moderateScale(24)}
                  color={birLicense ? "#28a745" : "#1C86FF"}
                />
                <Text style={[styles.uploadButtonText, birLicense && styles.uploadedText]}>
                  {birLicense ? `Uploaded: ${birLicense.name}` : 'Upload BIR License (PDF/Image)'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Business Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Type</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowBusinessTypeModal(true)}
              >
                <Text style={[styles.dropdownText, !businessType && styles.placeholderText]}>
                  {getBusinessTypeLabel()}
                </Text>
                <Ionicons name="chevron-down" size={moderateScale(20)} color="#666" />
              </TouchableOpacity>
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
        </View>
      </ScrollView>

      {/* Business Type Modal */}
      <Modal
        visible={showBusinessTypeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBusinessTypeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowBusinessTypeModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Business Type</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {BUSINESS_TYPE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.modalOption}
                  onPress={() => handleBusinessTypeSelect(option.value, option.label)}
                >
                  <Text style={styles.modalOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowBusinessTypeModal(false)}
            >
              <Text style={styles.confirmButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    maxWidth: wp(100),
    alignSelf: "center",
    width: "100%",
  },
  pageTitle: {
    fontSize: scaleFontSize(isSmallDevice() ? 30 : 36),
    fontFamily: 'SFProBold',
    color: '#1C86FF',
    textAlign: 'center',
    marginBottom: hp(4),
  },
  formSection: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: hp(1.5),
    width: "100%",
  },
  label: {
    fontSize: scaleFontSize(18),
    color: 'black',
    marginBottom: hp(0.5),
    fontFamily: 'SFProSB',
  },
  dropdownButton: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#1C86FF',
    borderRadius: moderateScale(10),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: "100%",
  },
  dropdownText: {
    fontSize: scaleFontSize(20),
    color: '#333',
    fontFamily: 'SFProReg',
  },
  placeholderText: {
    color: '#999',
  },
  uploadButton: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#1C86FF',
    borderRadius: moderateScale(10),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.8),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    width: "100%",
  },
  uploadButtonText: {
    fontSize: scaleFontSize(16),
    color: '#1C86FF',
    fontFamily: 'SFProReg',
    flex: 1,
  },
  uploadedText: {
    color: '#28a745',
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
    minHeight: hp(5.5),
  },
  backButtonText: {
    color: '#1C86FF',
    fontSize: scaleFontSize(18),
    fontFamily: 'SFProReg',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#1C86FF',
    paddingVertical: hp(1.8),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: hp(5.5),
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(18),
    fontFamily: 'SFProReg',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(5),
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: wp(5),
    width: '100%',
    maxWidth: wp(90),
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: scaleFontSize(24),
    fontFamily: 'SFProBold',
    color: '#1C86FF',
    textAlign: 'center',
    marginBottom: hp(2.5),
  },
  modalOption: {
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalOptionText: {
    fontSize: scaleFontSize(18),
    fontFamily: 'SFProReg',
    color: '#333',
  },
  modalCloseButton: {
    backgroundColor: '#1C86FF',
    paddingVertical: hp(1.8),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(2.5),
    minHeight: hp(5.5),
  },
});