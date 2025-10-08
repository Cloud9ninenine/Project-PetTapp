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
import AddressManager from './address-manager';

export default function ProfileScreen() {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  // Payment Options
  const [paymentOptions, setPaymentOptions] = useState([]);
  const [newPayment, setNewPayment] = useState({
    type: '',
    gcashNumber: '',
    gcashName: '',
  });

  // Modals
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showViewPaymentModal, setShowViewPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

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

          if (profileData?.profilePicture) {
            setProfileImage(profileData.profilePicture);
          }

          if (profileData?.paymentMethods && Array.isArray(profileData.paymentMethods)) {
            setPaymentOptions(profileData.paymentMethods);
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

      const uploadResponse = await apiClient.post('/files/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (uploadResponse.data?.data?.url) {
        const updateData = {
          profile: {
            profilePicture: uploadResponse.data.data.url,
          },
        };

        await apiClient.put('/users/profile', updateData);
        Alert.alert('Success', 'Profile picture updated successfully!');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      Alert.alert('Error', 'Failed to upload profile picture');
    }
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
      await apiClient.post('/auth/logout');
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.replace('/(auth)/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleAddPayment = () => {
    setShowPaymentModal(true);
  };

  const handleViewPayment = (option) => {
    setSelectedPayment(option);
    setShowViewPaymentModal(true);
  };

  const handleDeletePayment = async (paymentId) => {
    const updatedPayments = paymentOptions.filter(option => option.id !== paymentId);

    try {
      const updateData = {
        profile: {
          paymentMethods: updatedPayments,
        },
      };

      const response = await apiClient.put('/users/profile', updateData);

      if (response.status === 200) {
        setPaymentOptions(updatedPayments);
        setShowViewPaymentModal(false);
        Alert.alert('Success', 'Payment option deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      Alert.alert('Error', 'Failed to delete payment option');
    }
  };

  const savePayment = async () => {
    const { type, gcashNumber, gcashName } = newPayment;

    if (!type) {
      Alert.alert('Error', 'Please select a payment type');
      return;
    }

    let newOption;

    if (type === 'gcash') {
      if (!gcashNumber || !gcashName) {
        Alert.alert('Error', 'Please fill in GCash number and name');
        return;
      }
      newOption = {
        id: String(Date.now()),
        type: 'gcash',
        name: 'GCash',
        gcashNumber: gcashNumber,
        gcashName: gcashName,
      };
    } else if (type === 'cash') {
      newOption = {
        id: String(Date.now()),
        type: 'cash',
        name: 'Cash',
      };
    }

    const updatedPayments = [...paymentOptions, newOption];

    try {
      const updateData = {
        profile: {
          paymentMethods: updatedPayments,
        },
      };

      const response = await apiClient.put('/users/profile', updateData);

      if (response.status === 200) {
        setPaymentOptions(updatedPayments);
        setNewPayment({ type: '', gcashNumber: '', gcashName: '' });
        setShowPaymentModal(false);
        Alert.alert('Success', 'Payment option added successfully!');
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      Alert.alert('Error', 'Failed to add payment option');
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
        showBack={false}
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
            <TouchableOpacity style={styles.addCircle} onPress={pickImage}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.placeholderIcon}>
                  <Ionicons name="person" size={50} color="#1C86FF" />
                </View>
              )}
            </TouchableOpacity>

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

            {/* PAYMENT OPTIONS SECTION */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="wallet-outline" size={24} color="#1C86FF" />
                <Text style={styles.sectionTitle}>Payment Options</Text>
              </View>

              <View style={styles.paymentCardsContainer}>
                {paymentOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.paymentCard}
                    onPress={() => handleViewPayment(option)}
                  >
                    <View style={styles.paymentCardContent}>
                      <Ionicons
                        name={option.type === 'gcash' ? 'phone-portrait-outline' : 'cash-outline'}
                        size={40}
                        color="#1C86FF"
                      />
                    </View>
                    <Text style={styles.paymentCardLabel}>{option.name}</Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity style={styles.addPaymentCard} onPress={handleAddPayment}>
                  <View style={styles.paymentCardContent}>
                    <Ionicons name="add" size={40} color="#1C86FF" />
                  </View>
                  <Text style={styles.paymentCardLabel}>Add</Text>
                </TouchableOpacity>
              </View>
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

      {/* View Payment Details Modal */}
      <Modal
        visible={showViewPaymentModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowViewPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.viewPaymentModalContent}>
            <View style={styles.viewPaymentHeader}>
              <Ionicons
                name={selectedPayment?.type === 'gcash' ? 'phone-portrait-outline' : 'cash-outline'}
                size={60}
                color="#1C86FF"
                style={styles.modalIcon}
              />
              <Text style={styles.viewPaymentTitle}>{selectedPayment?.name}</Text>
            </View>

            <View style={styles.viewPaymentDetails}>
              {selectedPayment?.type === 'gcash' ? (
                <>
                  <View style={styles.paymentDetailRow}>
                    <Text style={styles.paymentDetailLabel}>GCash Number</Text>
                    <Text style={styles.paymentDetailValue}>{selectedPayment?.gcashNumber}</Text>
                  </View>

                  <View style={styles.paymentDetailRow}>
                    <Text style={styles.paymentDetailLabel}>Account Name</Text>
                    <Text style={styles.paymentDetailValue}>{selectedPayment?.gcashName}</Text>
                  </View>
                </>
              ) : (
                <View style={styles.paymentDetailRow}>
                  <Text style={styles.paymentDetailLabel}>Payment Type</Text>
                  <Text style={styles.paymentDetailValue}>Cash on Delivery</Text>
                </View>
              )}
            </View>

            <View style={styles.viewPaymentButtonsRow}>
              <TouchableOpacity
                style={styles.deletePaymentButton}
                onPress={() => handleDeletePayment(selectedPayment?.id)}
              >
                <Text style={styles.deletePaymentButtonText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setShowViewPaymentModal(false)}
              >
                <Text style={styles.confirmButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.paymentModalOverlay}>
          <View style={styles.paymentModalContent}>
            <View style={styles.paymentModalHeader}>
              <Text style={styles.paymentModalTitle}>Add Payment Option</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Payment Type</Text>
              <View style={styles.paymentTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.paymentTypeButton,
                    newPayment.type === 'gcash' && styles.paymentTypeButtonActive
                  ]}
                  onPress={() => setNewPayment(prev => ({ ...prev, type: 'gcash' }))}
                >
                  <Ionicons
                    name="phone-portrait-outline"
                    size={24}
                    color={newPayment.type === 'gcash' ? '#fff' : '#1C86FF'}
                  />
                  <Text style={[
                    styles.paymentTypeText,
                    newPayment.type === 'gcash' && styles.paymentTypeTextActive
                  ]}>GCash</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentTypeButton,
                    newPayment.type === 'cash' && styles.paymentTypeButtonActive
                  ]}
                  onPress={() => setNewPayment(prev => ({ ...prev, type: 'cash' }))}
                >
                  <Ionicons
                    name="cash-outline"
                    size={24}
                    color={newPayment.type === 'cash' ? '#fff' : '#1C86FF'}
                  />
                  <Text style={[
                    styles.paymentTypeText,
                    newPayment.type === 'cash' && styles.paymentTypeTextActive
                  ]}>Cash</Text>
                </TouchableOpacity>
              </View>
            </View>

            {newPayment.type === 'gcash' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>GCash Number</Text>
                  <TextInput
                    style={styles.input}
                    value={newPayment.gcashNumber}
                    onChangeText={(value) => setNewPayment(prev => ({ ...prev, gcashNumber: value }))}
                    placeholder="09XX XXX XXXX"
                    keyboardType="phone-pad"
                    maxLength={11}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Account Name</Text>
                  <TextInput
                    style={styles.input}
                    value={newPayment.gcashName}
                    onChangeText={(value) => setNewPayment(prev => ({ ...prev, gcashName: value }))}
                    placeholder="Juan Dela Cruz"
                  />
                </View>
              </>
            )}

            {newPayment.type === 'cash' && (
              <View style={styles.cashInfoContainer}>
                <Ionicons name="information-circle" size={24} color="#1C86FF" />
                <Text style={styles.cashInfoText}>
                  Cash payment will be collected upon delivery or service completion
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.addPaymentConfirmButton,
                !newPayment.type && styles.addPaymentConfirmButtonDisabled
              ]}
              onPress={savePayment}
              disabled={!newPayment.type}
            >
              <Text style={styles.confirmButtonText}>Add Payment</Text>
            </TouchableOpacity>
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
  addCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#1C86FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    overflow: 'hidden',
    backgroundColor: '#E3F2FD',
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
  paymentCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 12,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#1C86FF',
    borderRadius: 12,
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentCardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentCardLabel: {
    fontSize: 12,
    fontFamily: 'SFProReg',
    color: '#333',
    textAlign: 'center',
    paddingBottom: 8,
  },
  addPaymentCard: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#1C86FF',
    borderRadius: 12,
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
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
  viewPaymentModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  viewPaymentHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  viewPaymentTitle: {
    fontSize: 22,
    fontFamily: 'SFProBold',
    color: '#1C86FF',
    marginTop: 12,
  },
  viewPaymentDetails: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  paymentDetailRow: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 10,
  },
  paymentDetailLabel: {
    fontSize: 12,
    fontFamily: 'SFProReg',
    color: '#666',
    marginBottom: 4,
  },
  paymentDetailValue: {
    fontSize: 16,
    fontFamily: 'SFProSB',
    color: 'black',
  },
  viewPaymentButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deletePaymentButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  deletePaymentButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontFamily: 'SFProSB',
  },
  closeModalButton: {
    flex: 1,
    backgroundColor: '#1C86FF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  paymentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  paymentModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  paymentModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  paymentModalTitle: {
    fontSize: 20,
    fontFamily: 'SFProBold',
    color: '#1C86FF',
  },
  paymentTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  paymentTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1C86FF',
    borderRadius: 10,
    paddingVertical: 16,
    gap: 8,
  },
  paymentTypeButtonActive: {
    backgroundColor: '#1C86FF',
  },
  paymentTypeText: {
    fontSize: 16,
    fontFamily: 'SFProSB',
    color: '#1C86FF',
  },
  paymentTypeTextActive: {
    color: '#fff',
  },
  cashInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 10,
    marginTop: 8,
    gap: 12,
  },
  cashInfoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'SFProReg',
    color: '#333',
    lineHeight: 20,
  },
  addPaymentConfirmButton: {
    width: '100%',
    backgroundColor: '#1C86FF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  addPaymentConfirmButtonDisabled: {
    backgroundColor: '#ccc',
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
