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
  Platform,
  ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
  { label: 'Guinea Pig', value: 'guinea-pig' },
  { label: 'Reptile', value: 'reptile' },
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
  'guinea-pig': [
    { label: 'Select breed', value: '' },
    { label: 'American', value: 'american' },
    { label: 'Abyssinian', value: 'abyssinian' },
    { label: 'Peruvian', value: 'peruvian' },
    { label: 'Silkie', value: 'silkie' },
    { label: 'Teddy', value: 'teddy' },
    { label: 'Mixed Breed', value: 'mixed' },
    { label: 'Other', value: 'other' },
  ],
  reptile: [
    { label: 'Select breed', value: '' },
    { label: 'Bearded Dragon', value: 'bearded-dragon' },
    { label: 'Leopard Gecko', value: 'leopard-gecko' },
    { label: 'Ball Python', value: 'ball-python' },
    { label: 'Corn Snake', value: 'corn-snake' },
    { label: 'Red-Eared Slider', value: 'red-eared-slider' },
    { label: 'Mixed Breed', value: 'mixed' },
    { label: 'Other', value: 'other' },
  ],
  other: [
    { label: 'Select breed', value: '' },
    { label: 'Mixed', value: 'mixed' },
    { label: 'Unknown', value: 'unknown' },
    { label: 'Other', value: 'other' },
  ],
};

const GENDER_OPTIONS = [
  { label: 'Gender', value: '' },
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];

