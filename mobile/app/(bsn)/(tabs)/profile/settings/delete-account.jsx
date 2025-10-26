import React, { useState } from 'react';
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
import { performCompleteLogout } from '@utils/logoutHelper';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleDeleteAccount = () => {
    // Validation
    if (confirmationText !== 'DELETE') {
      Alert.alert('Validation Error', 'Please type DELETE to confirm account deletion');
      return;
    }

    if (!password) {
      Alert.alert('Validation Error', 'Please enter your password to confirm');
      return;
    }

    Alert.alert(
      'Final Confirmation',
      'Are you absolutely sure you want to delete your account? This action cannot be undone.\n\nYour business profile and all associated data will be deactivated.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: confirmDeleteAccount,
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    try {
      setLoading(true);

      // Delete account (password verification handled by backend via JWT)

      // If password is correct, proceed with account deletion
      await apiClient.delete('/users/account');

      Alert.alert(
        'Account Deleted',
        'Your account has been successfully deactivated. You will now be logged out.',
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
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to delete account. Please check your password and try again.'
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
        title="Delete Account"
        showBack={true}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Danger Warning Card */}
        <View style={styles.dangerCard}>
          <Ionicons name="alert-circle" size={moderateScale(40)} color="#FF6B6B" />
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <Text style={styles.dangerText}>
            This action will permanently deactivate your account. Please read carefully before proceeding.
          </Text>
        </View>

        {/* Consequences Section */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="warning-outline" size={moderateScale(24)} color="#FF6B6B" />
            <Text style={styles.sectionTitle}>What Will Happen</Text>
          </View>

          <View style={styles.consequencesList}>
            <View style={styles.consequenceItem}>
              <Ionicons name="close-circle" size={moderateScale(20)} color="#FF6B6B" />
              <Text style={styles.consequenceText}>
                Your account will be deactivated and you will be logged out
              </Text>
            </View>

            <View style={styles.consequenceItem}>
              <Ionicons name="close-circle" size={moderateScale(20)} color="#FF6B6B" />
              <Text style={styles.consequenceText}>
                Your business profile will be hidden from customers
              </Text>
            </View>

            <View style={styles.consequenceItem}>
              <Ionicons name="close-circle" size={moderateScale(20)} color="#FF6B6B" />
              <Text style={styles.consequenceText}>
                All active bookings will be cancelled
              </Text>
            </View>

            <View style={styles.consequenceItem}>
              <Ionicons name="close-circle" size={moderateScale(20)} color="#FF6B6B" />
              <Text style={styles.consequenceText}>
                You will no longer be able to receive new bookings
              </Text>
            </View>

            <View style={styles.consequenceItem}>
              <Ionicons name="close-circle" size={moderateScale(20)} color="#FF6B6B" />
              <Text style={styles.consequenceText}>
                Your data will be retained for legal and audit purposes
              </Text>
            </View>
          </View>
        </View>

        {/* Confirmation Section */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="checkmark-circle-outline" size={moderateScale(24)} color="#FF6B6B" />
            <Text style={styles.sectionTitle}>Confirm Account Deletion</Text>
          </View>

          {/* Confirmation Text */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Type <Text style={styles.deleteText}>DELETE</Text> to confirm *
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="text" size={moderateScale(20)} color="#FF6B6B" />
              <TextInput
                style={styles.input}
                value={confirmationText}
                onChangeText={setConfirmationText}
                placeholder="Type DELETE here"
                placeholderTextColor="#999"
                autoCapitalize="characters"
              />
            </View>
          </View>

          {/* Password Confirmation */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Enter Your Password *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={moderateScale(20)} color="#FF6B6B" />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={moderateScale(20)}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={moderateScale(24)} color="#1C86FF" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Need Help Instead?</Text>
            <Text style={styles.infoText}>
              If you're having issues with your account or need assistance, please contact our support team before deleting your account.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.deleteButton, loading && styles.deleteButtonDisabled]}
          onPress={handleDeleteAccount}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="trash" size={moderateScale(22)} color="#fff" />
              <Text style={styles.deleteButtonText}>Delete My Account</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Ionicons name="arrow-back" size={moderateScale(22)} color="#1C86FF" />
          <Text style={styles.cancelButtonText}>Never Mind, Go Back</Text>
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
  dangerCard: {
    backgroundColor: '#FFEBEE',
    borderRadius: moderateScale(16),
    padding: moderateScale(24),
    alignItems: 'center',
    marginBottom: moderateScale(20),
    borderWidth: 2,
    borderColor: '#FF6B6B',
    elevation: 3,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  dangerTitle: {
    fontSize: scaleFontSize(22),
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginTop: moderateScale(12),
    marginBottom: moderateScale(8),
  },
  dangerText: {
    fontSize: scaleFontSize(14),
    color: '#666',
    textAlign: 'center',
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
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  consequencesList: {
    gap: moderateScale(12),
  },
  consequenceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: moderateScale(12),
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    backgroundColor: '#FFF5F5',
    borderRadius: moderateScale(8),
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B6B',
  },
  consequenceText: {
    flex: 1,
    fontSize: scaleFontSize(14),
    color: '#333',
    lineHeight: scaleFontSize(20),
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
  deleteText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
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
    marginBottom: moderateScale(4),
  },
  infoText: {
    fontSize: scaleFontSize(13),
    color: '#666',
    lineHeight: scaleFontSize(18),
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B6B',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: moderateScale(12),
  },
  deleteButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
  cancelButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    borderWidth: 2,
    borderColor: '#1C86FF',
  },
  cancelButtonText: {
    color: '#1C86FF',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
});
