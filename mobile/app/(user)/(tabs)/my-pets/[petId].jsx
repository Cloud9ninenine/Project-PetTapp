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
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Header from '@components/Header';
import { wp, moderateScale, scaleFontSize } from '@utils/responsive';

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

const GENDER_OPTIONS = [
  { label: 'Select gender', value: '' },
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];

export default function PetDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { petId } = params;

  // Mock pet data based on petId
  const getPetData = () => {
    const pets = {
      '1': {
        name: 'Max',
        species: 'dog',
        breed: 'golden-retriever',
        birthday: '01/15/2022',
        gender: 'male',
        weight: '32',
        color: 'Golden',
      },
      '2': {
        name: 'Luna',
        species: 'cat',
        breed: 'persian',
        birthday: '03/20/2023',
        gender: 'female',
        weight: '4.5',
        color: 'White',
      },
      '3': {
        name: 'Charlie',
        species: 'dog',
        breed: 'beagle',
        birthday: '06/10/2021',
        gender: 'male',
        weight: '12',
        color: 'Tricolor',
      },
    };
    return pets[petId] || pets['1'];
  };

  const [petInfo, setPetInfo] = useState(getPetData());
  const [petImage, setPetImage] = useState(null);
  const [showSpeciesModal, setShowSpeciesModal] = useState(false);
  const [showBreedModal, setShowBreedModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

    if (date) {
      setSelectedDate(date);
      const formattedDate = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
      updatePetInfo('birthday', formattedDate);
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const handleSave = () => {
    const { name, birthday, species, breed, gender, weight, color } = petInfo;
    if (!name || !birthday || !species || !breed || !gender || !weight || !color) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmSave = () => {
    setShowConfirmModal(false);
    Alert.alert('Success', 'Pet information updated successfully!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setShowDeleteModal(false);
    Alert.alert('Deleted', `${petInfo.name} has been removed from your pets list.`, [
      { text: 'OK', onPress: () => router.back() }
    ]);
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

            {/* Birthday */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Birthday</Text>
              <TouchableOpacity onPress={showDatePickerModal}>
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

            {/* Additional Info */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Additional Info</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={petInfo.color}
                onChangeText={(value) => updatePetInfo('color', value)}
                placeholder="Enter additional information (color, markings, etc.)"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
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
    flexDirection: 'column',
    gap: moderateScale(12),
    marginTop: moderateScale(10),
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1C86FF',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(10),
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#1C86FF',
    fontSize: scaleFontSize(16),
    fontFamily: 'SFProReg',
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
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
});
