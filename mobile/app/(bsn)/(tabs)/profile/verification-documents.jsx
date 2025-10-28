import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from '@config/api';

export default function VerificationDocumentsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [businessId, setBusinessId] = useState(null);
  const [verificationDocument, setVerificationDocument] = useState(null);

  useEffect(() => {
    fetchVerificationDocument();
  }, []);

  const fetchVerificationDocument = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/businesses');

      if (response.data && response.data.data && response.data.data.length > 0) {
        const business = response.data.data[0];
        setBusinessId(business._id);
        setVerificationDocument(business.verificationDocument || null);
      }
    } catch (error) {
      console.error('Error fetching verification document:', error);
      Alert.alert('Error', 'Failed to load verification document');
    } finally {
      setLoading(false);
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
        setVerificationDocument(doc);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleUpload = async () => {
    if (!businessId) {
      Alert.alert('Error', 'Business information not found. Please set up business details first.');
      return;
    }

    if (!verificationDocument || typeof verificationDocument === 'string') {
      Alert.alert('Info', 'Please select a new document to upload.');
      return;
    }

    try {
      setUploading(true);

      const docFormData = new FormData();
      const docUri = Platform.OS === 'ios'
        ? verificationDocument.uri.replace('file://', '')
        : verificationDocument.uri;

      docFormData.append('verificationDocument', {
        uri: docUri,
        name: verificationDocument.name || 'verification.pdf',
        type: 'application/pdf',
      });

      await apiClient.post(`/businesses/verification/upload?businessId=${businessId}`, docFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Success', 'Verification document uploaded successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error uploading document:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to upload verification document');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveDocument = () => {
    Alert.alert(
      'Remove Document',
      'Are you sure you want to remove this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => setVerificationDocument(null)
        }
      ]
    );
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
          title="Verification Documents"
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
        title="Verification Documents"
        showBack={true}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formSection}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="document-text-outline" size={moderateScale(24)} color="#1C86FF" />
            <Text style={styles.sectionTitle}>Business Verification</Text>
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
              {verificationDocument ? (
                <View style={styles.documentUploaded}>
                  <Ionicons name="document-text" size={moderateScale(40)} color="#4CAF50" />
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentUploadedText}>
                      {typeof verificationDocument === 'string'
                        ? 'Document Uploaded'
                        : verificationDocument.name || 'Document Selected'}
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

            {verificationDocument && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={handleRemoveDocument}
                >
                  <Ionicons name="trash-outline" size={moderateScale(20)} color="#FF6B6B" />
                  <Text style={styles.removeButtonText}>Remove Document</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={moderateScale(24)} color="#1C86FF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Required Documents</Text>
              <Text style={styles.infoText}>
                • Business registration certificate{'\n'}
                • Professional licenses{'\n'}
                • Permits or authorization documents{'\n'}
                • Insurance certificates
              </Text>
            </View>
          </View>
        </View>

        {verificationDocument && typeof verificationDocument !== 'string' && (
          <TouchableOpacity
            style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
            onPress={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={moderateScale(22)} color="#fff" />
                <Text style={styles.uploadButtonText}>Upload Document</Text>
              </>
            )}
          </TouchableOpacity>
        )}
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
  actionButtons: {
    marginTop: moderateScale(12),
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    borderWidth: 1,
    borderColor: '#FF6B6B',
    gap: moderateScale(8),
  },
  removeButtonText: {
    color: '#FF6B6B',
    fontSize: scaleFontSize(14),
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    gap: moderateScale(12),
    borderLeftWidth: 4,
    borderLeftColor: '#1C86FF',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: scaleFontSize(15),
    fontWeight: '600',
    color: '#1C86FF',
    marginBottom: moderateScale(8),
  },
  infoText: {
    fontSize: scaleFontSize(13),
    color: '#666',
    lineHeight: scaleFontSize(20),
  },
  uploadButton: {
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
  uploadButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
});
