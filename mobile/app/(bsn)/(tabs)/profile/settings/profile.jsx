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
import apiClient from '@config/api';

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    email: '',
    contactNumber: '',
    profilePicture: null,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/users/profile');

      if (response.data && response.data.data) {
        const { user, profile } = response.data.data;

        console.log('User data:', user);
        console.log('Profile data:', profile);

        setProfileData({
          firstName: user?.firstName || '',
          middleName: user?.middleName || '',
          lastName: user?.lastName || '',
          suffix: user?.suffix || '',
          email: user?.email || '',
          contactNumber: profile?.contactNumber || '',
          profilePicture: user?.images?.profile || user?.profilePicture || null,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePicturePickerAsync = async () => {
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
        setProfileData({...profileData, profilePicture: result.assets[0]});
      }
    } catch (error) {
      console.error('Error picking profile picture:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    // Validation
    if (!profileData.firstName.trim()) {
      Alert.alert('Validation Error', 'First name is required');
      return;
    }
    if (!profileData.lastName.trim()) {
      Alert.alert('Validation Error', 'Last name is required');
      return;
    }
    if (!profileData.email.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      return;
    }
    if (!profileData.contactNumber.trim()) {
      Alert.alert('Validation Error', 'Contact number is required');
      return;
    }

    try {
      setSaving(true);

      const userData = {
        firstName: profileData.firstName,
        middleName: profileData.middleName,
        lastName: profileData.lastName,
        suffix: profileData.suffix,
        email: profileData.email,
      };

      const profileUpdateData = {
        contactNumber: profileData.contactNumber,
      };

      // Check if there's a new profile picture to upload
      const hasNewProfilePicture = profileData.profilePicture &&
        typeof profileData.profilePicture === 'object' &&
        profileData.profilePicture.uri;

      if (hasNewProfilePicture) {
        // Use FormData for file upload
        const formData = new FormData();

        formData.append('user', JSON.stringify(userData));
        formData.append('profile', JSON.stringify(profileUpdateData));

        const pictureUri = Platform.OS === 'ios'
          ? profileData.profilePicture.uri.replace('file://', '')
          : profileData.profilePicture.uri;
        const filename = profileData.profilePicture.uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('profilePicture', {
          uri: pictureUri,
          name: filename || 'profile.jpg',
          type,
        });

        await apiClient.put('/users/profile', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        // Send as JSON when no file upload
        await apiClient.put('/users/profile', {
          user: userData,
          profile: profileUpdateData,
        });
      }

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save profile information');
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
          title="Profile"
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
        title="Profile"
        showBack={true}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Picture Section */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="person-circle-outline" size={moderateScale(24)} color="#1C86FF" />
            <Text style={styles.sectionTitle}>Profile Picture</Text>
          </View>

          <View style={styles.profilePicContainer}>
            <TouchableOpacity
              style={styles.circleImageContainer}
              onPress={handleProfilePicturePickerAsync}
            >
              {profileData.profilePicture ? (
                <Image
                  source={{
                    uri: typeof profileData.profilePicture === 'string'
                      ? profileData.profilePicture
                      : profileData.profilePicture.uri
                  }}
                  style={styles.circleImage}
                />
              ) : (
                <View style={styles.circlePlaceholder}>
                  <Ionicons name="camera" size={moderateScale(35)} color="#1C86FF" />
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.profilePicHint}>Tap to upload profile picture</Text>
          </View>
        </View>

        {/* Personal Information Section */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="person-outline" size={moderateScale(24)} color="#1C86FF" />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>

          {/* First Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person" size={moderateScale(20)} color="#1C86FF" />
              <TextInput
                style={styles.input}
                value={profileData.firstName}
                onChangeText={(text) => setProfileData({ ...profileData, firstName: text })}
                placeholder="Enter first name"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Middle Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Middle Name (Optional)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person" size={moderateScale(20)} color="#1C86FF" />
              <TextInput
                style={styles.input}
                value={profileData.middleName}
                onChangeText={(text) => setProfileData({ ...profileData, middleName: text })}
                placeholder="Enter middle name"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Last Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person" size={moderateScale(20)} color="#1C86FF" />
              <TextInput
                style={styles.input}
                value={profileData.lastName}
                onChangeText={(text) => setProfileData({ ...profileData, lastName: text })}
                placeholder="Enter last name"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Suffix */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Suffix (Optional)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="medal" size={moderateScale(20)} color="#1C86FF" />
              <TextInput
                style={styles.input}
                value={profileData.suffix}
                onChangeText={(text) => setProfileData({ ...profileData, suffix: text })}
                placeholder="Jr., Sr., III, etc."
                placeholderTextColor="#999"
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

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={moderateScale(20)} color="#1C86FF" />
              <TextInput
                style={styles.input}
                value={profileData.email}
                onChangeText={(text) => setProfileData({ ...profileData, email: text })}
                placeholder="Enter email address"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Contact Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Number *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call" size={moderateScale(20)} color="#1C86FF" />
              <TextInput
                style={styles.input}
                value={profileData.contactNumber}
                onChangeText={(text) => setProfileData({ ...profileData, contactNumber: text })}
                placeholder="+639123456789"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
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
    marginBottom: moderateScale(16),
    gap: moderateScale(10),
  },
  sectionTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#1C86FF',
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
});
