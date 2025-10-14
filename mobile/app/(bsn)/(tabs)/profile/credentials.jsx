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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from '@config/api';

export default function CredentialsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businessId, setBusinessId] = useState(null);

  const [credentials, setCredentials] = useState({
    licenseNumber: '',
    certifications: [],
    insuranceInfo: '',
  });

  const [newCertification, setNewCertification] = useState('');

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/businesses');

      if (response.data && response.data.data && response.data.data.length > 0) {
        const business = response.data.data[0];
        setBusinessId(business._id);
        setCredentials({
          licenseNumber: business.credentials?.licenseNumber || '',
          certifications: business.credentials?.certifications || [],
          insuranceInfo: business.credentials?.insuranceInfo || '',
        });
      }
    } catch (error) {
      console.error('Error fetching credentials:', error);
      Alert.alert('Error', 'Failed to load credentials');
    } finally {
      setLoading(false);
    }
  };

  const addCertification = () => {
    if (newCertification.trim()) {
      setCredentials({
        ...credentials,
        certifications: [...credentials.certifications, newCertification.trim()],
      });
      setNewCertification('');
    }
  };

  const removeCertification = (index) => {
    const newCerts = credentials.certifications.filter((_, i) => i !== index);
    setCredentials({
      ...credentials,
      certifications: newCerts,
    });
  };

  const handleSave = async () => {
    if (!businessId) {
      Alert.alert('Error', 'Business information not found. Please set up business details first.');
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append('credentials', JSON.stringify(credentials));

      await apiClient.put(`/businesses/${businessId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Success', 'Credentials updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving credentials:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save credentials');
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
          title="Credentials"
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
        title="Credentials"
        showBack={true}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formSection}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="ribbon-outline" size={moderateScale(24)} color="#1C86FF" />
            <Text style={styles.sectionTitle}>Professional Credentials</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Add your professional licenses and certifications to build trust with customers
          </Text>

          {/* License Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>License Number</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="card" size={moderateScale(20)} color="#1C86FF" />
              <TextInput
                style={styles.input}
                value={credentials.licenseNumber}
                onChangeText={(text) => setCredentials({...credentials, licenseNumber: text})}
                placeholder="Enter license number"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Certifications */}
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
            {credentials.certifications.length > 0 && (
              <View style={styles.certList}>
                {credentials.certifications.map((cert, index) => (
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

          {/* Insurance Information */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Insurance Information</Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                value={credentials.insuranceInfo}
                onChangeText={(text) => setCredentials({...credentials, insuranceInfo: text})}
                placeholder="Enter insurance details (provider, policy number, coverage)"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
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
    minHeight: moderateScale(100),
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
});
