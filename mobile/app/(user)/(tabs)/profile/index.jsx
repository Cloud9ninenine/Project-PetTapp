import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  ImageBackground,
  Image,
  ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Header from '@components/Header';
import apiClient from "../../../config/api";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { performCompleteLogout } from '@utils/logoutHelper';
import AddressManager from './address-manager';

export default function ProfileScreen() {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageFileId, setProfileImageFileId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);

  // Account Info
  const [accountInfo, setAccountInfo] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    suffix: '',
    email: '',
    phoneNumber: '',
  });

  // View state for address manager
  const [showAddressManager, setShowAddressManager] = useState(false);

  // Password Change
  const [passwordInfo, setPasswordInfo] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Modals
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Editing States
  const [editingAccount, setEditingAccount] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Load profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get('/users/profile');

        if (response.status === 200) {
          const userData = response.data.data.user;
          const profileData = response.data.data.profile;

          setAccountInfo({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            middleName: userData.middleName || '',
            suffix: userData.suffix || '',
            email: userData.email || '',
            phoneNumber: profileData.contactNumber || '',
          });
        }

        // Fetch user files to get profile picture
        const filesResponse = await apiClient.get('/api/files/users');
        if (filesResponse.status === 200 && filesResponse.data?.data) {
          const filesData = filesResponse.data.data;

          // Handle if data is an object with a files property or directly an array
          let files = Array.isArray(filesData) ? filesData : filesData.files;

          if (Array.isArray(files)) {
            // Check for both 'category' and 'fileType' for compatibility
            const profilePic = files.find(file =>
              file.category === 'profile' || file.fileType === 'profile'
            );
            if (profilePic) {
              setProfileImage(profilePic.url);
              setProfileImageFileId(profilePic._id || profilePic.id);
            }
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        Alert.alert('Error', 'Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText} numberOfLines={1}>
        Profile
      </Text>
    </View>
  );

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      uploadProfilePicture(result.assets[0].uri);
    }
  };

  const uploadProfilePicture = async (imageUri) => {
    try {
      const formData = new FormData();
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', {
        uri: imageUri,
        name: filename,
        type: type,
      });

      const uploadResponse = await apiClient.post('/api/files/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (uploadResponse.data?.data) {
        const uploadedFile = uploadResponse.data.data;
        setProfileImage(uploadedFile.url);
        setProfileImageFileId(uploadedFile._id);
        Alert.alert('Success', 'Profile picture updated successfully!');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      Alert.alert('Error', 'Failed to upload profile picture');
    }
  };

  const deleteProfilePicture = async () => {
    if (!profileImageFileId) {
      Alert.alert('Error', 'No profile picture to delete');
      return;
    }

    Alert.alert(
      'Delete Profile Picture',
      'Are you sure you want to delete your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeletingImage(true);
            try {
              const response = await apiClient.delete(`/api/files/users/files/${profileImageFileId}`);

              if (response.status === 200) {
                setProfileImage(null);
                setProfileImageFileId(null);
                Alert.alert('Success', 'Profile picture deleted successfully!');
              }
            } catch (error) {
              console.error('Error deleting profile picture:', error);
              Alert.alert('Error', 'Failed to delete profile picture');
            } finally {
              setIsDeletingImage(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveAccount = async () => {
    setSavingAccount(true);
    try {
      const updateData = {
        user: {
          firstName: accountInfo.firstName,
          lastName: accountInfo.lastName,
          middleName: accountInfo.middleName || null,
          suffix: accountInfo.suffix || null,
        },
        profile: {
          contactNumber: accountInfo.phoneNumber,
        },
      };

      const response = await apiClient.put('/users/profile', updateData);

      if (response.status === 200) {
        setEditingAccount(false);
        Alert.alert('Success', 'Account information updated successfully!');
      }
    } catch (error) {
      console.error('Error updating account:', error);
      Alert.alert('Error', 'Failed to update account information');
    } finally {
      setSavingAccount(false);
    }
  };


  const handleChangePassword = async () => {
    if (!passwordInfo.currentPassword || !passwordInfo.newPassword || !passwordInfo.confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (passwordInfo.newPassword !== passwordInfo.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordInfo.newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters long');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await apiClient.patch('/users/change-password', {
        currentPassword: passwordInfo.currentPassword,
        newPassword: passwordInfo.newPassword,
      });

      if (response.status === 200) {
        setPasswordInfo({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        Alert.alert('Success', 'Password changed successfully!');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      if (error.response?.status === 400) {
        Alert.alert('Error', 'Current password is incorrect');
      } else {
        Alert.alert('Error', 'Failed to change password');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const response = await apiClient.delete('/users/account');

      if (response.status === 200) {
        Alert.alert('Account Deleted', 'Your account has been deactivated successfully', [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert('Error', 'Failed to delete account');
    } finally {
      setDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    setIsLoggingOut(true);
    try {
      // Call backend logout API
      try {
        await apiClient.post('/auth/logout');
      } catch (apiError) {
        console.error('Backend logout error:', apiError);
        // Continue with local cleanup even if backend fails
      }

      // Clear all local data (AsyncStorage, Firebase auth, notifications, etc.)
      console.log('Performing complete local logout...');
      await performCompleteLogout();

      // Navigate to login screen
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigate to login even if there's an error
      router.replace('/(auth)/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={require("@assets/images/PetTapp pattern.png")}
        style={styles.backgroundimg}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="repeat"
      />

      <Header
        backgroundColor="#1C86FF"
        titleColor="#fff"
        customTitle={renderTitle()}
        showBack={true}
        onBackPress={() => router.push('/(user)/(tabs)/home')}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1C86FF" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Profile Photo */}
            <View style={styles.profilePhotoContainer}>
              <TouchableOpacity style={styles.addCircle} onPress={pickImage}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.placeholderIcon}>
                    <Ionicons name="person" size={50} color="#1C86FF" />
                  </View>
                )}
              </TouchableOpacity>
              {profileImage && (
                <TouchableOpacity
                  style={styles.deleteImageButton}
                  onPress={deleteProfilePicture}
                  disabled={isDeletingImage}
                >
                  {isDeletingImage ? (
                    <ActivityIndicator size="small" color="#FF6B6B" />
                  ) : (
                    <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* ACCOUNT SECTION */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="person-outline" size={24} color="#1C86FF" />
                <Text style={styles.sectionTitle}>Account</Text>
                <TouchableOpacity
                  onPress={() => editingAccount ? handleSaveAccount() : setEditingAccount(true)}
                  disabled={savingAccount}
                >
                  {savingAccount ? (
                    <ActivityIndicator size="small" color="#1C86FF" />
                  ) : (
                    <Ionicons
                      name={editingAccount ? "checkmark" : "create-outline"}
                      size={22}
                      color="#1C86FF"
                    />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={[styles.input, !editingAccount && styles.disabledInput]}
                  value={accountInfo.firstName}
                  onChangeText={(value) => setAccountInfo(prev => ({ ...prev, firstName: value }))}
                  placeholder="Enter first name"
                  placeholderTextColor="#999"
                  editable={editingAccount}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={[styles.input, !editingAccount && styles.disabledInput]}
                  value={accountInfo.lastName}
                  onChangeText={(value) => setAccountInfo(prev => ({ ...prev, lastName: value }))}
                  placeholder="Enter last name"
                  placeholderTextColor="#999"
                  editable={editingAccount}
                />
              </View>

              <View style={styles.rowInputGroup}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Middle Name</Text>
                  <TextInput
                    style={[styles.input, !editingAccount && styles.disabledInput]}
                    value={accountInfo.middleName}
                    onChangeText={(value) => setAccountInfo(prev => ({ ...prev, middleName: value }))}
                    placeholder="Optional"
                    placeholderTextColor="#999"
                    editable={editingAccount}
                  />
                </View>

                <View style={styles.halfInput}>
                  <Text style={styles.label}>Suffix</Text>
                  <TextInput
                    style={[styles.input, !editingAccount && styles.disabledInput]}
                    value={accountInfo.suffix}
                    onChangeText={(value) => setAccountInfo(prev => ({ ...prev, suffix: value }))}
                    placeholder="Jr., Sr., III"
                    placeholderTextColor="#999"
                    editable={editingAccount}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={accountInfo.email}
                  placeholder="Enter email address"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  editable={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={[styles.input, !editingAccount && styles.disabledInput]}
                  value={accountInfo.phoneNumber}
                  onChangeText={(value) => setAccountInfo(prev => ({ ...prev, phoneNumber: value }))}
                  placeholder="Enter phone number"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  editable={editingAccount}
                />
              </View>
            </View>

                        {/* ADDRESS SECTION */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="location-outline" size={24} color="#1C86FF" />
                <Text style={styles.sectionTitle}>Addresses</Text>
              </View>

              <TouchableOpacity
                style={styles.manageAddressButton}
                onPress={() => setShowAddressManager(true)}
              >
                <Ionicons name="map-outline" size={22} color="#1C86FF" />
                <Text style={styles.manageAddressText}>Manage My Addresses</Text>
                <Ionicons name="chevron-forward" size={22} color="#999" />
              </TouchableOpacity>
            </View>

            {/* CHANGE PASSWORD SECTION */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="lock-closed-outline" size={24} color="#1C86FF" />
                <Text style={styles.sectionTitle}>Change Password</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Password</Text>
                <TextInput
                  style={styles.input}
                  value={passwordInfo.currentPassword}
                  onChangeText={(value) => setPasswordInfo(prev => ({ ...prev, currentPassword: value }))}
                  placeholder="Enter current password"
                  placeholderTextColor="#999"
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={styles.input}
                  value={passwordInfo.newPassword}
                  onChangeText={(value) => setPasswordInfo(prev => ({ ...prev, newPassword: value }))}
                  placeholder="Enter new password"
                  placeholderTextColor="#999"
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <TextInput
                  style={styles.input}
                  value={passwordInfo.confirmPassword}
                  onChangeText={(value) => setPasswordInfo(prev => ({ ...prev, confirmPassword: value }))}
                  placeholder="Confirm new password"
                  placeholderTextColor="#999"
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={styles.changePasswordButton}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.changePasswordButtonText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* SETTINGS SECTION */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="settings-outline" size={24} color="#1C86FF" />
                <Text style={styles.sectionTitle}>Settings</Text>
              </View>

              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => setShowDeleteModal(true)}
              >
                <Ionicons name="trash-outline" size={22} color="#FF6B6B" />
                <Text style={styles.settingText}>Delete Account</Text>
                <Ionicons name="chevron-forward" size={22} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Logout Button */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <ActivityIndicator color="#1C86FF" />
              ) : (
                <Text style={styles.logoutButtonText}>Logout</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Logout Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="log-out" size={60} color="#ff9b79" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalText}>
              Are you sure you want to logout?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButtonModal, styles.logoutButtonModal]}
                onPress={confirmLogout}
              >
                <Text style={styles.confirmButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="warning" size={60} color="#FF6B6B" style={styles.modalIcon} />
            <Text style={[styles.modalTitle, { color: '#FF6B6B' }]}>Delete Account</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButtonModal, { backgroundColor: '#FF6B6B' }]}
                onPress={handleDeleteAccount}
                disabled={deletingAccount}
              >
                {deletingAccount ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Address Manager Modal */}
      <Modal
        visible={showAddressManager}
        animationType="slide"
        onRequestClose={() => setShowAddressManager(false)}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.addressManagerHeader}>
            <TouchableOpacity
              onPress={() => setShowAddressManager(false)}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#1C86FF" />
            </TouchableOpacity>
            <Text style={styles.addressManagerTitle}>My Addresses</Text>
            <View style={{ width: 24 }} />
          </View>
          <AddressManager />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backgroundimg: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.5 }],
  },
  backgroundImageStyle: {
    opacity: 0.1,
  },
  titleContainer: {
    flex: 1,
  },
  titleText: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'SFProBold',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'SFProReg',
    color: '#666',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  profilePhotoContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  addCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#1C86FF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#E3F2FD',
  },
  deleteImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B6B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  placeholderIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'SFProBold',
    color: '#333',
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 12,
  },
  rowInputGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: 'black',
    marginBottom: 6,
    fontFamily: 'SFProSB',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#1C86FF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'SFProReg',
    color: '#333',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    borderColor: '#E0E0E0',
    color: '#666',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  changePasswordButton: {
    backgroundColor: '#1C86FF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  changePasswordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'SFProSB',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'SFProReg',
    color: '#FF6B6B',
    marginLeft: 12,
  },
  logoutButton: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1C86FF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#1C86FF',
    fontSize: 18,
    fontFamily: 'SFProSB',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'SFProBold',
    color: '#1C86FF',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    fontFamily: 'SFProReg',
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1C86FF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#1C86FF',
    fontSize: 16,
    fontFamily: 'SFProSB',
  },
  confirmButtonModal: {
    flex: 1,
    backgroundColor: '#1C86FF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutButtonModal: {
    backgroundColor: '#ff9b79',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'SFProSB',
  },
  manageAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  manageAddressText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'SFProSB',
    color: '#1C86FF',
    marginLeft: 12,
  },
  addressManagerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  addressManagerTitle: {
    fontSize: 20,
    fontFamily: 'SFProBold',
    color: '#1C86FF',
  },
});
