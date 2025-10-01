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
  ImageBackground,
  Image,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { wp, moderateScale, scaleFontSize, isSmallDevice } from '@utils/responsive';

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

export default function PetInformationScreen() {
  const [petInfo, setPetInfo] = useState({
    petName: '',
    birthday: '',
    species: '',
    breed: '',
  });
  const [petImage, setPetImage] = useState(null);
  const [showSpeciesModal, setShowSpeciesModal] = useState(false);
  const [showBreedModal, setShowBreedModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const updatePetInfo = (field, value) => {
    setPetInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleSpeciesSelect = (value, label) => {
    updatePetInfo('species', value);
    // Reset breed when species changes
    updatePetInfo('breed', '');
    setShowSpeciesModal(false);
  };

  const handleBreedSelect = (value, label) => {
    updatePetInfo('breed', value);
    setShowBreedModal(false);
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

  const getBreedOptions = () => {
    return BREED_OPTIONS_BY_SPECIES[petInfo.species] || [];
  };

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library');
      return;
    }

    // Launch image picker
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

  const handleNext = () => {
    // Validate page 1 fields
    const { petName, birthday, species, breed } = petInfo;
    if (!petName || !birthday || !species || !breed) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Navigate to page 2 with current data
    router.push({
      pathname: '/(auth)/pet-information-additional',
      params: petInfo
    });
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Setup',
      'You can complete your pet profile later in settings. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: () => router.replace('/(user)/(tabs)') }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={require("@assets/images/PetTapp pattern.png")}
        style={styles.backgroundimg}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="repeat"
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
            
            {/* Page Title */}
            <Text style={styles.pageTitle}>Pet Information</Text>

            {/* Pet Photo Upload */}
            <TouchableOpacity style={styles.addCircle} onPress={pickImage}>
              {petImage ? (
                <Image source={{ uri: petImage }} style={styles.petImage} />
              ) : (
                <Ionicons name="add" size={moderateScale(36)} color="#1C86FF" />
              )}
            </TouchableOpacity>

            {/* Form Section */}
            <View style={styles.formSection}>
              {/* Pet Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Pet Name</Text>
                <TextInput
                  style={styles.input}
                  value={petInfo.petName}
                  onChangeText={(value) => updatePetInfo('petName', value)}
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

              {/* Next Button */}
              <TouchableOpacity style={styles.confirmButton} onPress={handleNext}>
                <Text style={styles.confirmButtonText}>Next</Text>
              </TouchableOpacity>
            </View>

            {/* Skip */}
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: wp(isSmallDevice() ? 8 : 13),
    paddingTop: moderateScale(40),
    paddingBottom: moderateScale(40),
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: scaleFontSize(isSmallDevice() ? 35 : 40),
    fontFamily: 'SFProBold',
    color: '#1C86FF',
    textAlign: 'center',
    marginBottom: moderateScale(20),
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
  label: {
    fontSize: scaleFontSize(18),
    color: 'black',
    marginBottom: moderateScale(6),
    fontFamily: 'SFProSB',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: 'black',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    fontSize: scaleFontSize(20),
    fontFamily: 'SFProReg',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: 'black',
    borderRadius: moderateScale(10),
  },
  dateInput: {
    flex: 1,
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    fontSize: scaleFontSize(20),
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
    borderColor: 'black',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: scaleFontSize(20),
    color: '#333',
    fontFamily: 'SFProReg',
  },
  placeholderText: {
    color: '#999',
  },
  disabledDropdown: {
    opacity: 0.5,
  },
  confirmButton: {
    backgroundColor: '#1C86FF',
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    marginTop: moderateScale(10),
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(18),
    fontFamily: 'SFProReg',
  },
  skipButton: {
    marginTop: moderateScale(20),
  },
  skipButtonText: {
    color: 'black',
    fontSize: scaleFontSize(14),
    fontFamily: 'SFProReg',
    textDecorationLine: 'underline',
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
    fontSize: scaleFontSize(24),
    fontFamily: 'SFProBold',
    color: '#1C86FF',
    textAlign: 'center',
    marginBottom: moderateScale(20),
  },
  modalOption: {
    paddingVertical: moderateScale(16),
    paddingHorizontal: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalOptionText: {
    fontSize: scaleFontSize(18),
    fontFamily: 'SFProReg',
    color: '#333',
  },
  modalCloseButton: {
    backgroundColor: '#1C86FF',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    marginTop: moderateScale(20),
  },
});