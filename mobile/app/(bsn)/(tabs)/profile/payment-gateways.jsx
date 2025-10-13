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
  ActivityIndicator,
  Platform,
} from 'react-native';
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
  const [paymentQR, setPaymentQR] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [paymentType, setPaymentType] = useState('gcash');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

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

        // Check if business has paymentQRCode field (single QR)
        if (business.paymentQRCode) {
          setPaymentQR({
            imageUrl: business.paymentQRCode,
            type: 'qr-code',
          });
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

    if (!accountName.trim()) {
      Alert.alert('Error', 'Please enter account name');
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
      formData.append('accountName', accountName);
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

  const handleDeleteQR = () => {
    if (!businessId || !paymentQR) return;

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
                data: { imageUrl: paymentQR.imageUrl },
              });
              Alert.alert('Success', 'Payment QR code deleted successfully');
              setPaymentQR(null);
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
          title="Payment QR Code"
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
        title="Payment QR Code"
        showBack={true}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={moderateScale(24)} color="#1C86FF" />
          <Text style={styles.infoText}>
            Upload your payment QR code so customers can easily pay for your services via GCash, PayMaya, or bank transfer.
          </Text>
        </View>

        {/* Current QR Code */}
        {paymentQR && (
          <View style={styles.currentQRCard}>
            <Text style={styles.sectionTitle}>Current Payment QR Code</Text>
            <View style={styles.qrImageContainer}>
              <Image
                source={{ uri: paymentQR.imageUrl }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteQR}
            >
              <Ionicons name="trash-outline" size={moderateScale(20)} color="#FF6B6B" />
              <Text style={styles.deleteButtonText}>Delete QR Code</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Upload New QR */}
        <View style={styles.uploadCard}>
          <Text style={styles.sectionTitle}>
            {paymentQR ? 'Update Payment QR Code' : 'Upload Payment QR Code'}
          </Text>

          {/* Payment Type Selection */}
          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.typeGrid}>
            {paymentTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeCard,
                  paymentType === type.value && styles.typeCardActive,
                ]}
                onPress={() => setPaymentType(type.value)}
              >
                <View style={[styles.typeIcon, { backgroundColor: type.color }]}>
                  <Ionicons name={type.icon} size={moderateScale(20)} color="#fff" />
                </View>
                <Text style={styles.typeLabel}>{type.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Account Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Name *</Text>
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
              (!selectedImage || !accountName.trim() || uploading) && styles.uploadButtonDisabled,
            ]}
            onPress={handleUploadQR}
            disabled={!selectedImage || !accountName.trim() || uploading}
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
    paddingBottom: moderateScale(100),
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
  currentQRCard: {
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
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(10),
    marginBottom: moderateScale(20),
  },
  typeCard: {
    width: '22%',
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardActive: {
    borderColor: '#1C86FF',
    backgroundColor: '#E3F2FD',
  },
  typeIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(6),
  },
  typeLabel: {
    fontSize: scaleFontSize(11),
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
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
});
