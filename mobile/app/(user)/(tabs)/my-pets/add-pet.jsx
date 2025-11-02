import React, { useState } from 'react';
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
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Header from '@components/Header';
import SuccessModal from '@components/SuccessModal';
import { wp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from '@config/api';

const SPECIES_OPTIONS = [
  { label: 'Select species', value: '' },
  { label: 'Dog', value: 'dog' },
  { label: 'Cat', value: 'cat' },
  { label: 'Bird', value: 'bird' },
  { label: 'Fish', value: 'fish' },
  { label: 'Rabbit', value: 'rabbit' },
  { label: 'Hamster', value: 'hamster' },
  { label: 'Guinea Pig', value: 'guinea-pig' },
  { label: 'Reptile', value: 'reptile' },
  { label: 'Other', value: 'other' },
];

export default function AddPetScreen() {
  const router = useRouter();
  const [petInfo, setPetInfo] = useState({
    name: '',
    age: '',
    ageUnit: 'years',
    species: '',
    breed: '',
    gender: '',
    weight: '',
    color: '',
    specialInstructions: '',
  });

  const [medicalHistory, setMedicalHistory] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [currentDateField, setCurrentDateField] = useState(null); // Tracks which date field is being edited
  const [currentPage, setCurrentPage] = useState(1); // Page 1: Basic Info, Page 2: Medical/Vaccinations

  const [petImage, setPetImage] = useState(null);
  const [showSpeciesModal, setShowSpeciesModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showAgeUnitModal, setShowAgeUnitModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const GENDER_OPTIONS = [
    { label: 'Gender', value: '' },
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
  ];

  const AGE_UNIT_OPTIONS = [
    { label: 'Years', value: 'years' },
    { label: 'Months', value: 'months' },
  ];

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText} numberOfLines={1}>
        Add New Pet
      </Text>
    </View>
  );

  const updatePetInfo = (field, value) => {
    setPetInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleSpeciesSelect = (value, label) => {
    updatePetInfo('species', value);
    setShowSpeciesModal(false);
  };

  const handleGenderSelect = (value, label) => {
    updatePetInfo('gender', value);
    setShowGenderModal(false);
  };

  const handleAgeUnitSelect = (value, label) => {
    updatePetInfo('ageUnit', value);
    setShowAgeUnitModal(false);
  };

  const getSpeciesLabel = () => {
    const selected = SPECIES_OPTIONS.find(option => option.value === petInfo.species);
    return selected ? selected.label : 'Select species';
  };

  const getGenderLabel = () => {
    const selected = GENDER_OPTIONS.find(option => option.value === petInfo.gender);
    return selected ? selected.label : 'Select gender';
  };

  const getAgeUnitLabel = () => {
    const selected = AGE_UNIT_OPTIONS.find(option => option.value === petInfo.ageUnit);
    return selected ? selected.label : 'Select age unit';
  };

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
      setPetImage(result.assets[0].uri);
    }
  };

  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (date && currentDateField) {
      const formattedDate = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;

      if (currentDateField.type === 'medical') {
        updateMedicalHistoryField(currentDateField.id, currentDateField.field, formattedDate);
      } else if (currentDateField.type === 'vaccination') {
        updateVaccinationField(currentDateField.id, currentDateField.field, formattedDate);
      }

      setCurrentDateField(null);
    }
  };

  const showDatePickerModal = (type, id = null, field = null) => {
    setCurrentDateField({ type, id, field });
    setShowDatePicker(true);
  };

  // Medical History Management
  const addMedicalHistory = () => {
    const newEntry = {
      id: Date.now().toString(),
      condition: '',
      diagnosedDate: '',
      treatment: '',
      notes: ''
    };
    setMedicalHistory([...medicalHistory, newEntry]);
  };

  const deleteMedicalHistory = (id) => {
    setMedicalHistory(medicalHistory.filter(entry => entry.id !== id));
  };

  const updateMedicalHistoryField = (id, field, value) => {
    setMedicalHistory(medicalHistory.map(entry =>
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  // Vaccination Management
  const addVaccination = () => {
    const newEntry = {
      id: Date.now().toString(),
      vaccineName: '',
      administeredDate: '',
      nextDueDate: '',
      veterinarian: ''
    };
    setVaccinations([...vaccinations, newEntry]);
  };

  const deleteVaccination = (id) => {
    setVaccinations(vaccinations.filter(entry => entry.id !== id));
  };

  const updateVaccinationField = (id, field, value) => {
    setVaccinations(vaccinations.map(entry =>
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  // Page Navigation
  const goToNextPage = () => {
    if (validatePetData()) {
      setCurrentPage(2);
    }
  };

  const goToPreviousPage = () => {
    setCurrentPage(1);
  };

  const validatePetData = () => {
    const { name, age, ageUnit, species, gender, weight, color } = petInfo;

    // Check required fields
    if (!name || age === '' || !ageUnit || !species || !gender) {
      Alert.alert('Error', 'Please fill in all required fields (name, age, age unit, species, gender)');
      return false;
    }

    // Validate field lengths
    if (name.length > 50) {
      Alert.alert('Error', 'Pet name must be 50 characters or less');
      return false;
    }

    if (color && color.length > 30) {
      Alert.alert('Error', 'Color description must be 30 characters or less');
      return false;
    }

    // Validate age based on ageUnit
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 0) {
      Alert.alert('Error', 'Age must be a positive number');
      return false;
    }

    if (ageUnit === 'months' && ageNum > 11) {
      Alert.alert('Error', 'Age in months must be between 0 and 11. For 12+ months, please use years.');
      return false;
    }

    if (ageUnit === 'years' && ageNum > 30) {
      Alert.alert('Error', 'Age in years must be between 0 and 30');
      return false;
    }

    // Validate weight if provided
    if (weight) {
      const weightNum = parseFloat(weight);
      if (isNaN(weightNum) || weightNum < 0 || weightNum > 200) {
        Alert.alert('Error', 'Weight must be between 0 and 200 kg');
        return false;
      }
    }

    return true;
  };

  const handleSave = () => {
    if (validatePetData()) {
      setShowConfirmModal(true);
    }
  };

  const confirmSave = async () => {
    setShowConfirmModal(false);
    setIsLoading(true);

    try {
      console.log('=== PET INFO STATE ===');
      console.log('petInfo:', petInfo);

      // Create FormData for multipart/form-data request
      const formData = new FormData();

      // Add required fields
      formData.append('name', petInfo.name.trim());
      formData.append('species', petInfo.species);
      formData.append('age', petInfo.age.toString());
      formData.append('ageUnit', petInfo.ageUnit);
      formData.append('gender', petInfo.gender);

      // Add optional fields only if they have values
      if (petInfo.breed && petInfo.breed.trim()) {
        formData.append('breed', petInfo.breed.trim());
      }

      if (petInfo.weight && petInfo.weight.trim()) {
        formData.append('weight', parseFloat(petInfo.weight).toString());
      }

      if (petInfo.color && petInfo.color.trim()) {
        formData.append('color', petInfo.color.trim());
      }

      if (petInfo.specialInstructions && petInfo.specialInstructions.trim()) {
        formData.append('specialInstructions', petInfo.specialInstructions.trim());
      }

      // Add medical history as JSON string with proper date conversion
      if (medicalHistory.length > 0) {
        const transformedMedicalHistory = medicalHistory.map(m => ({
          condition: m.condition,
          diagnosedDate: m.diagnosedDate ? new Date(m.diagnosedDate.split('/').reverse().join('-')).toISOString() : null,
          treatment: m.treatment,
          notes: m.notes,
        })).filter(m => m.condition && m.diagnosedDate); // Only include valid entries
        formData.append('medicalHistory', JSON.stringify(transformedMedicalHistory));
      }

      // Add vaccinations as JSON string with correct field mapping and date conversion
      if (vaccinations.length > 0) {
        const transformedVaccinations = vaccinations.map(v => ({
          vaccine: v.vaccineName,
          administeredDate: v.administeredDate ? new Date(v.administeredDate.split('/').reverse().join('-')).toISOString() : null,
          nextDueDate: v.nextDueDate ? new Date(v.nextDueDate.split('/').reverse().join('-')).toISOString() : null,
          veterinarian: v.veterinarian,
        })).filter(v => v.vaccine && v.administeredDate); // Only include valid entries
        formData.append('vaccinations', JSON.stringify(transformedVaccinations));
      }

      // Add image if selected
      if (petImage) {
        // Get file extension from URI
        const uriParts = petImage.split('.');
        const fileType = uriParts[uriParts.length - 1];

        formData.append('image', {
          uri: petImage,
          name: `pet_${Date.now()}.${fileType}`,
          type: `image/${fileType}`,
        });
      }

      console.log('=== SUBMITTING PET DATA ===');
      console.log('FormData created with image:', !!petImage);

      // Send multipart/form-data request
      const response = await apiClient.post('/pets', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('API Response:', response.data);

      if (response.status === 201 || response.status === 200) {
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Error adding pet:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 401) {
          Alert.alert('Authentication Error', 'Please log in again.');
          router.replace('/(auth)/login');
        } else if (status === 400 || status === 422) {
          const errorMsg = data?.message || data?.error || 'Please check your input and try again.';
          console.error('Validation error details:', data);
          Alert.alert('Validation Error', errorMsg);
        } else {
          Alert.alert('Error', data?.message || 'Failed to add pet. Please try again.');
        }
      } else if (error.request) {
        Alert.alert('Network Error', 'Please check your connection and try again.');
      } else {
        Alert.alert('Error', 'An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };


  const handleReset = () => {
    setShowResetModal(true);
  };

  const confirmReset = () => {
    setPetInfo({
      name: '',
      age: '',
      ageUnit: 'years',
      species: '',
      breed: '',
      gender: '',
      weight: '',
      color: '',
      specialInstructions: '',
    });
    setPetImage(null);
    setMedicalHistory([]);
    setVaccinations([]);
    setCurrentPage(1);
    setShowResetModal(false);
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
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { flexGrow: 1 }]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
      {currentPage === 1 ? (
        // PAGE 1: Profile Image + Basic Information
        <>
          {/* SECTION 1: Profile Image */}
          <TouchableOpacity style={styles.addCircle} onPress={pickImage}>
        {petImage ? (
          <Image source={{ uri: petImage }} style={styles.petImage} />
        ) : (
          <Ionicons name="add" size={moderateScale(36)} color="#1C86FF" />
        )}
      </TouchableOpacity>

      {/* SECTION 2: Basic Information */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="information-circle" size={moderateScale(24)} color="#1C86FF" />
          <Text style={styles.sectionHeader}>Basic Information</Text>
        </View>

        {/* Pet Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pet Name *</Text>
          <TextInput
            style={styles.input}
            value={petInfo.name}
            onChangeText={(value) => updatePetInfo('name', value)}
            placeholder="Enter pet name"
            placeholderTextColor="#999"
            maxLength={50}
            returnKeyType="next"
            blurOnSubmit={false}
          />
        </View>

        {/* Species */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Species *</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowSpeciesModal(true)}
          >
            <Text style={[styles.dropdownText, !petInfo.species && styles.placeholderText]}>
              {getSpeciesLabel()}
            </Text>
            <Ionicons name="chevron-down" size={moderateScale(20)} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Breed */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Breed</Text>
          <TextInput
            style={styles.input}
            value={petInfo.breed}
            onChangeText={(value) => updatePetInfo('breed', value)}
            placeholder="Golden Retriever"
            placeholderTextColor="#999"
            maxLength={50}
            returnKeyType="next"
            blurOnSubmit={false}
          />
        </View>

        {/* Sex */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Sex *</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowGenderModal(true)}
          >
            <Text style={[styles.dropdownText, !petInfo.gender && styles.placeholderText]}>
              {getGenderLabel()}
            </Text>
            <Ionicons name="chevron-down" size={moderateScale(20)} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Age and Age Unit */}
        <View style={styles.rowInputGroup}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Age *</Text>
            <TextInput
              style={styles.input}
              value={petInfo.age}
              onChangeText={(value) => updatePetInfo('age', value)}
              placeholder="2"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={2}
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>

          <View style={styles.halfInput}>
            <Text style={styles.label}>Age Unit *</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowAgeUnitModal(true)}
            >
              <Text style={[styles.dropdownText, !petInfo.ageUnit && styles.placeholderText]}>
                {getAgeUnitLabel()}
              </Text>
              <Ionicons name="chevron-down" size={moderateScale(20)} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Weight and Color */}
        <View style={styles.rowInputGroup}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={petInfo.weight}
              onChangeText={(value) => updatePetInfo('weight', value)}
              placeholder="25.5"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>

          <View style={styles.halfInput}>
            <Text style={styles.label}>Color</Text>
            <TextInput
              style={styles.input}
              value={petInfo.color}
              onChangeText={(value) => updatePetInfo('color', value)}
              placeholder="Golden"
              placeholderTextColor="#999"
              maxLength={30}
              returnKeyType="done"
            />
          </View>
        </View>
      </View>

          {/* Navigation Button for Page 1 */}
          <TouchableOpacity style={styles.confirmButton} onPress={goToNextPage}>
            <Text style={styles.confirmButtonText}>Next</Text>
          </TouchableOpacity>
        </>
      ) : (
        // PAGE 2: Medical History + Vaccinations + Special Instructions
        <>
          {/* SECTION 3: Medical History */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="medical" size={moderateScale(24)} color="#1C86FF" />
          <Text style={styles.sectionHeader}>Medical History</Text>
        </View>

        {medicalHistory.map((entry, index) => (
          <View key={entry.id} style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <Text style={styles.entryTitle}>Record #{index + 1}</Text>
              <TouchableOpacity onPress={() => deleteMedicalHistory(entry.id)}>
                <Ionicons name="trash-outline" size={moderateScale(20)} color="#FF6B6B" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Condition</Text>
              <TextInput
                style={styles.input}
                value={entry.condition}
                onChangeText={(value) => updateMedicalHistoryField(entry.id, 'condition', value)}
                placeholder="Enter condition"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Diagnosed Date</Text>
              <TouchableOpacity onPress={() => showDatePickerModal('medical', entry.id, 'diagnosedDate')}>
                <View style={styles.dateInputContainer}>
                  <Text style={[styles.dateInput, !entry.diagnosedDate && styles.placeholderTextInput]}>
                    {entry.diagnosedDate || 'MM/DD/YYYY'}
                  </Text>
                  <Ionicons name="calendar-outline" size={moderateScale(20)} color="#666" style={styles.dateIcon} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Treatment</Text>
              <TextInput
                style={styles.input}
                value={entry.treatment}
                onChangeText={(value) => updateMedicalHistoryField(entry.id, 'treatment', value)}
                placeholder="Enter treatment"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={entry.notes}
                onChangeText={(value) => updateMedicalHistoryField(entry.id, 'notes', value)}
                placeholder="Additional notes"
                placeholderTextColor="#999"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addMedicalHistory}>
          <Ionicons name="add-circle-outline" size={moderateScale(20)} color="#1C86FF" />
          <Text style={styles.addButtonText}>Add Medical Record</Text>
        </TouchableOpacity>
      </View>

      {/* SECTION 4: Vaccinations */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="shield-checkmark" size={moderateScale(24)} color="#1C86FF" />
          <Text style={styles.sectionHeader}>Vaccinations</Text>
        </View>

        {vaccinations.map((entry, index) => (
          <View key={entry.id} style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <Text style={styles.entryTitle}>Vaccination #{index + 1}</Text>
              <TouchableOpacity onPress={() => deleteVaccination(entry.id)}>
                <Ionicons name="trash-outline" size={moderateScale(20)} color="#FF6B6B" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vaccine Name</Text>
              <TextInput
                style={styles.input}
                value={entry.vaccineName}
                onChangeText={(value) => updateVaccinationField(entry.id, 'vaccineName', value)}
                placeholder="Enter vaccine name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Administered Date</Text>
              <TouchableOpacity onPress={() => showDatePickerModal('vaccination', entry.id, 'administeredDate')}>
                <View style={styles.dateInputContainer}>
                  <Text style={[styles.dateInput, !entry.administeredDate && styles.placeholderTextInput]}>
                    {entry.administeredDate || 'MM/DD/YYYY'}
                  </Text>
                  <Ionicons name="calendar-outline" size={moderateScale(20)} color="#666" style={styles.dateIcon} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Next Due Date</Text>
              <TouchableOpacity onPress={() => showDatePickerModal('vaccination', entry.id, 'nextDueDate')}>
                <View style={styles.dateInputContainer}>
                  <Text style={[styles.dateInput, !entry.nextDueDate && styles.placeholderTextInput]}>
                    {entry.nextDueDate || 'MM/DD/YYYY'}
                  </Text>
                  <Ionicons name="calendar-outline" size={moderateScale(20)} color="#666" style={styles.dateIcon} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Veterinarian</Text>
              <TextInput
                style={styles.input}
                value={entry.veterinarian}
                onChangeText={(value) => updateVaccinationField(entry.id, 'veterinarian', value)}
                placeholder="Enter veterinarian name"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addVaccination}>
          <Ionicons name="add-circle-outline" size={moderateScale(20)} color="#1C86FF" />
          <Text style={styles.addButtonText}>Add Vaccination</Text>
        </TouchableOpacity>
      </View>

      {/* SECTION 5: Special Instructions */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="document-text" size={moderateScale(24)} color="#1C86FF" />
          <Text style={styles.sectionHeader}>Special Instructions</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Instructions for Service Providers</Text>
          <TextInput
            style={[styles.input, styles.textAreaLarge]}
            value={petInfo.specialInstructions}
            onChangeText={(value) => updatePetInfo('specialInstructions', value)}
            placeholder="Feeding schedules, behavioral notes, special care requirements, etc."
            placeholderTextColor="#999"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>
      </View>

          {/* Navigation Buttons for Page 2 */}
          <View style={styles.buttonContainerRow}>
            <TouchableOpacity style={styles.previousButton} onPress={goToPreviousPage}>
              <Text style={styles.resetButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addPetButton} onPress={handleSave}>
              <Text style={styles.confirmButtonText}>Add Pet</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>

      {/* Species Modal */}
      <Modal
        visible={showSpeciesModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSpeciesModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSpeciesModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Species</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {SPECIES_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.modalOption}
                  onPress={() => handleSpeciesSelect(option.value, option.label)}
                >
                  <Text style={styles.modalOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowSpeciesModal(false)}
            >
              <Text style={styles.confirmButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Age Unit Modal */}
      <Modal
        visible={showAgeUnitModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAgeUnitModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAgeUnitModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Age Unit</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {AGE_UNIT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.modalOption}
                  onPress={() => handleAgeUnitSelect(option.value, option.label)}
                >
                  <Text style={styles.modalOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAgeUnitModal(false)}
            >
              <Text style={styles.confirmButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Gender Modal */}
      <Modal
        visible={showGenderModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGenderModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowGenderModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Gender</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {GENDER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.modalOption}
                  onPress={() => handleGenderSelect(option.value, option.label)}
                >
                  <Text style={styles.modalOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowGenderModal(false)}
            >
              <Text style={styles.confirmButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalContent}>
            <Ionicons name="checkmark-circle" size={moderateScale(60)} color="#1C86FF" style={styles.confirmIcon} />
            <Text style={styles.confirmModalTitle}>Confirm Add Pet</Text>
            <Text style={styles.confirmModalText}>
              Are you sure you want to add {petInfo.name} to your pets list?
            </Text>
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButtonModal}
                onPress={confirmSave}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reset Confirmation Modal */}
      <Modal
        visible={showResetModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowResetModal(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalContent}>
            <Ionicons name="refresh-circle" size={moderateScale(60)} color="#FF9B79" style={styles.confirmIcon} />
            <Text style={styles.confirmModalTitle}>Reset Form</Text>
            <Text style={styles.confirmModalText}>
              Are you sure you want to reset all fields? All entered information will be cleared.
            </Text>
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowResetModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButtonModal, styles.resetButtonModal]}
                onPress={confirmReset}
              >
                <Text style={styles.confirmButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={
            currentDateField?.type === 'vaccination' && currentDateField?.field === 'nextDueDate'
              ? undefined
              : new Date()
          }
        />
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <Modal transparent={true} visible={isLoading}>
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1C86FF" />
              <Text style={styles.loadingText}>Adding pet...</Text>
            </View>
          </View>
        </Modal>
      )}

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          router.back();
        }}
        title="Success!"
        message="Your pet has been added successfully!"
        buttonText="Done"
      />
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
    fontSize: scaleFontSize(24),
    fontFamily: 'SFProBold',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(4),
    paddingBottom: moderateScale(30),
  },
  content: {
    paddingTop: moderateScale(20),
    alignItems: 'center',
  },

  addCircle: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    borderWidth: 2,
    borderColor: '#1C86FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(20),
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  petImage: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(50),
  },
  formSection: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: moderateScale(12),
  },
  rowInputGroup: {
    flexDirection: 'row',
    gap: moderateScale(12),
    marginBottom: moderateScale(12),
  },
  halfInput: {
    flex: 1,
  },
  label: {
    fontSize: scaleFontSize(16),
    color: 'black',
    marginBottom: moderateScale(6),
    fontFamily: 'SFProSB',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#1C86FF',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    fontSize: scaleFontSize(16),
    fontFamily: 'SFProReg',
    color: '#333',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#1C86FF',
    borderRadius: moderateScale(10),
  },
  dateInput: {
    flex: 1,
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    fontSize: scaleFontSize(16),
    fontFamily: 'SFProReg',
    color: '#333',
  },
  placeholderTextInput: {
    color: '#999',
  },
  dateIcon: {
    paddingHorizontal: moderateScale(12),
  },
  dropdownButton: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#1C86FF',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: scaleFontSize(16),
    color: '#333',
    fontFamily: 'SFProReg',
  },
  placeholderText: {
    color: '#999',
  },
  disabledDropdown: {
    opacity: 0.5,
  },
  textArea: {
    minHeight: moderateScale(80),
    paddingTop: moderateScale(12),
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: moderateScale(12),
    marginTop: moderateScale(10),
    width: wp(92),
    alignItems: 'center',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1C86FF',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(10),
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#1C86FF',
    fontSize: scaleFontSize(16),
    fontFamily: 'SFProSB',
  },
  confirmButton: {
    width: wp(92),
    backgroundColor: '#1C86FF',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    marginTop: moderateScale(10),
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontFamily: 'SFProSB',
  },
  buttonContainerRow: {
    flexDirection: 'row',
    gap: moderateScale(12),
    marginTop: moderateScale(10),
    width: wp(92),
  },
  previousButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1C86FF',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPetButton: {
    flex: 1,
    backgroundColor: '#1C86FF',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(20),
    padding: moderateScale(24),
    width: '100%',
    maxWidth: moderateScale(400),
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  modalTitle: {
    fontSize: scaleFontSize(22),
    fontFamily: 'SFProBold',
    color: '#1C86FF',
    textAlign: 'center',
    marginBottom: moderateScale(20),
    letterSpacing: 0.3,
  },
  modalOption: {
    paddingVertical: moderateScale(16),
    paddingHorizontal: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  modalOptionText: {
    fontSize: scaleFontSize(16),
    fontFamily: 'SFProReg',
    color: '#333',
  },
  modalCloseButton: {
    backgroundColor: '#1C86FF',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    marginTop: moderateScale(20),
    shadowColor: '#1C86FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  confirmModalContent: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(24),
    padding: moderateScale(32),
    width: '90%',
    maxWidth: moderateScale(400),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  confirmIcon: {
    marginBottom: moderateScale(24),
  },
  confirmModalTitle: {
    fontSize: scaleFontSize(24),
    fontFamily: 'SFProBold',
    color: '#1C86FF',
    textAlign: 'center',
    marginBottom: moderateScale(14),
    letterSpacing: 0.4,
  },
  confirmModalText: {
    fontSize: scaleFontSize(16),
    fontFamily: 'SFProReg',
    color: '#555',
    textAlign: 'center',
    marginBottom: moderateScale(28),
    lineHeight: scaleFontSize(24),
    paddingHorizontal: moderateScale(8),
  },
  confirmModalButtons: {
    flexDirection: 'row',
    gap: moderateScale(14),
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1C86FF',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    shadowColor: '#1C86FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButtonText: {
    color: '#1C86FF',
    fontSize: scaleFontSize(16),
    fontFamily: 'SFProBold',
    letterSpacing: 0.3,
  },
  confirmButtonModal: {
    flex: 1,
    backgroundColor: '#1C86FF',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    shadowColor: '#1C86FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  resetButtonModal: {
    backgroundColor: '#FF9B79',
    shadowColor: '#FF9B79',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(20),
    padding: moderateScale(36),
    alignItems: 'center',
    minWidth: moderateScale(200),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  loadingText: {
    marginTop: moderateScale(18),
    fontSize: scaleFontSize(17),
    color: '#333',
    fontFamily: 'SFProSB',
    letterSpacing: 0.3,
  },

  // 🔹 Then adjust your sectionContainer:
  sectionContainer: {
    marginBottom: moderateScale(16),
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(16),
    gap: moderateScale(8),
  },
  sectionHeader: {
    fontSize: scaleFontSize(20),
    color: '#1C86FF',
    fontFamily: 'SFProBold',
  },
  entryCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(10),
    padding: moderateScale(12),
    marginBottom: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(12),
    paddingBottom: moderateScale(8),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  entryTitle: {
    fontSize: scaleFontSize(16),
    fontFamily: 'SFProSB',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#1C86FF',
    borderStyle: 'dashed',
    borderRadius: moderateScale(10),
    paddingVertical: moderateScale(12),
    gap: moderateScale(8),
  },
  addButtonText: {
    color: '#1C86FF',
    fontSize: scaleFontSize(16),
    fontFamily: 'SFProSB',
  },
  textAreaLarge: {
    minHeight: moderateScale(120),
    paddingTop: moderateScale(12),
  },
});
