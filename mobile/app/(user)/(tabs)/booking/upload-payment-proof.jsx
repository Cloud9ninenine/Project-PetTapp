import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from '@config/api';

const UploadPaymentProofScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { bookingId } = params;

  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Request permissions
  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to upload payment proof.'
        );
        return false;
      }
    }
    return true;
  };

  const handlePickImage = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera permissions to take a photo.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      Alert.alert('No Image Selected', 'Please select an image to upload.');
      return;
    }

    try {
      setUploading(true);

      // Create FormData
      const formData = new FormData();

      // Extract filename and determine mime type
      const uri = selectedImage.uri;
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('paymentProof', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: filename || 'payment-proof.jpg',
        type,
      });

      // Upload to API
      const response = await apiClient.post(
        `/bookings/${bookingId}/payment-proof`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        Alert.alert(
          'Success',
          'Payment proof uploaded successfully. Your booking will be reviewed shortly.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.back();
              },
            },
          ]
        );
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading payment proof:', error);
      Alert.alert(
        'Upload Failed',
        error.response?.data?.message || 'Failed to upload payment proof. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={moderateScale(24)} color="#1C86FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Payment Proof</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={moderateScale(24)} color="#1C86FF" />
          <Text style={styles.infoText}>
            Upload a clear screenshot or photo of your payment confirmation from GCash, PayMaya, or your bank app.
          </Text>
        </View>

        {/* Image Preview or Placeholder */}
        {selectedImage ? (
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: selectedImage.uri }}
              style={styles.imagePreview}
              resizeMode="contain"
            />
            <TouchableOpacity style={styles.removeImageButton} onPress={handleRemoveImage}>
              <Ionicons name="close-circle" size={moderateScale(32)} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={moderateScale(80)} color="#ccc" />
            <Text style={styles.placeholderText}>No image selected</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handlePickImage}
            disabled={uploading}
          >
            <Ionicons name="images-outline" size={moderateScale(24)} color="#1C86FF" />
            <Text style={styles.actionButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleTakePhoto}
            disabled={uploading}
          >
            <Ionicons name="camera-outline" size={moderateScale(24)} color="#1C86FF" />
            <Text style={styles.actionButtonText}>Take Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Requirements */}
        <View style={styles.requirementsCard}>
          <Text style={styles.requirementsTitle}>Image Requirements</Text>

          <View style={styles.requirementItem}>
            <View style={styles.bulletPoint}>
              <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#4CAF50" />
            </View>
            <Text style={styles.requirementText}>Screenshot must be clear and readable</Text>
          </View>

          <View style={styles.requirementItem}>
            <View style={styles.bulletPoint}>
              <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#4CAF50" />
            </View>
            <Text style={styles.requirementText}>
              Payment confirmation should show transaction ID and amount
            </Text>
          </View>

          <View style={styles.requirementItem}>
            <View style={styles.bulletPoint}>
              <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#4CAF50" />
            </View>
            <Text style={styles.requirementText}>
              Ensure the payment date and time are visible
            </Text>
          </View>

          <View style={styles.requirementItem}>
            <View style={styles.bulletPoint}>
              <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#4CAF50" />
            </View>
            <Text style={styles.requirementText}>File size should not exceed 5MB</Text>
          </View>

          <View style={styles.requirementItem}>
            <View style={styles.bulletPoint}>
              <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#4CAF50" />
            </View>
            <Text style={styles.requirementText}>
              Supported formats: JPG, PNG, JPEG
            </Text>
          </View>
        </View>

        {/* Warning Card */}
        <View style={styles.warningCard}>
          <Ionicons name="alert-circle-outline" size={moderateScale(20)} color="#FF9B79" />
          <Text style={styles.warningText}>
            Your payment will be verified by the business. Please ensure the screenshot is authentic and matches your booking details.
          </Text>
        </View>

        {/* Example Section */}
        <View style={styles.exampleCard}>
          <Text style={styles.exampleTitle}>Example of Good Payment Proof</Text>
          <View style={styles.exampleImagePlaceholder}>
            <Ionicons name="receipt-outline" size={moderateScale(60)} color="#1C86FF" />
            <Text style={styles.exampleText}>
              Screenshot should clearly show:
            </Text>
            <Text style={styles.exampleBullet}>• Payment method logo (GCash, PayMaya, etc.)</Text>
            <Text style={styles.exampleBullet}>• Transaction ID or reference number</Text>
            <Text style={styles.exampleBullet}>• Amount paid</Text>
            <Text style={styles.exampleBullet}>• Recipient/Business name</Text>
            <Text style={styles.exampleBullet}>• Date and time of transaction</Text>
            <Text style={styles.exampleBullet}>• "Successful" or "Completed" status</Text>
          </View>
        </View>
      </ScrollView>

      {/* Upload Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.uploadButton,
            (!selectedImage || uploading) && styles.uploadButtonDisabled,
          ]}
          onPress={handleUpload}
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
              <Text style={styles.uploadButtonText}>Upload Payment Proof</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingTop: hp(6),
    paddingBottom: hp(2),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: moderateScale(8),
  },
  headerTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: '600',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: wp(4),
    paddingBottom: hp(12),
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
  imagePreviewContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: hp(40),
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
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    height: hp(30),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2),
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ddd',
  },
  placeholderText: {
    marginTop: moderateScale(12),
    fontSize: scaleFontSize(14),
    color: '#999',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(2),
    gap: wp(3),
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(16),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1C86FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: scaleFontSize(13),
    color: '#1C86FF',
    fontWeight: '600',
    marginTop: moderateScale(8),
    textAlign: 'center',
  },
  requirementsCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: hp(2),
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
    marginBottom: moderateScale(10),
  },
  bulletPoint: {
    marginRight: moderateScale(10),
  },
  requirementText: {
    flex: 1,
    fontSize: scaleFontSize(13),
    color: '#666',
    lineHeight: scaleFontSize(18),
  },
  warningCard: {
    backgroundColor: '#FFF4E6',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(2),
    borderLeftWidth: 4,
    borderLeftColor: '#FF9B79',
  },
  warningText: {
    flex: 1,
    fontSize: scaleFontSize(13),
    color: '#666',
    lineHeight: scaleFontSize(18),
    marginLeft: moderateScale(12),
  },
  exampleCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exampleTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: '700',
    color: '#333',
    marginBottom: moderateScale(12),
  },
  exampleImagePlaceholder: {
    backgroundColor: '#f8f9fa',
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    alignItems: 'center',
  },
  exampleText: {
    fontSize: scaleFontSize(14),
    color: '#666',
    marginTop: moderateScale(12),
    marginBottom: moderateScale(8),
    fontWeight: '600',
  },
  exampleBullet: {
    fontSize: scaleFontSize(12),
    color: '#666',
    lineHeight: scaleFontSize(18),
    alignSelf: 'flex-start',
    marginLeft: moderateScale(8),
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: wp(4),
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  uploadButton: {
    backgroundColor: '#1C86FF',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(14),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginLeft: moderateScale(8),
  },
});

export default UploadPaymentProofScreen;
