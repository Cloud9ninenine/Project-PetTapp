
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
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from '@config/api';

export default function VerificationPaymentsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businessId, setBusinessId] = useState(null);

  const [isVerified, setIsVerified] = useState(false);
  const [verificationDocs, setVerificationDocs] = useState({});
  const [paymentOptions, setPaymentOptions] = useState({ timing: 'both' });
  const [qrCodes, setQrCodes] = useState([]);

  useEffect(() => {
    fetchBusinessDetails();
  }, []);

  const fetchBusinessDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/businesses');
      if (response.data && response.data.data && response.data.data.length > 0) {
        const business = response.data.data[0];
        setBusinessId(business._id);
        setIsVerified(business.isVerified || false);
        setVerificationDocs(business.verificationDocuments || {});
        if (business.paymentOptions) {
          setPaymentOptions(business.paymentOptions);
        }
        // Fetch QR Codes separately
        const qrResponse = await apiClient.get(`/businesses/${business._id}/payment-qr`);
        if (qrResponse.data && qrResponse.data.data) {
          setQrCodes(qrResponse.data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching details:', error);
      Alert.alert('Error', 'Failed to load details.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async (documentType) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (result.type === 'success') {
        const formData = new FormData();
        formData.append('verificationDocument', {
          uri: result.uri,
          name: result.name,
          type: 'application/pdf',
        });

        await apiClient.post(
          `/businesses/verification/upload?businessId=${businessId}&documentType=${documentType}`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        Alert.alert('Success', 'Document uploaded for review.');
        fetchBusinessDetails(); // Refresh data
      }    } catch (error) {
      console.error(`Error uploading ${documentType}:`, error);
      Alert.alert('Error', `Failed to upload ${documentType}.`);
    }
  };

  const handleUploadQR = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need camera roll access.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const asset = result.assets[0];
      const formData = new FormData();
      const uri = Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri;
      formData.append('image', {
        uri: uri,
        name: asset.fileName || 'qr.jpg',
        type: asset.type || 'image/jpeg',
      });
      // You might want to ask for the type, accountName, etc. in a modal
      formData.append('type', 'gcash'); 

      try {
        await apiClient.post(`/businesses/${businessId}/payment-qr`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        Alert.alert('Success', 'QR Code uploaded.');
        fetchBusinessDetails(); // Refresh
      } catch (error) {
        console.error('Error uploading QR:', error);
        Alert.alert('Error', 'Failed to upload QR code.');
      }
    }
  };

  const handleDeleteQR = async (imageUrl) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this QR code?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await apiClient.delete(`/businesses/${businessId}/payment-qr`, { data: { imageUrl } });
          Alert.alert('Success', 'QR Code deleted.');
          fetchBusinessDetails(); // Refresh
        } catch (error) {
          console.error('Error deleting QR:', error);
          Alert.alert('Error', 'Failed to delete QR code.');
        }
      }}
    ]);
  };

  const handleSavePaymentOptions = async () => {
    try {
      setSaving(true);
      await apiClient.put(`/businesses/${businessId}/payment-options`, { paymentOptions });
      Alert.alert('Success', 'Payment options updated!');
    } catch (error) {
      console.error('Error saving payment options:', error);
      Alert.alert('Error', 'Failed to save payment options.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <SafeAreaView style={styles.container}><ActivityIndicator size="large" color="#1C86FF" /></SafeAreaView>;
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
        title="Verification & Payments"
        showBack={true}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Verification Section */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="shield-checkmark-outline" size={moderateScale(24)} color="#1C86FF" />
            <Text style={styles.sectionTitle}>Business Verification</Text>
          </View>
          <View style={styles.verificationStatusContainer}>
            <Text style={styles.label}>Status:</Text>
            <Text style={[styles.statusText, isVerified ? styles.verified : styles.unverified]}>
              {isVerified ? 'Verified' : 'Unverified'}
            </Text>
          </View>
          <Text style={styles.hint}>Upload the required documents to get your business verified.</Text>
          
          <DocumentUploadButton
            docType="governmentId"
            docInfo={verificationDocs.governmentId}
            onPress={() => handleUploadDocument('governmentId')}
          />
          <DocumentUploadButton
            docType="businessRegistration"
            docInfo={verificationDocs.businessRegistration}
            onPress={() => handleUploadDocument('businessRegistration')}
          />
          <DocumentUploadButton
            docType="birCertificate"
            docInfo={verificationDocs.birCertificate}
            onPress={() => handleUploadDocument('birCertificate')}
          />
        </View>

        {/* Payment Options Section */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="options-outline" size={moderateScale(24)} color="#1C86FF" />
            <Text style={styles.sectionTitle}>Payment Options</Text>
          </View>
          <Text style={styles.label}>Payment Timing</Text>
          <View style={styles.segmentedControl}>
            {['payment-first', 'payment-after', 'both'].map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.segmentButton,
                  paymentOptions.timing === option && styles.segmentButtonActive
                ]}
                onPress={() => setPaymentOptions({ timing: option })}
              >
                <Text style={[styles.segmentText, paymentOptions.timing === option && styles.segmentTextActive]}>
                  {option.replace('-', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.saveButton} onPress={handleSavePaymentOptions} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff"/> : <Text style={styles.saveButtonText}>Save Payment Options</Text>}
          </TouchableOpacity>
        </View>

        {/* QR Codes Section */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="qr-code-outline" size={moderateScale(24)} color="#1C86FF" />
            <Text style={styles.sectionTitle}>Payment QR Codes</Text>
          </View>
          <View style={styles.qrGrid}>
            {qrCodes.map(qr => (
              <View key={qr.imageUrl} style={styles.qrItem}>
                <Image source={{ uri: qr.imageUrl }} style={styles.qrImage} />
                <Text style={styles.qrType}>{qr.type}</Text>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteQR(qr.imageUrl)}>
                  <Ionicons name="trash-bin" size={moderateScale(20)} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.uploadButton} onPress={handleUploadQR}>
            <Ionicons name="add-circle" size={moderateScale(22)} color="#1C86FF" />
            <Text style={styles.uploadButtonText}>Upload QR Code</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const DocumentUploadButton = ({ docType, docInfo, onPress }) => {
  const getStatus = () => {
    if (!docInfo) return { text: 'Not Uploaded', color: '#ffc107' };
    switch (docInfo.status) {
      case 'approved': return { text: 'Approved', color: '#28a745' };
      case 'rejected': return { text: 'Rejected', color: '#dc3545' };
      case 'pending':
      default: return { text: 'Pending Review', color: '#17a2b8' };
    }
  };
  const status = getStatus();

  return (
    <TouchableOpacity style={styles.docButton} onPress={onPress}>
      <Ionicons name="document-attach-outline" size={moderateScale(22)} color="#333" />
      <Text style={styles.docText}>{docType.replace(/([A-Z])/g, ' $1').trim()}</Text>
      <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
        <Text style={styles.statusBadgeText}>{status.text}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  backgroundimg: { ...StyleSheet.absoluteFillObject, transform: [{ scale: 1.5 }] },
  backgroundImageStyle: { opacity: 0.1 },
  content: { padding: moderateScale(20), paddingBottom: moderateScale(100) },
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
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10 },
  sectionTitle: { fontSize: scaleFontSize(20), fontWeight: 'bold', color: '#1C86FF' },
  label: { fontSize: scaleFontSize(14), fontWeight: '600', color: '#333', marginBottom: 8 },
  hint: { fontSize: scaleFontSize(12), color: '#666', marginBottom: 15 },
  verificationStatusContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  statusText: { fontSize: scaleFontSize(16), fontWeight: 'bold', marginLeft: 5 },
  verified: { color: '#28a745' },
  unverified: { color: '#dc3545' },
  docButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 12, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: '#E0E0E0' },
  docText: { flex: 1, fontSize: scaleFontSize(15), marginLeft: 12, fontWeight: '500' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusBadgeText: { color: '#fff', fontSize: scaleFontSize(11), fontWeight: 'bold' },
  segmentedControl: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, borderColor: '#1C86FF', overflow: 'hidden', marginBottom: 15 },
  segmentButton: { flex: 1, padding: 12, alignItems: 'center' },
  segmentButtonActive: { backgroundColor: '#1C86FF' },
  segmentText: { color: '#1C86FF', fontWeight: '600' },
  segmentTextActive: { color: '#fff' },
  saveButton: { backgroundColor: '#1C86FF', borderRadius: 12, padding: 16, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: scaleFontSize(16), fontWeight: 'bold' },
  qrGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginBottom: 15 },
  qrItem: { position: 'relative', alignItems: 'center' },
  qrImage: { width: wp(25), height: wp(25), borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  qrType: { marginTop: 5, fontWeight: '500' },
  deleteButton: { position: 'absolute', top: -5, right: -5, backgroundColor: '#dc3545', borderRadius: 15, padding: 5 },
  uploadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#1C86FF', borderRadius: 12, padding: 15, borderStyle: 'dashed' },
  uploadButtonText: { color: '#1C86FF', fontWeight: 'bold', fontSize: scaleFontSize(15) },
});
