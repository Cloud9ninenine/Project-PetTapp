import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from '@config/api';
import { performCompleteLogout } from '@utils/logoutHelper';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;
    return passwordRegex.test(password);
  };

  const handleChangePassword = async () => {
    // Validation
    if (!passwords.currentPassword) {
      Alert.alert('Validation Error', 'Please enter your current password');
      return;
    }

    if (!passwords.newPassword) {
      Alert.alert('Validation Error', 'Please enter a new password');
      return;
    }

    if (!validatePassword(passwords.newPassword)) {
      Alert.alert(
        'Invalid Password',
        'Password must be at least 8 characters long and contain:\n• At least one uppercase letter\n• At least one number\n• At least one special character'
      );
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      Alert.alert('Validation Error', 'New passwords do not match');
      return;
    }

    if (passwords.currentPassword === passwords.newPassword) {
      Alert.alert('Validation Error', 'New password must be different from current password');
      return;
    }

    try {
      setLoading(true);

      await apiClient.patch('/users/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });

      Alert.alert(
        'Success',
        'Password changed successfully! Please login again with your new password.',
        [
          {
            text: 'OK',
            onPress: async () => {
              try {
                // Call backend logout API
                try {
                  await apiClient.post('/auth/logout');
                } catch (logoutError) {
                  console.error('Backend logout error:', logoutError);
                }

                // Clear all local data
                await performCompleteLogout();
              } catch (error) {
                console.error('Logout error:', error);
              } finally {
                router.replace('/(auth)/login');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to change password. Please check your current password and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

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
        title="Change Password"
        showBack={true}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={moderateScale(24)} color="#1C86FF" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Password Requirements</Text>
            <Text style={styles.infoText}>
              • At least 8 characters long{'\n'}
              • Contains at least one uppercase letter{'\n'}
              • Contains at least one number{'\n'}
              • Contains at least one special character
            </Text>
          </View>
        </View>

        {/* Change Password Form */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="lock-closed-outline" size={moderateScale(24)} color="#1C86FF" />
            <Text style={styles.sectionTitle}>Change Password</Text>
          </View>

          {/* Current Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Password *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={moderateScale(20)} color="#1C86FF" />
              <TextInput
                style={styles.input}
                value={passwords.currentPassword}
                onChangeText={(text) => setPasswords({ ...passwords, currentPassword: text })}
                placeholder="Enter current password"
                placeholderTextColor="#999"
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                <Ionicons
                  name={showCurrentPassword ? 'eye-off' : 'eye'}
                  size={moderateScale(20)}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={moderateScale(20)} color="#1C86FF" />
              <TextInput
                style={styles.input}
                value={passwords.newPassword}
                onChangeText={(text) => setPasswords({ ...passwords, newPassword: text })}
                placeholder="Enter new password"
                placeholderTextColor="#999"
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                <Ionicons
                  name={showNewPassword ? 'eye-off' : 'eye'}
                  size={moderateScale(20)}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm New Password *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={moderateScale(20)} color="#1C86FF" />
              <TextInput
                style={styles.input}
                value={passwords.confirmPassword}
                onChangeText={(text) => setPasswords({ ...passwords, confirmPassword: text })}
                placeholder="Confirm new password"
                placeholderTextColor="#999"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={moderateScale(20)}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Warning Card */}
        <View style={styles.warningCard}>
          <Ionicons name="warning" size={moderateScale(24)} color="#FF9B79" />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Important Notice</Text>
            <Text style={styles.warningText}>
              After changing your password, you will be logged out and need to login again with your new password.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.changePasswordButton, loading && styles.changePasswordButtonDisabled]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={moderateScale(22)} color="#fff" />
              <Text style={styles.changePasswordButtonText}>Change Password</Text>
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
  content: {
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(20),
    paddingBottom: moderateScale(100),
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    gap: moderateScale(12),
    borderLeftWidth: 4,
    borderLeftColor: '#1C86FF',
    marginBottom: moderateScale(20),
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
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    gap: moderateScale(12),
    borderLeftWidth: 4,
    borderLeftColor: '#FF9B79',
    marginBottom: moderateScale(20),
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: scaleFontSize(15),
    fontWeight: '600',
    color: '#FF9B79',
    marginBottom: moderateScale(4),
  },
  warningText: {
    fontSize: scaleFontSize(13),
    color: '#666',
    lineHeight: scaleFontSize(18),
  },
  changePasswordButton: {
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
  changePasswordButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  changePasswordButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
});