export default function PetDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { petId } = params;

  const [petInfo, setPetInfo] = useState({
    name: '',
    species: '',
    breed: '',
    age: '',
    birthday: '',
    gender: '',
    weight: '',
    color: '',
    specialInstructions: '',
  });
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [currentDateField, setCurrentDateField] = useState(null);
  const [petImage, setPetImage] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [showSpeciesModal, setShowSpeciesModal] = useState(false);
  const [showBreedModal, setShowBreedModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch pet data on mount
  useEffect(() => {
    const fetchPetData = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get(`/pets/${petId}`);

        if (response.status === 200 && response.data.success) {
          const pet = response.data.data;

          // Calculate birthday from age (backend doesn't store birthday, only age)
          const today = new Date();
          const birthYear = today.getFullYear() - pet.age;
          const formattedBirthday = `01/01/${birthYear}`;

          setPetInfo({
            name: pet.name || '',
            species: pet.species || '',
            breed: pet.breed || '',
            age: pet.age ? pet.age.toString() : '',
            birthday: formattedBirthday,
            gender: pet.gender || '',
            weight: pet.weight ? pet.weight.toString() : '',
            color: pet.color || '',
            specialInstructions: pet.specialInstructions || '',
          });

          // Load medical history and vaccinations
          setMedicalHistory(pet.medicalHistory || []);
          setVaccinations(pet.vaccinations || []);

          if (pet.images?.profile) {
            setPetImage(pet.images.profile);
            setOriginalImage(pet.images.profile);
          }
        }
      } catch (error) {
        console.error('Error fetching pet:', error);
        if (error.response) {
          const status = error.response.status;
          if (status === 401) {
            Alert.alert('Authentication Error', 'Please log in again.');
            router.replace('/(auth)/login');
          } else if (status === 404) {
            Alert.alert('Error', 'Pet not found.', [
              { text: 'OK', onPress: () => router.back() }
            ]);
          } else {
            Alert.alert('Error', 'Failed to load pet information.');
          }
        } else if (error.request) {
          Alert.alert('Network Error', 'Please check your connection and try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (petId) {
      fetchPetData();
    }
  }, [petId]);

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText} numberOfLines={1}>
        Pet Details
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

  const validatePetData = () => {
    const { name, birthday, species, breed, age, gender, weight, color } = petInfo;
    
    // Check required fields
    if (!name || !birthday || !species || !breed || !age || !gender || !weight) {
      Alert.alert('Error', 'Please fill in all required fields');
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
    
    // Validate age
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 30) {
      Alert.alert('Error', 'Age must be between 0 and 30 years');
      return false;
    }
    
    // Validate weight
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum < 0 || weightNum > 200) {
      Alert.alert('Error', 'Weight must be between 0 and 200 kg');
      return false;
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
    setIsSaving(true);

    try {
      // Create FormData for multipart/form-data request
      const formData = new FormData();

      // Add fields to FormData with proper data types
      formData.append('name', petInfo.name.trim());
      formData.append('species', petInfo.species);
      formData.append('breed', petInfo.breed || '');
      formData.append('age', petInfo.age); // Use direct age input
      formData.append('gender', petInfo.gender);
      formData.append('weight', parseFloat(petInfo.weight).toString());

      // Add optional fields only if they have values
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

      // Add image if selected and different from original
      if (petImage && petImage !== originalImage) {
        // Get file extension from URI
        const uriParts = petImage.split('.');
        const fileType = uriParts[uriParts.length - 1];

        formData.append('image', {
          uri: petImage,
          name: `pet_${petId}_${Date.now()}.${fileType}`,
          type: `image/${fileType}`,
        });
      }

      const response = await apiClient.put(`/pets/${petId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        Alert.alert('Success', 'Pet information updated successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('Error updating pet:', error);
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 401) {
          Alert.alert('Authentication Error', 'Please log in again.');
          router.replace('/(auth)/login');
        } else if (status === 404) {
          Alert.alert('Error', 'Pet not found.');
        } else if (status === 422) {
          Alert.alert('Validation Error', data?.message || 'Please check your input and try again.');
        } else {
          Alert.alert('Error', data?.message || 'Failed to update pet. Please try again.');
        }
      } else if (error.request) {
        Alert.alert('Network Error', 'Please check your connection and try again.');
      } else {
        Alert.alert('Error', 'An unexpected error occurred.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const uploadPetImage = async () => {
    try {
      // For now, we'll skip the separate image upload since the backend expects a URL
      // The image should be uploaded during pet creation/update with multipart/form-data
      console.log('Image upload skipped - should be handled in main pet update');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Warning', 'Pet updated but image upload failed.');
    }
  };

  const deletePetImage = async () => {
    try {
      // Backend expects imageType and imageUrl in request body
      await apiClient.delete(`/pets/${petId}/image`, {
        data: {
          imageType: 'profile',
          imageUrl: originalImage
        }
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      Alert.alert('Warning', 'Pet updated but image deletion failed.');
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    setIsSaving(true);

    try {
      const response = await apiClient.delete(`/pets/${petId}`);

      if (response.status === 200 || response.status === 204) {
        Alert.alert('Deleted', `${petInfo.name} has been removed from your pets list.`, [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('Error deleting pet:', error);
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 401) {
          Alert.alert('Authentication Error', 'Please log in again.');
          router.replace('/(auth)/login');
        } else if (status === 404) {
          Alert.alert('Error', 'Pet not found.');
        } else {
          Alert.alert('Error', data?.message || 'Failed to delete pet. Please try again.');
        }
      } else if (error.request) {
        Alert.alert('Network Error', 'Please check your connection and try again.');
      } else {
        Alert.alert('Error', 'An unexpected error occurred.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1C86FF" />
          <Text style={styles.loadingText}>Loading pet information...</Text>
        </View>
      </SafeAreaView>
    );
  }

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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Pet Photo Upload */}
          <TouchableOpacity style={styles.addCircle} onPress={pickImage}>
            {petImage ? (
              <Image source={{ uri: petImage }} style={styles.petImage} />
            ) : (
              <View style={styles.placeholderIcon}>
                <Ionicons name="paw" size={moderateScale(50)} color="#1C86FF" />
              </View>
            )}
          </TouchableOpacity>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Pet Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pet Name</Text>
              <TextInput
                style={styles.input}
                value={petInfo.name}
                onChangeText={(value) => updatePetInfo('name', value)}
                placeholder="Enter pet name"
              />
            </View>

            {/* Age */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age (years) *</Text>
              <TextInput
                style={styles.input}
                value={petInfo.age}
                onChangeText={(value) => updatePetInfo('age', value)}
                placeholder="Enter age in years"
                keyboardType="numeric"
                maxLength={2}
              />
            </View>

            {/* Birthday */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Birthday</Text>
              <TouchableOpacity onPress={() => showDatePickerModal('birthday')}>
                <View style={styles.dateInputContainer}>
                  <Text style={[styles.dateInput, !petInfo.birthday && styles.placeholderTextInput]}>
                    {petInfo.birthday || 'MM/DD/YYYY'}
                  </Text>
                  <Ionicons name="calendar-outline" size={moderateScale(20)} color="#666" style={styles.dateIcon} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Species */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Species</Text>
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

            {/* Sex and Weight - Side by Side */}
            <View style={styles.rowInputGroup}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Sex</Text>
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
                <Text style={styles.label}>Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={petInfo.weight}
                  onChangeText={(value) => updatePetInfo('weight', value)}
                  placeholder="Weight"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Color */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Color</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={petInfo.color}
                onChangeText={(value) => updatePetInfo('color', value)}
                placeholder="Color, markings, etc."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={30}
              />
            </View>
          </View>

          {/* SECTION: Medical History */}
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

          {/* SECTION: Vaccinations */}
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

          {/* SECTION: Special Instructions */}
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

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.confirmButton} onPress={handleSave}>
              <Text style={styles.confirmButtonText}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
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
            <Text style={styles.confirmModalTitle}>Confirm Update</Text>
            <Text style={styles.confirmModalText}>
              Are you sure you want to save these changes to {petInfo.name}'s information?
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

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalContent}>
            <Ionicons name="trash" size={moderateScale(60)} color="#dc3545" style={styles.confirmIcon} />
            <Text style={styles.confirmModalTitle}>Delete Pet</Text>
            <Text style={styles.confirmModalText}>
              Are you sure you want to delete {petInfo.name}? This action cannot be undone.
            </Text>
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButtonModal, styles.deleteButtonModal]}
                onPress={confirmDelete}
              >
                <Text style={styles.confirmButtonText}>Delete</Text>
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
      {isSaving && (
        <Modal transparent={true} visible={isSaving}>
          <View style={styles.savingOverlay}>
            <View style={styles.savingContainer}>
              <ActivityIndicator size="large" color="#1C86FF" />
              <Text style={styles.savingText}>Saving changes...</Text>
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
  },
  content: {
    paddingHorizontal: wp(4),
    paddingTop: moderateScale(30),
    paddingBottom: moderateScale(40),
    alignItems: 'center',
  },
  addCircle: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    borderWidth: 2,
    borderColor: '#1C86FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(30),
    overflow: 'hidden',
    backgroundColor: '#E3F2FD',
  },
  petImage: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(60),
  },
  placeholderIcon: {
    justifyContent: 'center',
    alignItems: 'center',
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
    flexDirection: 'row',
    gap: moderateScale(12),
    marginTop: moderateScale(20),
    marginBottom: moderateScale(10),
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#dc3545',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(10),
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#dc3545',
    fontSize: scaleFontSize(16),
    fontFamily: 'SFProSB',
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    backgroundColor: '#1C86FF',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(10),
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontFamily: 'SFProReg',
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
  deleteButtonModal: {
    backgroundColor: '#dc3545',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(40),
  },
  loadingText: {
    marginTop: moderateScale(16),
    fontSize: scaleFontSize(16),
    color: '#666',
    fontFamily: 'SFProReg',
  },
  savingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(30),
    alignItems: 'center',
    minWidth: moderateScale(200),
  },
  savingText: {
    marginTop: moderateScale(16),
    fontSize: scaleFontSize(16),
    color: '#333',
    fontFamily: 'SFProReg',
  },
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
