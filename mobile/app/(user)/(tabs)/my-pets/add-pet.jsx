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
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Header from '@components/Header';
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
  { label: 'Other', value: 'other' },
];

const BREED_OPTIONS_BY_SPECIES = {
  dog: [
    { label: 'Select breed', value: '' },
    { label: 'Golden Retriever', value: 'golden-retriever' },
    { label: 'Labrador', value: 'labrador' },
    { label: 'German Shepherd', value: 'german-shepherd' },
    { label: 'Bulldog', value: 'bulldog' },
    { label: 'Beagle', value: 'beagle' },
    { label: 'Poodle', value: 'poodle' },
    { label: 'Rottweiler', value: 'rottweiler' },
    { label: 'Yorkshire Terrier', value: 'yorkshire-terrier' },
    { label: 'Mixed Breed', value: 'mixed' },
    { label: 'Other', value: 'other' },
  ],
  cat: [
    { label: 'Select breed', value: '' },
    { label: 'Siamese', value: 'siamese' },
    { label: 'Persian', value: 'persian' },
    { label: 'Maine Coon', value: 'maine-coon' },
    { label: 'Ragdoll', value: 'ragdoll' },
    { label: 'Bengal', value: 'bengal' },
    { label: 'British Shorthair', value: 'british-shorthair' },
    { label: 'Sphynx', value: 'sphynx' },
    { label: 'Mixed Breed', value: 'mixed' },
    { label: 'Other', value: 'other' },
  ],
  bird: [
    { label: 'Select breed', value: '' },
    { label: 'Parrot', value: 'parrot' },
    { label: 'Canary', value: 'canary' },
    { label: 'Cockatiel', value: 'cockatiel' },
    { label: 'Budgerigar', value: 'budgerigar' },
    { label: 'Lovebird', value: 'lovebird' },
    { label: 'Finch', value: 'finch' },
    { label: 'Other', value: 'other' },
  ],
  fish: [
    { label: 'Select breed', value: '' },
    { label: 'Goldfish', value: 'goldfish' },
    { label: 'Betta', value: 'betta' },
    { label: 'Guppy', value: 'guppy' },
    { label: 'Tetra', value: 'tetra' },
    { label: 'Angelfish', value: 'angelfish' },
    { label: 'Koi', value: 'koi' },
    { label: 'Other', value: 'other' },
  ],
  rabbit: [
    { label: 'Select breed', value: '' },
    { label: 'Holland Lop', value: 'holland-lop' },
    { label: 'Netherland Dwarf', value: 'netherland-dwarf' },
    { label: 'Flemish Giant', value: 'flemish-giant' },
    { label: 'Rex', value: 'rex' },
    { label: 'Lionhead', value: 'lionhead' },
    { label: 'Mixed Breed', value: 'mixed' },
    { label: 'Other', value: 'other' },
  ],
  hamster: [
    { label: 'Select breed', value: '' },
    { label: 'Syrian', value: 'syrian' },
    { label: 'Dwarf', value: 'dwarf' },
    { label: 'Roborovski', value: 'roborovski' },
    { label: 'Chinese', value: 'chinese' },
    { label: 'Other', value: 'other' },
  ],
  other: [
    { label: 'Select breed', value: '' },
    { label: 'Mixed', value: 'mixed' },
    { label: 'Unknown', value: 'unknown' },
    { label: 'Other', value: 'other' },
  ],
};

