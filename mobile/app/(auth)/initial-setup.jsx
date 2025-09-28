import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function InitialSetupScreen() {
  const [selectedProfile, setSelectedProfile] = useState('petowner');
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    homeAddress: '',
    contactInformation: '',
  });

  const updateUserInfo = (field, value) => {
    setUserInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    // Validate user information
    const { firstName, lastName, homeAddress, contactInformation } = userInfo;
    if (!firstName || !lastName || !homeAddress || !contactInformation) {
      Alert.alert('Error', 'Please fill in all user information fields');
      return;
    }

    // TODO: Save user information to storage/backend
    // Navigate to pet information page
    router.push('/(auth)/pet-information');
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Setup',
      'You can complete your profile later in settings. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: () => router.replace('/(tabs)') }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Initial Account Setup | Pet Owner</Text>
            <Text style={styles.subtitle}>User Selection Page</Text>
            <View style={styles.stepIndicator}>
              <Text style={styles.stepTextActive}>User Information Configuration</Text>
              <Text style={styles.stepText}>Pet Information Configuration</Text>
            </View>
          </View>

          {/* Profile Selection */}
          <View style={styles.profileSelection}>
            <Text style={styles.sectionTitle}>Continue as</Text>
            <Text style={styles.sectionSubtitle}>Select a user profile to continue</Text>
            
            <TouchableOpacity 
              style={[
                styles.profileButton,
                selectedProfile === 'petowner' && styles.profileButtonActive
              ]}
              onPress={() => setSelectedProfile('petowner')}
            >
              <Text style={[
                styles.profileButtonText,
                selectedProfile === 'petowner' && styles.profileButtonTextActive
              ]}>
                Pet Owner
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.profileButton,
                selectedProfile === 'business' && styles.profileButtonActive
              ]}
              onPress={() => setSelectedProfile('business')}
            >
              <Text style={[
                styles.profileButtonText,
                selectedProfile === 'business' && styles.profileButtonTextActive
              ]}>
                Business
              </Text>
            </TouchableOpacity>
          </View>

          {/* User Information Section */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>User Information</Text>
              <View style={styles.addButton}>
                <Ionicons name="add" size={24} color="#666" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                value={userInfo.firstName}
                onChangeText={(value) => updateUserInfo('firstName', value)}
                placeholder="Enter first name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={userInfo.lastName}
                onChangeText={(value) => updateUserInfo('lastName', value)}
                placeholder="Enter last name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Home Address</Text>
              <TextInput
                style={styles.input}
                value={userInfo.homeAddress}
                onChangeText={(value) => updateUserInfo('homeAddress', value)}
                placeholder="Enter home address"
                multiline={true}
                numberOfLines={2}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Information</Text>
              <TextInput
                style={styles.input}
                value={userInfo.contactInformation}
                onChangeText={(value) => updateUserInfo('contactInformation', value)}
                placeholder="Enter phone number or email"
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>

          {/* Skip Button */}
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepText: {
    fontSize: 12,
    color: '#999',
  },
  stepTextActive: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600',
  },
  profileSelection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  profileButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
    alignItems: 'center',
  },
  profileButtonActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  profileButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  profileButtonTextActive: {
    color: '#fff',
  },
  formSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  nextButton: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});