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
  Linking,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from '@config/api';

const DOCUMENT_TYPES = [
  {
    type: 'governmentId',
    title: 'Government-Issued ID',
    description: 'Upload a valid government-issued identification document',
  },
  {
    type: 'businessRegistration',
    title: 'DTI or SEC Business Registration',
    description: 'Upload your DTI or SEC business registration certificate',
  },
  {
    type: 'birCertificate',
    title: 'BIR Certificate of Registration',
    description: 'Upload your BIR Certificate of Registration',
  },
];

export default function VerificationDocumentsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState(null);
  const [businessId, setBusinessId] = useState(null);
  const [verificationDocuments, setVerificationDocuments] = useState({
    governmentId: null,
    businessRegistration: null,
    birCertificate: null,
  });
  const [selectedFiles, setSelectedFiles] = useState({
    governmentId: null,
    businessRegistration: null,
    birCertificate: null,
  });

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

        // Handle the verificationDocuments object structure
        const docs = business.verificationDocuments || {};
        setVerificationDocuments({
          governmentId: docs.governmentId || null,
          businessRegistration: docs.businessRegistration || null,
          birCertificate: docs.birCertificate || null,
        });
      }
    } catch (error) {
      console.error('Error fetching verification documents:', error);
      Alert.alert('Error', 'Failed to load verification documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentPicker = async (documentType) => {
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
        setSelectedFiles(prev => ({ ...prev, [documentType]: doc }));
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleUpload = async (documentType) => {
    if (!businessId) {
      Alert.alert('Error', 'Business information not found. Please set up business details first.');
      return;
    }

    const selectedFile = selectedFiles[documentType];
    if (!selectedFile) {
      Alert.alert('Info', 'Please select a document to upload.');
      return;
    }

    try {
      setUploadingType(documentType);

      const docFormData = new FormData();
      const docUri = Platform.OS === 'ios'
        ? selectedFile.uri.replace('file://', '')
        : selectedFile.uri;

      docFormData.append('verificationDocument', {
        uri: docUri,
        name: selectedFile.name || 'verification.pdf',
        type: 'application/pdf',
      });

      await apiClient.post(
        `/businesses/verification/upload?businessId=${businessId}&documentType=${documentType}`,
        docFormData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      // Refresh the data
      await fetchVerificationDocument();

      // Clear the selected file
      setSelectedFiles(prev => ({ ...prev, [documentType]: null }));

      Alert.alert('Success', 'Verification document uploaded successfully!');
    } catch (error) {
      console.error('Error uploading document:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to upload verification document');
    } finally {
      setUploadingType(null);
    }
  };

  const handleRemoveDocument = (documentType) => {
    Alert.alert(
      'Remove Document',
      'Are you sure you want to remove this selected document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => setSelectedFiles(prev => ({ ...prev, [documentType]: null }))
        }
      ]
    );
  };

  const handleViewDocument = (url) => {
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Unable to open document');
      });
    }
  };

  const getStatusInfo = (document) => {
    if (!document || !document.url) {
      return { status: 'not_uploaded', color: '#999', icon: 'document-outline', text: 'Not Uploaded' };
    }

    switch (document.status) {
      case 'approved':
        return { status: 'approved', color: '#4CAF50', icon: 'checkmark-circle', text: 'Approved' };
      case 'rejected':
        return { status: 'rejected', color: '#FF6B6B', icon: 'close-circle', text: 'Rejected' };
      case 'pending':
      default:
        return { status: 'pending', color: '#FFA726', icon: 'time', text: 'Under Review' };
    }
  };

  const getCompletionStatus = () => {
    const uploaded = Object.values(verificationDocuments).filter(doc => doc && doc.url).length;
    const approved = Object.values(verificationDocuments).filter(doc => doc && doc.status === 'approved').length;
    return { uploaded, approved, total: 3 };
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
        {/* Progress Header */}
        <View style={styles.progressHeader}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="document-text-outline" size={moderateScale(24)} color="#1C86FF" />
            <Text style={styles.sectionTitle}>Verification Documents</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Upload all required documents for business verification
          </Text>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              Progress: {getCompletionStatus().uploaded}/{getCompletionStatus().total} uploaded
            </Text>
            {getCompletionStatus().approved > 0 && (
              <Text style={styles.progressApproved}>
                {getCompletionStatus().approved}/{getCompletionStatus().total} approved
              </Text>
            )}
          </View>
        </View>

        {/* Info Alert */}
        <View style={styles.infoAlert}>
          <Ionicons name="information-circle" size={moderateScale(20)} color="#1C86FF" />
          <Text style={styles.infoAlertText}>
            Upload all 3 required verification documents to get verified by admins.
          </Text>
        </View>

        {/* Document Cards */}
        {DOCUMENT_TYPES.map((docType) => {
          const document = verificationDocuments[docType.type];
          const selectedFile = selectedFiles[docType.type];
          const statusInfo = getStatusInfo(document);
          const isUploading = uploadingType === docType.type;

          return (
            <View key={docType.type} style={styles.documentCard}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Ionicons name="document-text" size={moderateScale(22)} color="#1C86FF" />
                  <Text style={styles.cardTitle}>{docType.title}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}15`, borderColor: statusInfo.color }]}>
                  <Ionicons name={statusInfo.icon} size={moderateScale(14)} color={statusInfo.color} />
                  <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
                </View>
              </View>

              <Text style={styles.cardDescription}>{docType.description}</Text>

              {/* Uploaded Document Display */}
              {document && document.url && (
                <View style={styles.uploadedDocumentContainer}>
                  <View style={styles.uploadedDocumentRow}>
                    <Ionicons name="document-text" size={moderateScale(32)} color="#1C86FF" />
                    <View style={styles.uploadedDocumentInfo}>
                      <Text style={styles.uploadedDocumentText}>Document Uploaded</Text>
                      <Text style={styles.uploadedDocumentSubtext}>PDF Document</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() => handleViewDocument(document.url)}
                    >
                      <Text style={styles.viewButtonText}>View</Text>
                      <Ionicons name="open-outline" size={moderateScale(16)} color="#1C86FF" />
                    </TouchableOpacity>
                  </View>

                  {/* Status Messages */}
                  {document.status === 'rejected' && document.notes && (
                    <View style={styles.rejectedAlert}>
                      <Ionicons name="close-circle" size={moderateScale(20)} color="#FF6B6B" />
                      <View style={styles.alertContent}>
                        <Text style={styles.rejectedAlertTitle}>Document Rejected</Text>
                        <Text style={styles.rejectedAlertText}>{document.notes}</Text>
                      </View>
                    </View>
                  )}

                  {document.status === 'approved' && (
                    <View style={styles.approvedAlert}>
                      <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#4CAF50" />
                      <View style={styles.alertContent}>
                        <Text style={styles.approvedAlertTitle}>Document Approved</Text>
                        <Text style={styles.approvedAlertText}>This document has been verified by our admin team.</Text>
                      </View>
                    </View>
                  )}

                  {document.status === 'pending' && (
                    <View style={styles.pendingAlert}>
                      <Ionicons name="time" size={moderateScale(20)} color="#FFA726" />
                      <View style={styles.alertContent}>
                        <Text style={styles.pendingAlertTitle}>Under Review</Text>
                        <Text style={styles.pendingAlertText}>Your document is being reviewed by our admin team.</Text>
                      </View>
                    </View>
                  )}

                  <Text style={styles.replaceHint}>You can replace it by uploading a new one below.</Text>
                </View>
              )}

              {/* Upload Section */}
              <View style={styles.uploadSection}>
                <TouchableOpacity
                  style={styles.selectFileButton}
                  onPress={() => handleDocumentPicker(docType.type)}
                  disabled={isUploading}
                >
                  <Ionicons name="folder-open-outline" size={moderateScale(20)} color="#1C86FF" />
                  <Text style={styles.selectFileText}>
                    {selectedFile ? 'Change File' : 'Select File'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.uploadButton, (!selectedFile || isUploading) && styles.uploadButtonDisabled]}
                  onPress={() => handleUpload(docType.type)}
                  disabled={!selectedFile || isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload" size={moderateScale(20)} color="#fff" />
                      <Text style={styles.uploadButtonText}>
                        {document && document.url ? 'Replace' : 'Upload'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {selectedFile && (
                <View style={styles.selectedFileInfo}>
                  <Text style={styles.selectedFileText}>Selected: {selectedFile.name}</Text>
                  <TouchableOpacity onPress={() => handleRemoveDocument(docType.type)}>
                    <Ionicons name="close-circle" size={moderateScale(18)} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.fileHint}>PDF only, max 5MB. Will be reviewed by our admin team.</Text>
            </View>
          );
        })}

        {/* Requirements Card */}
        <View style={styles.requirementsCard}>
          <Text style={styles.requirementsTitle}>Requirements:</Text>
          <Text style={styles.requirementsText}>
            • All documents must be in PDF format{'\n'}
            • Maximum file size: 5MB per document{'\n'}
            • All 3 documents are required for verification{'\n'}
            • Documents will be reviewed by our admin team
          </Text>
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
  progressHeader: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    marginBottom: moderateScale(16),
    elevation: 2,
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
    marginBottom: moderateScale(12),
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  progressText: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#333',
  },
  progressApproved: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#4CAF50',
  },
  infoAlert: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: moderateScale(12),
    padding: moderateScale(14),
    marginBottom: moderateScale(16),
    gap: moderateScale(10),
    borderLeftWidth: 3,
    borderLeftColor: '#1C86FF',
  },
  infoAlertText: {
    flex: 1,
    fontSize: scaleFontSize(13),
    color: '#1976D2',
    lineHeight: scaleFontSize(18),
  },
  documentCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(18),
    marginBottom: moderateScale(16),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    marginBottom: moderateScale(8),
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginBottom: moderateScale(8),
  },
  cardTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  cardDescription: {
    fontSize: scaleFontSize(12),
    color: '#666',
    lineHeight: scaleFontSize(17),
    marginBottom: moderateScale(12),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    gap: moderateScale(4),
  },
  statusText: {
    fontSize: scaleFontSize(11),
    fontWeight: '600',
  },
  uploadedDocumentContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    padding: moderateScale(14),
    marginBottom: moderateScale(12),
  },
  uploadedDocumentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    marginBottom: moderateScale(10),
  },
  uploadedDocumentInfo: {
    flex: 1,
  },
  uploadedDocumentText: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(2),
  },
  uploadedDocumentSubtext: {
    fontSize: scaleFontSize(12),
    color: '#666',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#1C86FF',
    gap: moderateScale(4),
  },
  viewButtonText: {
    fontSize: scaleFontSize(13),
    fontWeight: '600',
    color: '#1C86FF',
  },
  rejectedAlert: {
    flexDirection: 'row',
    backgroundColor: '#FFEBEE',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    gap: moderateScale(10),
    marginTop: moderateScale(8),
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B6B',
  },
  approvedAlert: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    gap: moderateScale(10),
    marginTop: moderateScale(8),
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  pendingAlert: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    gap: moderateScale(10),
    marginTop: moderateScale(8),
    borderLeftWidth: 3,
    borderLeftColor: '#FFA726',
  },
  alertContent: {
    flex: 1,
  },
  rejectedAlertTitle: {
    fontSize: scaleFontSize(13),
    fontWeight: '600',
    color: '#C62828',
    marginBottom: moderateScale(4),
  },
  rejectedAlertText: {
    fontSize: scaleFontSize(12),
    color: '#D32F2F',
    lineHeight: scaleFontSize(17),
  },
  approvedAlertTitle: {
    fontSize: scaleFontSize(13),
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: moderateScale(4),
  },
  approvedAlertText: {
    fontSize: scaleFontSize(12),
    color: '#388E3C',
    lineHeight: scaleFontSize(17),
  },
  pendingAlertTitle: {
    fontSize: scaleFontSize(13),
    fontWeight: '600',
    color: '#E65100',
    marginBottom: moderateScale(4),
  },
  pendingAlertText: {
    fontSize: scaleFontSize(12),
    color: '#EF6C00',
    lineHeight: scaleFontSize(17),
  },
  replaceHint: {
    fontSize: scaleFontSize(11),
    color: '#999',
    marginTop: moderateScale(8),
    fontStyle: 'italic',
  },
  uploadSection: {
    flexDirection: 'row',
    gap: moderateScale(10),
    marginBottom: moderateScale(8),
  },
  selectFileButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(10),
    paddingVertical: moderateScale(12),
    borderWidth: 1,
    borderColor: '#1C86FF',
    gap: moderateScale(6),
  },
  selectFileText: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#1C86FF',
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1C86FF',
    borderRadius: moderateScale(10),
    paddingVertical: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(6),
    elevation: 3,
    shadowColor: '#1C86FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  uploadButtonDisabled: {
    backgroundColor: '#BDBDBD',
    shadowOpacity: 0,
    elevation: 0,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(14),
    fontWeight: 'bold',
  },
  selectedFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E3F2FD',
    borderRadius: moderateScale(8),
    padding: moderateScale(10),
    marginBottom: moderateScale(8),
  },
  selectedFileText: {
    flex: 1,
    fontSize: scaleFontSize(12),
    color: '#1976D2',
    marginRight: moderateScale(8),
  },
  fileHint: {
    fontSize: scaleFontSize(11),
    color: '#999',
    fontStyle: 'italic',
  },
  requirementsCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
  },
  requirementsTitle: {
    fontSize: scaleFontSize(13),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(8),
  },
  requirementsText: {
    fontSize: scaleFontSize(12),
    color: '#666',
    lineHeight: scaleFontSize(18),
  },
});