export default function AddPetScreen() {
  const router = useRouter();
  const [petInfo, setPetInfo] = useState({
    petName: '',
    birthday: '',
    species: '',
    breed: '',
    gender: '',
    weight: '',
    additionalInfo: '',
    specialInstructions: '',
  });

  const [medicalHistory, setMedicalHistory] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [currentDateField, setCurrentDateField] = useState(null); // Tracks which date field is being edited
  const [currentPage, setCurrentPage] = useState(1); // Page 1: Basic Info, Page 2: Medical/Vaccinations

  const [petImage, setPetImage] = useState(null);
  const [showSpeciesModal, setShowSpeciesModal] = useState(false);
  const [showBreedModal, setShowBreedModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const GENDER_OPTIONS = [
    { label: 'Select gender', value: '' },
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
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
    updatePetInfo('breed', '');
    setShowSpeciesModal(false);
  };

  const handleBreedSelect = (value, label) => {
    updatePetInfo('breed', value);
    setShowBreedModal(false);
  };

  const handleGenderSelect = (value, label) => {
    updatePetInfo('gender', value);
    setShowGenderModal(false);
  };

  const getSpeciesLabel = () => {
    const selected = SPECIES_OPTIONS.find(option => option.value === petInfo.species);
    return selected ? selected.label : 'Select species';
  };

  const getBreedLabel = () => {
    if (!petInfo.species) return 'Select species first';
    const breedOptions = BREED_OPTIONS_BY_SPECIES[petInfo.species] || [];
    const selected = breedOptions.find(option => option.value === petInfo.breed);
    return selected ? selected.label : 'Select breed';
  };

  const getGenderLabel = () => {
    const selected = GENDER_OPTIONS.find(option => option.value === petInfo.gender);
    return selected ? selected.label : 'Select gender';
  };

  const getBreedOptions = () => {
    return BREED_OPTIONS_BY_SPECIES[petInfo.species] || [];
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

      if (currentDateField.type === 'birthday') {
        setSelectedDate(date);
        updatePetInfo('birthday', formattedDate);
      } else if (currentDateField.type === 'medical') {
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
    const { petName, birthday, species, breed, gender, weight } = petInfo;
    if (!petName || !birthday || !species || !breed || !gender || !weight) {
      Alert.alert('Error', 'Please fill in all required fields before proceeding');
      return;
    }
    setCurrentPage(2);
  };

  const goToPreviousPage = () => {
    setCurrentPage(1);
  };

  const handleSave = () => {
    const { petName, birthday, species, breed, gender, weight } = petInfo;
    if (!petName || !birthday || !species || !breed || !gender || !weight) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmSave = async () => {
    setShowConfirmModal(false);
    setIsLoading(true);

    try {
      // Convert birthday from MM/DD/YYYY to YYYY-MM-DD format
      const [month, day, year] = petInfo.birthday.split('/');
      const formattedBirthday = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

      // Calculate age from birthday
      const birthDate = new Date(formattedBirthday);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      // Prepare pet data for API
      const petData = {
        name: petInfo.petName,
        species: petInfo.species,
        breed: petInfo.breed,
        age: age,
        gender: petInfo.gender,
        weight: parseFloat(petInfo.weight),
        color: petInfo.additionalInfo || null,
        specialInstructions: petInfo.specialInstructions || null, // ADD THIS
        medicalHistory: medicalHistory.length > 0 ? medicalHistory : null, // ADD THIS
        vaccinations: vaccinations.length > 0 ? vaccinations : null, // ADD THIS
      };

      const response = await apiClient.post('/pets', petData);

      if (response.status === 201 || response.status === 200) {
        const createdPet = response.data;

        // Upload image if selected
        if (petImage && createdPet.id) {
          await uploadPetImage(createdPet.id);
        }

        Alert.alert('Success', 'Pet added successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('Error adding pet:', error);
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 401) {
          Alert.alert('Authentication Error', 'Please log in again.');
          router.replace('/(auth)/login');
        } else if (status === 422) {
          Alert.alert('Validation Error', data?.message || 'Please check your input and try again.');
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

  const uploadPetImage = async (petId) => {
    try {
      const formData = new FormData();

      // Get file extension from URI
      const uriParts = petImage.split('.');
      const fileType = uriParts[uriParts.length - 1];

      formData.append('image', {
        uri: petImage,
        name: `pet_${petId}.${fileType}`,
        type: `image/${fileType}`,
      });

      await apiClient.put(`/pets/${petId}/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      // Don't show alert for image upload failure, pet is already created
    }
  };

  const handleReset = () => {
    setShowResetModal(true);
  };

  const confirmReset = () => {
    setPetInfo({
      petName: '',
      birthday: '',
      species: '',
      breed: '',
      gender: '',
      weight: '',
      additionalInfo: '',
      specialInstructions: '', // ADD THIS
    });
    setPetImage(null);
    setMedicalHistory([]); // ADD THIS
    setVaccinations([]); // ADD THIS
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

  <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: wp(4) }}>
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
            value={petInfo.petName}
            onChangeText={(value) => updatePetInfo('petName', value)}
            placeholder="Enter pet name"
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
          <Text style={styles.label}>Breed *</Text>
          <TouchableOpacity
            style={[styles.dropdownButton, !petInfo.species && styles.disabledDropdown]}
            onPress={() => petInfo.species && setShowBreedModal(true)}
            disabled={!petInfo.species}
          >
            <Text style={[styles.dropdownText, (!petInfo.breed || !petInfo.species) && styles.placeholderText]}>
              {getBreedLabel()}
            </Text>
            <Ionicons name="chevron-down" size={moderateScale(20)} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Birthday */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Birthday *</Text>
          <TouchableOpacity onPress={() => showDatePickerModal('birthday')}>
            <View style={styles.dateInputContainer}>
              <Text style={[styles.dateInput, !petInfo.birthday && styles.placeholderTextInput]}>
                {petInfo.birthday || 'MM/DD/YYYY'}
              </Text>
              <Ionicons name="calendar-outline" size={moderateScale(20)} color="#666" style={styles.dateIcon} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Sex and Weight */}
        <View style={styles.rowInputGroup}>
          <View style={styles.halfInput}>
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

          <View style={styles.halfInput}>
            <Text style={styles.label}>Weight (kg) *</Text>
            <TextInput
              style={styles.input}
              value={petInfo.weight}
              onChangeText={(value) => updatePetInfo('weight', value)}
              placeholder="Weight"
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Additional Info */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Additional Info</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={petInfo.additionalInfo}
            onChangeText={(value) => updatePetInfo('additionalInfo', value)}
            placeholder="Color, markings, etc."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
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
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={entry.notes}
                onChangeText={(value) => updateMedicalHistoryField(entry.id, 'notes', value)}
                placeholder="Additional notes"
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
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>
      </View>

          {/* Navigation Buttons for Page 2 */}
          <View style={styles.buttonContainerRow}>
            <TouchableOpacity style={styles.previousButton} onPress={goToPreviousPage}>
              <Text style={styles.resetButtonText}>Previous</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addPetButton} onPress={handleSave}>
              <Text style={styles.confirmButtonText}>Add Pet</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  </ScrollView>

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

      {/* Breed Modal */}
      <Modal
        visible={showBreedModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBreedModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowBreedModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Breed</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {getBreedOptions().map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.modalOption}
                  onPress={() => handleBreedSelect(option.value, option.label)}
                >
                  <Text style={styles.modalOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowBreedModal(false)}
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
              Are you sure you want to add {petInfo.petName} to your pets list?
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
          maximumDate={new Date()}
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
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 0,
  },
  content: {

    paddingTop: moderateScale(25),
    paddingBottom: moderateScale(60),
    backgroundColor: 'rgba(255,255,255,0.0)',
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
    marginBottom: moderateScale(30),
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
    fontFamily: 'SFProReg',
    fontWeight: '600',
  },
  confirmButton: {
    width: wp(92), // ✅ makes it span horizontally instead of vertically
    backgroundColor: '#1C86FF',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    marginTop: moderateScale(20),
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: scaleFontSize(15),
    letterSpacing: 0.5,
  },
  buttonContainerRow: {
    flexDirection: 'row',
    gap: moderateScale(12),
    marginTop: moderateScale(20),
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
  },
  addPetButton: {
    flex: 1,
    backgroundColor: '#1C86FF',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(20),
    width: '100%',
    maxWidth: moderateScale(400),
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: scaleFontSize(20),
    fontFamily: 'SFProBold',
    color: '#1C86FF',
    textAlign: 'center',
    marginBottom: moderateScale(20),
  },
  modalOption: {
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalOptionText: {
    fontSize: scaleFontSize(16),
    fontFamily: 'SFProReg',
    color: '#333',
  },
  modalCloseButton: {
    backgroundColor: '#1C86FF',
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    marginTop: moderateScale(20),
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  confirmModalContent: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(30),
    width: '90%',
    maxWidth: moderateScale(400),
    alignItems: 'center',
  },
  confirmIcon: {
    marginBottom: moderateScale(20),
  },
  confirmModalTitle: {
    fontSize: scaleFontSize(22),
    fontFamily: 'SFProBold',
    color: '#1C86FF',
    textAlign: 'center',
    marginBottom: moderateScale(12),
  },
  confirmModalText: {
    fontSize: scaleFontSize(16),
    fontFamily: 'SFProReg',
    color: '#666',
    textAlign: 'center',
    marginBottom: moderateScale(24),
    lineHeight: moderateScale(22),
  },
  confirmModalButtons: {
    flexDirection: 'row',
    gap: moderateScale(12),
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1C86FF',
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(10),
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#1C86FF',
    fontSize: scaleFontSize(16),
    fontFamily: 'SFProReg',
    fontWeight: '600',
  },
  confirmButtonModal: {
    flex: 1,
    backgroundColor: '#1C86FF',
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(10),
    alignItems: 'center',
  },
  resetButtonModal: {
    backgroundColor: '#FF9B79',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(30),
    alignItems: 'center',
    minWidth: moderateScale(200),
  },
  loadingText: {
    marginTop: moderateScale(16),
    fontSize: scaleFontSize(16),
    color: '#333',
    fontFamily: 'SFProReg',
  },

  // 🔹 Then adjust your sectionContainer:
  sectionContainer: {
    marginBottom: moderateScale(20),
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
