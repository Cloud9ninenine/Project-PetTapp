import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Alert,
  Image,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';

export default function BusinessInformationScreen() {
  const router = useRouter();
  const [businessInfo, setBusinessInfo] = useState({
    name: 'Pawsome Pet Care',
    type: 'Veterinary Services',
    phone: '+63 917 555 1234',
    email: 'contact@pawsomepetcare.com',
    address: '456 Pet Avenue, Quezon City, Metro Manila',
    profilePic: null,
    validId: null,
    birLicense: null,
  });
  const [showBusinessTypeDropdown, setShowBusinessTypeDropdown] = useState(false);

  const businessTypes = [
    'Veterinary Services',
    'Pet Grooming',
    'Pet Boarding',
    'Pet Training',
    'Pet Delivery',
    'Pet Store',
    'Pet Daycare',
    'Pet Photography',
    'Other',
  ];

  const handleImagePicker = (type) => {
    // Placeholder for image picker functionality
    Alert.alert('Upload Image', `Select ${type} image from gallery or camera`);
  };

  const handleSave = () => {
    Alert.alert('Success', 'Business information updated successfully!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

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
        title="Business Information"
        showBack={true}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Edit Business Details</Text>

          {/* Profile Picture */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Profile Picture</Text>
            <View style={styles.profilePicContainer}>
              <TouchableOpacity
                style={styles.circleImageContainer}
                onPress={() => handleImagePicker('Profile Picture')}
              >
                {businessInfo.profilePic ? (
                  <Image source={{ uri: businessInfo.profilePic }} style={styles.circleImage} />
                ) : (
                  <View style={styles.circlePlaceholder}>
                    <Ionicons name="camera" size={moderateScale(35)} color="#1C86FF" />
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.profilePicHint}>Tap to upload</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Name</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="business" size={moderateScale(20)} color="#1C86FF" />
              <TextInput
                style={styles.input}
                value={businessInfo.name}
                onChangeText={(text) => setBusinessInfo({ ...businessInfo, name: text })}
                placeholder="Enter business name"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Type</Text>
            <TouchableOpacity
              style={styles.dropdownContainer}
              onPress={() => setShowBusinessTypeDropdown(!showBusinessTypeDropdown)}
            >
              <Ionicons name="pricetag" size={moderateScale(20)} color="#1C86FF" />
              <Text style={[styles.dropdownText, !businessInfo.type && styles.dropdownPlaceholder]}>
                {businessInfo.type || 'Select business type'}
              </Text>
              <Ionicons
                name={showBusinessTypeDropdown ? "chevron-up" : "chevron-down"}
                size={moderateScale(20)}
                color="#666"
              />
            </TouchableOpacity>
            {showBusinessTypeDropdown && (
              <ScrollView style={styles.dropdownList} nestedScrollEnabled={true}>
                {businessTypes.map((type, index) => (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [
                      styles.dropdownItem,
                      businessInfo.type === type && styles.dropdownItemSelected,
                      pressed && styles.dropdownItemPressed,
                      index === businessTypes.length - 1 && styles.dropdownItemLast,
                    ]}
                    onPress={() => {
                      setBusinessInfo({ ...businessInfo, type });
                      setShowBusinessTypeDropdown(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      businessInfo.type === type && styles.dropdownItemTextSelected
                    ]}>
                      {type}
                    </Text>
                    {businessInfo.type === type && (
                      <Ionicons name="checkmark-circle" size={moderateScale(22)} color="#1C86FF" />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Address</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location" size={moderateScale(20)} color="#1C86FF" />
              <TextInput
                style={styles.input}
                value={businessInfo.address}
                onChangeText={(text) => setBusinessInfo({ ...businessInfo, address: text })}
                placeholder="Enter business address"
                multiline
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Number</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call" size={moderateScale(20)} color="#1C86FF" />
              <TextInput
                style={styles.input}
                value={businessInfo.phone}
                onChangeText={(text) => setBusinessInfo({ ...businessInfo, phone: text })}
                placeholder="Enter contact number"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={moderateScale(20)} color="#1C86FF" />
              <TextInput
                style={styles.input}
                value={businessInfo.email}
                onChangeText={(text) => setBusinessInfo({ ...businessInfo, email: text })}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Valid Identification */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Valid Identification</Text>
            <TouchableOpacity
              style={styles.documentUploadContainer}
              onPress={() => handleImagePicker('Valid ID')}
            >
              {businessInfo.validId ? (
                <View style={styles.documentUploaded}>
                  <Ionicons name="document-text" size={moderateScale(24)} color="#4CAF50" />
                  <Text style={styles.documentUploadedText}>ID Uploaded</Text>
                </View>
              ) : (
                <View style={styles.documentPlaceholder}>
                  <Ionicons name="card" size={moderateScale(24)} color="#1C86FF" />
                  <Text style={styles.documentUploadText}>Upload Valid ID</Text>
                  <Ionicons name="cloud-upload" size={moderateScale(20)} color="#999" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* BIR License */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>BIR License</Text>
            <TouchableOpacity
              style={styles.documentUploadContainer}
              onPress={() => handleImagePicker('BIR License')}
            >
              {businessInfo.birLicense ? (
                <View style={styles.documentUploaded}>
                  <Ionicons name="document-text" size={moderateScale(24)} color="#4CAF50" />
                  <Text style={styles.documentUploadedText}>License Uploaded</Text>
                </View>
              ) : (
                <View style={styles.documentPlaceholder}>
                  <Ionicons name="document" size={moderateScale(24)} color="#1C86FF" />
                  <Text style={styles.documentUploadText}>Upload BIR License</Text>
                  <Ionicons name="cloud-upload" size={moderateScale(20)} color="#999" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="checkmark-circle" size={moderateScale(22)} color="#fff" />
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
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
  content: {
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(20),
    paddingBottom: moderateScale(100),
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    marginBottom: moderateScale(20),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(20),
  },
  inputGroup: {
    marginBottom: moderateScale(20),
  },
  label: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(8),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    fontSize: scaleFontSize(15),
    color: '#333',
    marginLeft: moderateScale(12),
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#1C86FF',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
  },
  saveButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
  profilePicContainer: {
    alignItems: 'center',
    marginVertical: moderateScale(10),
  },
  circleImageContainer: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    borderWidth: 3,
    borderColor: '#1C86FF',
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
    marginBottom: moderateScale(10),
  },
  circlePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
  },
  circleImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profilePicHint: {
    fontSize: scaleFontSize(13),
    color: '#666',
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(14),
    borderWidth: 2,
    borderColor: '#1C86FF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  dropdownText: {
    flex: 1,
    fontSize: scaleFontSize(15),
    color: '#333',
    marginLeft: moderateScale(12),
    fontWeight: '500',
  },
  dropdownPlaceholder: {
    color: '#999',
    fontWeight: '400',
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    marginTop: moderateScale(8),
    borderWidth: 1,
    borderColor: '#1C86FF',
    maxHeight: moderateScale(250),
    elevation: 5,
    shadowColor: '#1C86FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    backgroundColor: '#fff',
  },
  dropdownItemText: {
    fontSize: scaleFontSize(15),
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },
  dropdownItemSelected: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: moderateScale(4),
    borderLeftColor: '#1C86FF',
  },
  dropdownItemPressed: {
    backgroundColor: '#F5F5F5',
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemTextSelected: {
    color: '#1C86FF',
    fontWeight: '600',
  },
  documentUploadContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    padding: moderateScale(20),
  },
  documentPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  documentUploadText: {
    flex: 1,
    fontSize: scaleFontSize(14),
    color: '#666',
    fontWeight: '500',
    marginLeft: moderateScale(12),
  },
  documentUploaded: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  documentUploadedText: {
    fontSize: scaleFontSize(14),
    color: '#4CAF50',
    fontWeight: '600',
  },
});
