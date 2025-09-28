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
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const BREED_OPTIONS = [
  { label: 'Select breed', value: '' },
  { label: 'Golden Retriever', value: 'golden-retriever' },
  { label: 'Labrador', value: 'labrador' },
  { label: 'German Shepherd', value: 'german-shepherd' },
  { label: 'Bulldog', value: 'bulldog' },
  { label: 'Poodle', value: 'poodle' },
  { label: 'Siamese Cat', value: 'siamese-cat' },
  { label: 'Persian Cat', value: 'persian-cat' },
  { label: 'Other', value: 'other' },
];

const SEX_OPTIONS = [
  { label: 'Select sex', value: '' },
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];

export default function PetInformationScreen() {
  const [petInfo, setPetInfo] = useState({
    petName: '',
    birthday: '',
    breed: '',
    sex: '',
  });
  const [showBreedModal, setShowBreedModal] = useState(false);
  const [showSexModal, setShowSexModal] = useState(false);

  const updatePetInfo = (field, value) => {
    setPetInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleBreedSelect = (value, label) => {
    updatePetInfo('breed', value);
    setShowBreedModal(false);
  };

  const handleSexSelect = (value, label) => {
    updatePetInfo('sex', value);
    setShowSexModal(false);
  };

  const getBreedLabel = () => {
    const selected = BREED_OPTIONS.find(option => option.value === petInfo.breed);
    return selected ? selected.label : 'Select breed';
  };

  const getSexLabel = () => {
    const selected = SEX_OPTIONS.find(option => option.value === petInfo.sex);
    return selected ? selected.label : 'Select sex';
  };

  const handleConfirm = () => {
    // Validate pet information
    const { petName, birthday, breed, sex } = petInfo;
    if (!petName || !birthday || !breed || !sex) {
      Alert.alert('Error', 'Please fill in all pet information fields');
      return;
    }

    // TODO: Save all information to backend
    Alert.alert('Setup Complete', 'Account setup completed successfully!', [
      { text: 'OK', onPress: () => router.replace('/(tabs)') }
    ]);
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Setup',
      'You can complete your pet profile later in settings. Continue?',
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
            <Text style={styles.subtitle}>Pet Information Configuration</Text>
            <View style={styles.stepIndicator}>
              <Text style={styles.stepText}>User Information Configuration</Text>
              <Text style={styles.stepTextActive}>Pet Information Configuration</Text>
            </View>
          </View>

          {/* Pet Information Section */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pet Information</Text>
              <View style={styles.addButton}>
                <Ionicons name="add" size={24} color="#666" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pet Name</Text>
              <TextInput
                style={styles.input}
                value={petInfo.petName}
                onChangeText={(value) => updatePetInfo('petName', value)}
                placeholder="Enter pet name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Birthday</Text>
              <View style={styles.dateInputContainer}>
                <TextInput
                  style={styles.dateInput}
                  value={petInfo.birthday}
                  onChangeText={(value) => updatePetInfo('birthday', value)}
                  placeholder="MM/DD/YYYY"
                />
                <Ionicons name="calendar-outline" size={20} color="#666" style={styles.dateIcon} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Breed</Text>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => setShowBreedModal(true)}
              >
                <Text style={[styles.dropdownText, !petInfo.breed && styles.placeholderText]}>
                  {getBreedLabel()}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sex</Text>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => setShowSexModal(true)}
              >
                <Text style={[styles.dropdownText, !petInfo.sex && styles.placeholderText]}>
                  {getSexLabel()}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>

          {/* Skip Button */}
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Breed Selection Modal */}
      <Modal
        visible={showBreedModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBreedModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Breed</Text>
              <TouchableOpacity 
                onPress={() => setShowBreedModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.optionsList}>
              {BREED_OPTIONS.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.optionItem}
                  onPress={() => handleBreedSelect(option.value, option.label)}
                >
                  <Text style={styles.optionText}>{option.label}</Text>
                  {petInfo.breed === option.value && (
                    <Ionicons name="checkmark" size={20} color="#000" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Sex Selection Modal */}
      <Modal
        visible={showSexModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSexModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Sex</Text>
              <TouchableOpacity 
                onPress={() => setShowSexModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.optionsList}>
              {SEX_OPTIONS.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.optionItem}
                  onPress={() => handleSexSelect(option.value, option.label)}
                >
                  <Text style={styles.optionText}>{option.label}</Text>
                  {petInfo.sex === option.value && (
                    <Ionicons name="checkmark" size={20} color="#000" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
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
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  dateInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  dateIcon: {
    paddingHorizontal: 12,
  },
  dropdownButton: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  confirmButton: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  confirmButtonText: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '85%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
});