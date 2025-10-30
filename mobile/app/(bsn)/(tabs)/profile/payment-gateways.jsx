import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from "@config/api";

export default function PaymentQRScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [businessId, setBusinessId] = useState(null);
  const [paymentQRCodes, setPaymentQRCodes] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [paymentType, setPaymentType] = useState('gcash');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  // Payment Options State
  const [paymentTiming, setPaymentTiming] = useState('both');
  const [savingOptions, setSavingOptions] = useState(false);

  // Dropdown State
  const [showPaymentTypeDropdown, setShowPaymentTypeDropdown] = useState(false);

  useEffect(() => {
    fetchBusinessAndQR();
  }, []);

  const fetchBusinessAndQR = async () => {
    try {
      setLoading(true);

      // Fetch business to get businessId
      const businessRes = await apiClient.get('/businesses');
      if (businessRes.data && businessRes.data.data && businessRes.data.data.length > 0) {
        const business = businessRes.data.data[0];
        setBusinessId(business._id);

        // Fetch payment QR codes using the dedicated endpoint
        try {
          const qrRes = await apiClient.get(`/businesses/${business._id}/payment-qr`);
          if (qrRes.data && qrRes.data.data && qrRes.data.data.qrCodes) {
            // Store all QR codes
            setPaymentQRCodes(qrRes.data.data.qrCodes);
          }
        } catch (qrError) {
          // QR codes not found is not an error, just means none uploaded yet
          console.log('No payment QR codes found');
        }

        // Fetch payment options
        try {
          const optionsRes = await apiClient.get(`/businesses/${business._id}/payment-options`);
          if (optionsRes.data && optionsRes.data.data) {
            const timing = optionsRes.data.data.paymentOptions?.timing || 'both';
            setPaymentTiming(timing);
          }
        } catch (optionsError) {
          console.log('No payment options found, using default');
        }
      }
    } catch (error) {
      console.error('Error fetching business/QR:', error);
      Alert.alert('Error', 'Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need camera roll permissions to upload QR code.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleUploadQR = async () => {
    if (!businessId) {
      Alert.alert('Error', 'Business information not found');
      return;
    }

    if (!selectedImage) {
      Alert.alert('Error', 'Please select a QR code image');
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      // Extract filename and determine mime type
      const uri = selectedImage.uri;
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: filename || 'payment-qr.jpg',
        type,
      });

      formData.append('type', paymentType);
      if (accountName.trim()) {
        formData.append('accountName', accountName);
      }
      if (accountNumber.trim()) {
        formData.append('accountNumber', accountNumber);
      }

      const response = await apiClient.post(
        `/businesses/${businessId}/payment-qr`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        Alert.alert('Success', 'Payment QR code uploaded successfully!');
        setSelectedImage(null);
        setAccountName('');
        setAccountNumber('');
        fetchBusinessAndQR(); // Refresh to show new QR
      }
    } catch (error) {
      console.error('Error uploading QR:', error);
      Alert.alert(
        'Upload Failed',
        error.response?.data?.message || 'Failed to upload payment QR code'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSavePaymentOptions = async () => {
    if (!businessId) {
      Alert.alert('Error', 'Business information not found');
      return;
    }

    try {
      setSavingOptions(true);

      const response = await apiClient.put(
        `/businesses/${businessId}/payment-options`,
        {
          paymentOptions: {
            timing: paymentTiming,
          },
        }
      );

      if (response.status === 200) {
        Alert.alert('Success', 'Payment options updated successfully!');
      }
    } catch (error) {
      console.error('Error updating payment options:', error);
      Alert.alert(
        'Update Failed',
        error.response?.data?.message || 'Failed to update payment options'
      );
    } finally {
      setSavingOptions(false);
    }
  };

  const handleDeleteQR = (qrCode) => {
    if (!businessId || !qrCode) return;

    Alert.alert(
      'Delete QR Code',
      'Are you sure you want to delete this payment QR code?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/businesses/${businessId}/payment-qr`, {
                data: { imageUrl: qrCode.imageUrl },
              });
              Alert.alert('Success', 'Payment QR code deleted successfully');
              fetchBusinessAndQR(); // Refresh the list
            } catch (error) {
              console.error('Error deleting QR:', error);
              Alert.alert('Error', 'Failed to delete payment QR code');
            }
          },
        },
      ]
    );
  };

  const paymentTypes = [
    { value: 'gcash', label: 'GCash', icon: 'wallet', color: '#007DFF' },
    { value: 'paymaya', label: 'PayMaya', icon: 'card', color: '#00D632' },
    { value: 'bank', label: 'Bank', icon: 'business', color: '#FF6B6B' },
    { value: 'other', label: 'Other', icon: 'ellipsis-horizontal', color: '#9C27B0' },
  ];

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
          title="Payment Gateways"
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
        title="Payment Settings"
        showBack={true}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={moderateScale(24)} color="#1C86FF" />
          <Text style={styles.infoText}>
            Configure when customers should pay and upload payment QR codes for easy transactions.
          </Text>
        </View>

        {/* Payment Options Section */}
        <View style={styles.uploadCard}>
          <Text style={styles.sectionTitle}>Payment Timing</Text>
          <Text style={styles.sectionDescription}>
            Choose when customers should make payment for your services
          </Text>

          <View style={styles.paymentTimingContainer}>
            <TouchableOpacity
              style={[
                styles.timingOption,
                paymentTiming === 'payment-first' && styles.timingOptionActive,
              ]}
              onPress={() => setPaymentTiming('payment-first')}
            >
              <View style={styles.timingOptionHeader}>
                <Ionicons
                  name="card"
                  size={moderateScale(24)}
                  color={paymentTiming === 'payment-first' ? '#1C86FF' : '#666'}
                />
                <View style={styles.radioButton}>
                  {paymentTiming === 'payment-first' && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </View>
              <Text style={[
                styles.timingOptionTitle,
                paymentTiming === 'payment-first' && styles.timingOptionTitleActive,
              ]}>
                Payment First
              </Text>
              <Text style={styles.timingOptionDescription}>
                Customer pays before receiving service
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.timingOption,
                paymentTiming === 'payment-after' && styles.timingOptionActive,
              ]}
              onPress={() => setPaymentTiming('payment-after')}
            >
              <View style={styles.timingOptionHeader}>
                <Ionicons
                  name="time"
                  size={moderateScale(24)}
                  color={paymentTiming === 'payment-after' ? '#1C86FF' : '#666'}
                />
                <View style={styles.radioButton}>
                  {paymentTiming === 'payment-after' && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </View>
              <Text style={[
                styles.timingOptionTitle,
                paymentTiming === 'payment-after' && styles.timingOptionTitleActive,
              ]}>
                Payment After
              </Text>
              <Text style={styles.timingOptionDescription}>
                Customer pays after receiving service
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.timingOption,
                paymentTiming === 'both' && styles.timingOptionActive,
              ]}
              onPress={() => setPaymentTiming('both')}
            >
              <View style={styles.timingOptionHeader}>
                <Ionicons
                  name="swap-horizontal"
                  size={moderateScale(24)}
                  color={paymentTiming === 'both' ? '#1C86FF' : '#666'}
                />
                <View style={styles.radioButton}>
                  {paymentTiming === 'both' && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </View>
              <Text style={[
                styles.timingOptionTitle,
                paymentTiming === 'both' && styles.timingOptionTitleActive,
              ]}>
                Both Options
              </Text>
              <Text style={styles.timingOptionDescription}>
                Accept payment before or after service
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.saveOptionsButton,
              savingOptions && styles.uploadButtonDisabled,
            ]}
            onPress={handleSavePaymentOptions}
            disabled={savingOptions}
          >
            {savingOptions ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.uploadButtonText}>Saving...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={moderateScale(24)} color="#fff" />
                <Text style={styles.uploadButtonText}>Save Payment Options</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Current QR Codes */}
        {paymentQRCodes.length > 0 && (
          <View style={styles.qrCodesSection}>
            <Text style={styles.sectionTitle}>Current Payment QR Codes ({paymentQRCodes.length})</Text>
            {paymentQRCodes.map((qrCode, index) => (
              <View key={index} style={styles.currentQRCard}>
                <View style={styles.qrHeader}>
                  <View style={styles.qrTypeContainer}>
                    <Ionicons
                      name={
                        qrCode.type === 'gcash' ? 'wallet' :
                        qrCode.type === 'paymaya' ? 'card' :
                        qrCode.type === 'bank' ? 'business' :
                        'ellipsis-horizontal'
                      }
                      size={moderateScale(20)}
                      color="#1C86FF"
                    />
                    <Text style={styles.qrTypeText}>
                      {qrCode.type === 'gcash' ? 'GCash' :
                       qrCode.type === 'paymaya' ? 'PayMaya' :
                       qrCode.type === 'bank' ? 'Bank' :
                       'Other'}
                    </Text>
                  </View>
                  {qrCode.accountName && (
                    <Text style={styles.qrAccountName}>{qrCode.accountName}</Text>
                  )}
                  {qrCode.accountNumber && (
                    <Text style={styles.qrAccountNumber}>Account #: {qrCode.accountNumber}</Text>
                  )}
                  {qrCode.uploadedAt && (
                    <Text style={styles.qrUploadDate}>
                      Uploaded: {new Date(qrCode.uploadedAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                <View style={styles.qrImageContainer}>
                  <Image
                    source={{ uri: qrCode.imageUrl }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteQR(qrCode)}
                >
                  <Ionicons name="trash-outline" size={moderateScale(20)} color="#FF6B6B" />
                  <Text style={styles.deleteButtonText}>Delete QR Code</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Upload New QR */}
        <View style={styles.uploadCard}>
          <Text style={styles.sectionTitle}>Payment QR Codes</Text>
          <Text style={styles.sectionDescription}>
            {paymentQRCodes.length > 0
              ? 'Upload QR codes for GCash, PayMaya, or bank transfer'
              : 'Upload your first payment QR code for customers to scan and pay'}
          </Text>

          {/* Payment Type Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Method</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowPaymentTypeDropdown(!showPaymentTypeDropdown)}
            >
              <View style={styles.dropdownSelected}>
                <View style={styles.dropdownIconContainer}>
                  <View
                    style={[
                      styles.dropdownIconCircle,
                      {
                        backgroundColor: paymentTypes.find((t) => t.value === paymentType)
                          ?.color,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        paymentTypes.find((t) => t.value === paymentType)?.icon ||
                        'wallet'
                      }
                      size={moderateScale(18)}
                      color="#fff"
                    />
                  </View>
                  <Text style={styles.dropdownText}>
                    {paymentTypes.find((t) => t.value === paymentType)?.label ||
                      'Select payment type'}
                  </Text>
                </View>
                <Ionicons
                  name={showPaymentTypeDropdown ? 'chevron-up' : 'chevron-down'}
                  size={moderateScale(20)}
                  color="#666"
                />
              </View>
            </TouchableOpacity>

            {showPaymentTypeDropdown && (
              <View style={styles.dropdownList}>
                {paymentTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.dropdownItem,
                      paymentType === type.value && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setPaymentType(type.value);
                      setShowPaymentTypeDropdown(false);
                    }}
                  >
                    <View
                      style={[
                        styles.dropdownItemIconCircle,
                        { backgroundColor: type.color },
                      ]}
                    >
                      <Ionicons name={type.icon} size={moderateScale(18)} color="#fff" />
                    </View>
                    <Text
                      style={[
                        styles.dropdownItemText,
                        paymentType === type.value && styles.dropdownItemTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                    {paymentType === type.value && (
                      <Ionicons
                        name="checkmark-circle"
                        size={moderateScale(20)}
                        color="#1C86FF"
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Account Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Name (Optional)</Text>
            <TextInput
              style={styles.input}
              value={accountName}
              onChangeText={setAccountName}
              placeholder="Enter account name"
              placeholderTextColor="#999"
            />
          </View>

          {/* Account Number Input (Optional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Number (Optional)</Text>
            <TextInput
              style={styles.input}
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="Enter account number"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>

          {/* Image Picker */}
          {selectedImage ? (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: selectedImage.uri }}
                style={styles.imagePreview}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setSelectedImage(null)}
              >
                <Ionicons name="close-circle" size={moderateScale(32)} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.imagePlaceholder}
              onPress={handlePickImage}
            >
              <Ionicons name="image-outline" size={moderateScale(60)} color="#ccc" />
              <Text style={styles.placeholderText}>Tap to select QR code image</Text>
            </TouchableOpacity>
          )}

          {/* Upload Button */}
          <TouchableOpacity
            style={[
              styles.uploadButton,
              (!selectedImage || uploading) && styles.uploadButtonDisabled,
            ]}
            onPress={handleUploadQR}
            disabled={!selectedImage || uploading}
          >
            {uploading ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.uploadButtonText}>Uploading...</Text>
              </>
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={moderateScale(24)} color="#fff" />
                <Text style={styles.uploadButtonText}>Upload QR Code</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Requirements Card */}
        <View style={styles.requirementsCard}>
          <Text style={styles.requirementsTitle}>QR Code Requirements</Text>

          <View style={styles.requirementItem}>
            <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#4CAF50" />
            <Text style={styles.requirementText}>Clear and readable QR code</Text>
          </View>

          <View style={styles.requirementItem}>
            <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#4CAF50" />
            <Text style={styles.requirementText}>Payment method logo visible (GCash, PayMaya, etc.)</Text>
          </View>

          <View style={styles.requirementItem}>
            <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#4CAF50" />
            <Text style={styles.requirementText}>Account name should match your business name</Text>
          </View>

          <View style={styles.requirementItem}>
            <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#4CAF50" />
            <Text style={styles.requirementText}>Supported formats: JPG, PNG, JPEG</Text>
          </View>

          <View style={styles.requirementItem}>
            <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#4CAF50" />
            <Text style={styles.requirementText}>Maximum file size: 5MB</Text>
          </View>
        </View>
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
    paddingBottom: moderateScale(20),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(40),
  },
  loadingText: {
    marginTop: moderateScale(12),
    fontSize: scaleFontSize(14),
    color: '#666',
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(2),
    borderLeftWidth: 4,
    borderLeftColor: '#1C86FF',
  },
  infoText: {
    flex: 1,
    fontSize: scaleFontSize(13),
    color: '#333',
    lineHeight: scaleFontSize(18),
    marginLeft: moderateScale(12),
  },
  qrCodesSection: {
    marginBottom: moderateScale(20),
  },
  currentQRCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    marginBottom: moderateScale(15),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrHeader: {
    marginBottom: moderateScale(12),
  },
  qrTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginBottom: moderateScale(4),
  },
  qrTypeText: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: '#1C86FF',
  },
  qrAccountName: {
    fontSize: scaleFontSize(14),
    color: '#666',
    marginTop: moderateScale(2),
  },
  qrAccountNumber: {
    fontSize: scaleFontSize(13),
    color: '#666',
    marginTop: moderateScale(4),
    fontWeight: '500',
  },
  qrUploadDate: {
    fontSize: scaleFontSize(12),
    color: '#999',
    marginTop: moderateScale(6),
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: '700',
    color: '#333',
    marginBottom: moderateScale(16),
  },
  qrImageContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  qrImage: {
    width: moderateScale(250),
    height: moderateScale(250),
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE5E5',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(12),
    gap: moderateScale(8),
  },
  deleteButtonText: {
    color: '#FF6B6B',
    fontSize: scaleFontSize(15),
    fontWeight: '600',
  },
  uploadCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    marginBottom: moderateScale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: scaleFontSize(15),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(8),
  },
  dropdown: {
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dropdownSelected: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(12),
  },
  dropdownIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  dropdownIconCircle: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: scaleFontSize(15),
    color: '#333',
    fontWeight: '500',
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    marginTop: moderateScale(8),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(12),
    gap: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemActive: {
    backgroundColor: '#E3F2FD',
  },
  dropdownItemIconCircle: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownItemText: {
    flex: 1,
    fontSize: scaleFontSize(15),
    color: '#333',
    fontWeight: '500',
  },
  dropdownItemTextActive: {
    color: '#1C86FF',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: moderateScale(16),
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(12),
    fontSize: scaleFontSize(15),
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  imagePreviewContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: moderateScale(16),
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: moderateScale(250),
    borderRadius: moderateScale(8),
  },
  removeImageButton: {
    position: 'absolute',
    top: moderateScale(24),
    right: moderateScale(24),
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  imagePlaceholder: {
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    height: moderateScale(200),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(16),
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ddd',
  },
  placeholderText: {
    marginTop: moderateScale(12),
    fontSize: scaleFontSize(14),
    color: '#999',
  },
  uploadButton: {
    backgroundColor: '#1C86FF',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(14),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: moderateScale(8),
    shadowColor: '#1C86FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  uploadButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: '700',
  },
  requirementsCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requirementsTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: '700',
    color: '#333',
    marginBottom: moderateScale(12),
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: moderateScale(10),
    marginBottom: moderateScale(10),
  },
  requirementText: {
    flex: 1,
    fontSize: scaleFontSize(13),
    color: '#666',
    lineHeight: scaleFontSize(18),
  },
  sectionDescription: {
    fontSize: scaleFontSize(14),
    color: '#666',
    marginBottom: moderateScale(16),
    lineHeight: scaleFontSize(20),
  },
  paymentTimingContainer: {
    gap: moderateScale(12),
    marginBottom: moderateScale(20),
  },
  timingOption: {
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  timingOptionActive: {
    borderColor: '#1C86FF',
    backgroundColor: '#E3F2FD',
  },
  timingOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  timingOptionTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(4),
  },
  timingOptionTitleActive: {
    color: '#1C86FF',
  },
  timingOptionDescription: {
    fontSize: scaleFontSize(13),
    color: '#666',
    lineHeight: scaleFontSize(18),
  },
  radioButton: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    borderWidth: 2,
    borderColor: '#1C86FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    backgroundColor: '#1C86FF',
  },
  saveOptionsButton: {
    backgroundColor: '#4CAF50',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(14),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: moderateScale(8),
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
