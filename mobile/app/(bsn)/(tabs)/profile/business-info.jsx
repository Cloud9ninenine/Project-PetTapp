import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from '@config/api';

export default function BusinessInformationScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businessId, setBusinessId] = useState(null);

  const [businessInfo, setBusinessInfo] = useState({
    businessName: '',
    businessType: '',
    description: '',
    contactInfo: {
      email: '',
      phone: '',
      website: '',
    },
    credentials: {
      licenseNumber: '',
      certifications: [],
      insuranceInfo: '',
    },
    logo: null,
    verificationDocument: null,
  });

  const [showBusinessTypeDropdown, setShowBusinessTypeDropdown] = useState(false);
  const [newCertification, setNewCertification] = useState('');

  const businessTypes = [
    { value: 'veterinary', label: 'Veterinary Services' },
    { value: 'grooming', label: 'Pet Grooming' },
    { value: 'boarding', label: 'Pet Boarding' },
    { value: 'daycare', label: 'Pet Daycare' },
    { value: 'training', label: 'Pet Training' },
    { value: 'pet-shop', label: 'Pet Shop' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    fetchBusinessInfo();
  }, []);

  const fetchBusinessInfo = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/businesses');

      if (response.data && response.data.data && response.data.data.length > 0) {
        const business = response.data.data[0];
        setBusinessId(business._id);
        setBusinessInfo({
          businessName: business.businessName || '',
          businessType: business.businessType || '',
          description: business.description || '',
          contactInfo: {
            email: business.contactInfo?.email || '',
            phone: business.contactInfo?.phone || '',
            website: business.contactInfo?.website || '',
          },
          credentials: {
            licenseNumber: business.credentials?.licenseNumber || '',
            certifications: business.credentials?.certifications || [],
            insuranceInfo: business.credentials?.insuranceInfo || '',
          },
          logo: business.logo || null,
          verificationDocument: business.verificationDocument || null,
        });
      }
    } catch (error) {
      console.error('Error fetching business info:', error);
      Alert.alert('Error', 'Failed to load business information');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoPickerAsync = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setBusinessInfo({...businessInfo, logo: result.assets[0]});
      }
    } catch (error) {
      console.error('Error picking logo:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success' || !result.canceled) {
        const doc = result.assets ? result.assets[0] : result;
        if (doc.size > 5 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Please select a PDF file smaller than 5MB');
          return;
        }
        setBusinessInfo({...businessInfo, verificationDocument: doc});
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const addCertification = () => {
    if (newCertification.trim()) {
      setBusinessInfo({
        ...businessInfo,
        credentials: {
          ...businessInfo.credentials,
          certifications: [...businessInfo.credentials.certifications, newCertification.trim()],
        },
      });
      setNewCertification('');
    }
  };

  const removeCertification = (index) => {
    const newCerts = businessInfo.credentials.certifications.filter((_, i) => i !== index);
    setBusinessInfo({
      ...businessInfo,
      credentials: {
        ...businessInfo.credentials,
        certifications: newCerts,
      },
    });
  };

  const handleSave = async () => {
    // Validation
    if (!businessInfo.businessName.trim()) {
      Alert.alert('Validation Error', 'Business name is required');
      return;
    }
    if (!businessInfo.businessType) {
      Alert.alert('Validation Error', 'Business type is required');
      return;
    }
    if (!businessInfo.contactInfo.email.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      return;
    }
    if (!businessInfo.contactInfo.phone.trim()) {
      Alert.alert('Validation Error', 'Phone is required');
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      // Append simple fields
      formData.append('businessName', businessInfo.businessName);
      formData.append('businessType', businessInfo.businessType);
      if (businessInfo.description) {
        formData.append('description', businessInfo.description);
      }

      // Append complex fields as JSON strings
      formData.append('contactInfo', JSON.stringify(businessInfo.contactInfo));
      formData.append('credentials', JSON.stringify(businessInfo.credentials));

      // Append logo if it's new
      if (businessInfo.logo && typeof businessInfo.logo === 'object' && businessInfo.logo.uri) {
        const logoUri = Platform.OS === 'ios' ? businessInfo.logo.uri.replace('file://', '') : businessInfo.logo.uri;
        const filename = businessInfo.logo.uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('logo', {
          uri: logoUri,
          name: filename || 'logo.jpg',
          type,
        });
      }

      let response;
      if (businessId) {
        // Update existing business
        response = await apiClient.put(`/businesses/${businessId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        // Create new business
        response = await apiClient.post('/businesses', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (response.data && response.data._id) {
          setBusinessId(response.data._id);
        }
      }

      // Upload verification document separately if new
      if (businessInfo.verificationDocument && typeof businessInfo.verificationDocument === 'object' && businessInfo.verificationDocument.uri) {
        const docFormData = new FormData();
        const docUri = Platform.OS === 'ios' ? businessInfo.verificationDocument.uri.replace('file://', '') : businessInfo.verificationDocument.uri;

        docFormData.append('verificationDocument', {
          uri: docUri,
          name: businessInfo.verificationDocument.name || 'verification.pdf',
          type: 'application/pdf',
        });

        await apiClient.post(`/businesses/verification/upload?businessId=${businessId || response.data._id}`, docFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      Alert.alert('Success', 'Business information updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving business info:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save business information');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1C86FF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        {/* Business Details Section */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="business-outline" size={moderateScale(24)} color="#1C86FF" />
            <Text style={styles.sectionTitle}>Business Details</Text>
          </View>

          {/* Logo */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Logo</Text>
            <View style={styles.profilePicContainer}>
              <TouchableOpacity
                style={styles.circleImageContainer}
                onPress={handleLogoPickerAsync}
              >
                {businessInfo.logo ? (
                  <Image
                    source={{ uri: typeof businessInfo.logo === 'string' ? businessInfo.logo : businessInfo.logo.uri }}
                    style={styles.circleImage}
                  />
                ) : (
                  <View style={styles.circlePlaceholder}>
                    <Ionicons name="camera" size={moderateScale(35)} color="#1C86FF" />
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.profilePicHint}>Tap to upload logo</Text>
            </View>
          </View>

          {/* Business Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Name *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="storefront" size={moderateScale(20)} color="#1C86FF" />
              <TextInput
                style={styles.input}
                value={businessInfo.businessName}
                onChangeText={(text) => setBusinessInfo({ ...businessInfo, businessName: text })}
                placeholder="Enter business name"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Business Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Type *</Text>
            <TouchableOpacity
              style={styles.dropdownContainer}
              onPress={() => setShowBusinessTypeDropdown(!showBusinessTypeDropdown)}
            >
              <Ionicons name="pricetag" size={moderateScale(20)} color="#1C86FF" />
              <Text style={[styles.dropdownText, !businessInfo.businessType && styles.dropdownPlaceholder]}>
                {businessTypes.find(t => t.value === businessInfo.businessType)?.label || 'Select business type'}
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
                    key={type.value}
                    style={({ pressed }) => [
                      styles.dropdownItem,
                      businessInfo.businessType === type.value && styles.dropdownItemSelected,
                      pressed && styles.dropdownItemPressed,
                      index === businessTypes.length - 1 && styles.dropdownItemLast,
                    ]}
                    onPress={() => {
                      setBusinessInfo({ ...businessInfo, businessType: type.value });
                      setShowBusinessTypeDropdown(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      businessInfo.businessType === type.value && styles.dropdownItemTextSelected
                    ]}>
                      {type.label}
                    </Text>
                    {businessInfo.businessType === type.value && (
                      <Ionicons name="checkmark-circle" size={moderateScale(22)} color="#1C86FF" />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                value={businessInfo.description}
                onChangeText={(text) => setBusinessInfo({ ...businessInfo, description: text })}
                placeholder="Describe your business services"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* Contact Information Section */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="call-outline" size={moderateScale(24)} color="#1C86FF" />
            <Text style={styles.sectionTitle}>Contact Information</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={moderateScale(20)} color="#1C86FF" />
              <TextInput
                style={styles.input}
                value={businessInfo.contactInfo.email}
                onChangeText={(text) => setBusinessInfo({
                  ...businessInfo,
                  contactInfo: {...businessInfo.contactInfo, email: text}
                })}
                placeholder="Enter email address"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call" size={moderateScale(20)} color="#1C86FF" />
              <TextInput
                style={styles.input}
                value={businessInfo.contactInfo.phone}
                onChangeText={(text) => setBusinessInfo({
                  ...businessInfo,
                  contactInfo: {...businessInfo.contactInfo, phone: text}
                })}
                placeholder="Enter phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Website (Optional)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="globe" size={moderateScale(20)} color="#1C86FF" />
              <TextInput
                style={styles.input}
                value={businessInfo.contactInfo.website}
                onChangeText={(text) => setBusinessInfo({
                  ...businessInfo,
                  contactInfo: {...businessInfo.contactInfo, website: text}
                })}
                placeholder="Enter website URL"
                placeholderTextColor="#999"
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        {/* Credentials Section */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="ribbon-outline" size={moderateScale(24)} color="#1C86FF" />
            <Text style={styles.sectionTitle}>Credentials</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Add your professional licenses and certifications to build trust with customers
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>License Number</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="card" size={moderateScale(20)} color="#1C86FF" />
              <TextInput
                style={styles.input}
                value={businessInfo.credentials.licenseNumber}
                onChangeText={(text) => setBusinessInfo({
                  ...businessInfo,
                  credentials: {...businessInfo.credentials, licenseNumber: text}
                })}
                placeholder="Enter license number"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Certifications</Text>
            <View style={styles.addCertContainer}>
              <View style={[styles.inputContainer, {flex: 1, marginRight: moderateScale(10)}]}>
                <TextInput
                  style={styles.input}
                  value={newCertification}
                  onChangeText={setNewCertification}
                  placeholder="Add certification"
                  placeholderTextColor="#999"
                  onSubmitEditing={addCertification}
                />
              </View>
              <TouchableOpacity style={styles.addButton} onPress={addCertification}>
                <Ionicons name="add-circle" size={moderateScale(28)} color="#1C86FF" />
              </TouchableOpacity>
            </View>
            {businessInfo.credentials.certifications.length > 0 && (
              <View style={styles.certList}>
                {businessInfo.credentials.certifications.map((cert, index) => (
                  <View key={index} style={styles.certItem}>
                    <Ionicons name="ribbon" size={moderateScale(18)} color="#4CAF50" />
                    <Text style={styles.certText}>{cert}</Text>
                    <TouchableOpacity onPress={() => removeCertification(index)}>
                      <Ionicons name="close-circle" size={moderateScale(22)} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Insurance Information</Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                value={businessInfo.credentials.insuranceInfo}
                onChangeText={(text) => setBusinessInfo({
                  ...businessInfo,
                  credentials: {...businessInfo.credentials, insuranceInfo: text}
                })}
                placeholder="Enter insurance details (provider, policy number, coverage)"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* Verification Document Section */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="document-text-outline" size={moderateScale(24)} color="#1C86FF" />
            <Text style={styles.sectionTitle}>Verification Document</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Upload official documents to verify your business (business registration, permits, or licenses)
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Upload Document (PDF)</Text>
            <Text style={styles.hint}>Maximum file size: 5MB</Text>
            <TouchableOpacity
              style={styles.documentUploadContainer}
              onPress={handleDocumentPicker}
            >
              {businessInfo.verificationDocument ? (
                <View style={styles.documentUploaded}>
                  <Ionicons name="document-text" size={moderateScale(40)} color="#4CAF50" />
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentUploadedText}>
                      {typeof businessInfo.verificationDocument === 'string'
                        ? 'Document Uploaded'
                        : businessInfo.verificationDocument.name || 'Document Selected'}
                    </Text>
                    <Text style={styles.documentSubtext}>Tap to replace</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={moderateScale(28)} color="#4CAF50" />
                </View>
              ) : (
                <View style={styles.documentPlaceholder}>
                  <Ionicons name="cloud-upload-outline" size={moderateScale(48)} color="#1C86FF" />
                  <Text style={styles.documentUploadTitle}>Upload Verification Document</Text>
                  <Text style={styles.documentUploadSubtext}>
                    Tap to select a PDF file from your device
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={moderateScale(22)} color="#fff" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: moderateScale(10),
    fontSize: scaleFontSize(16),
    color: '#666',
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
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(8),
    gap: moderateScale(10),
  },
  sectionTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#1C86FF',
  },
  sectionSubtitle: {
    fontSize: scaleFontSize(13),
    color: '#666',
    lineHeight: scaleFontSize(18),
    marginBottom: moderateScale(16),
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
  hint: {
    fontSize: scaleFontSize(12),
    color: '#999',
    marginBottom: moderateScale(8),
    fontStyle: 'italic',
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
  textAreaContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    fontSize: scaleFontSize(15),
    color: '#333',
    minHeight: moderateScale(80),
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#1C86FF',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    shadowColor: '#1C86FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
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
  addCertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    padding: moderateScale(4),
  },
  certList: {
    marginTop: moderateScale(8),
  },
  certItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    marginBottom: moderateScale(8),
    gap: moderateScale(10),
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  certText: {
    flex: 1,
    fontSize: scaleFontSize(14),
    color: '#333',
    fontWeight: '500',
  },
  documentUploadContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    padding: moderateScale(20),
    minHeight: moderateScale(120),
    justifyContent: 'center',
  },
  documentPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentUploadTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: '#1C86FF',
    marginTop: moderateScale(12),
    marginBottom: moderateScale(4),
  },
  documentUploadSubtext: {
    fontSize: scaleFontSize(13),
    color: '#666',
    textAlign: 'center',
  },
  documentUploaded: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  documentInfo: {
    flex: 1,
  },
  documentUploadedText: {
    fontSize: scaleFontSize(15),
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: moderateScale(4),
  },
  documentSubtext: {
    fontSize: scaleFontSize(12),
    color: '#666',
  },
});
