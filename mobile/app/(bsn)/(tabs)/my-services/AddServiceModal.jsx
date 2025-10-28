import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { hp, moderateScale, scaleFontSize } from '@utils/responsive';

export default function AddServiceModal({ visible, onClose, onAddService, editingService, businessId }) {
  const [loading, setLoading] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showDaysDropdown, setShowDaysDropdown] = useState(false);
  const [showPetTypesDropdown, setShowPetTypesDropdown] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentTimePicker, setCurrentTimePicker] = useState(null); // { field: 'start' | 'end' }

  // Form state matching backend schema
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    duration: '',
    priceAmount: '',
    priceCurrency: 'PHP',
    availabilityDays: [],
    timeSlotStart: '09:00',
    timeSlotEnd: '17:00',
    petTypes: [],
    minAge: '',
    maxAge: '',
    healthRequirements: '',
    specialNotes: '',
  });

  const [errors, setErrors] = useState({});

  // Backend categories
  const categories = [
    { value: 'veterinary', label: 'Veterinary', icon: 'medical-outline', color: '#4CAF50' },
    { value: 'grooming', label: 'Grooming', icon: 'cut-outline', color: '#2196F3' },
    { value: 'boarding', label: 'Boarding', icon: 'home-outline', color: '#FF9B79' },
    { value: 'daycare', label: 'Daycare', icon: 'sunny-outline', color: '#FFD700' },
    { value: 'training', label: 'Training', icon: 'school-outline', color: '#9C27B0' },
    { value: 'emergency', label: 'Emergency', icon: 'alert-circle-outline', color: '#FF6B6B' },
    { value: 'consultation', label: 'Consultation', icon: 'chatbubbles-outline', color: '#00BCD4' },
    { value: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline', color: '#607D8B' },
  ];

  // Backend days enum
  const daysOfWeek = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
  ];

  // Backend pet types enum
  const petTypes = [
    { value: 'dog', label: 'Dog', icon: 'paw' },
    { value: 'cat', label: 'Cat', icon: 'paw' },
    { value: 'bird', label: 'Bird', icon: 'fitness' },
    { value: 'fish', label: 'Fish', icon: 'water' },
    { value: 'rabbit', label: 'Rabbit', icon: 'paw' },
    { value: 'hamster', label: 'Hamster', icon: 'paw' },
    { value: 'guinea-pig', label: 'Guinea Pig', icon: 'paw' },
    { value: 'reptile', label: 'Reptile', icon: 'bug' },
    { value: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
  ];

  useEffect(() => {
    if (editingService && visible) {
      // Populate form with editing service data
      setFormData({
        name: editingService.name || '',
        category: editingService.category || '',
        description: editingService.description || '',
        duration: editingService.duration?.toString() || '',
        priceAmount: editingService.price?.amount?.toString() || '',
        priceCurrency: editingService.price?.currency || 'PHP',
        availabilityDays: editingService.availability?.days || [],
        timeSlotStart: editingService.availability?.timeSlots?.[0]?.start || '09:00',
        timeSlotEnd: editingService.availability?.timeSlots?.[0]?.end || '17:00',
        petTypes: editingService.requirements?.petTypes || [],
        minAge: editingService.requirements?.ageRestrictions?.minAge?.toString() || '',
        maxAge: editingService.requirements?.ageRestrictions?.maxAge?.toString() || '',
        healthRequirements: editingService.requirements?.healthRequirements?.join(', ') || '',
        specialNotes: editingService.requirements?.specialNotes || '',
      });
      setImageUri(editingService.imageUrl || null);
    } else if (!visible) {
      // Reset form when modal closes
      resetForm();
    }
  }, [editingService, visible]);

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      description: '',
      duration: '',
      priceAmount: '',
      priceCurrency: 'PHP',
      availabilityDays: [],
      timeSlotStart: '09:00',
      timeSlotEnd: '17:00',
      petTypes: [],
      minAge: '',
      maxAge: '',
      healthRequirements: '',
      specialNotes: '',
    });
    setImageUri(null);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Service name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';

    const duration = parseInt(formData.duration);
    if (!formData.duration || isNaN(duration) || duration < 15 || duration > 1440) {
      newErrors.duration = 'Duration must be between 15 and 1440 minutes';
    }

    const price = parseFloat(formData.priceAmount);
    if (!formData.priceAmount || isNaN(price) || price < 0) {
      newErrors.priceAmount = 'Valid price is required';
    }

    if (formData.availabilityDays.length === 0) {
      newErrors.availabilityDays = 'Select at least one day';
    }

    if (formData.petTypes.length === 0) {
      newErrors.petTypes = 'Select at least one pet type';
    }

    if (formData.minAge && formData.maxAge) {
      const min = parseFloat(formData.minAge);
      const max = parseFloat(formData.maxAge);
      if (min > max) {
        newErrors.maxAge = 'Max age must be greater than min age';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before submitting');
      return;
    }

    try {
      setLoading(true);

      const formDataToSend = new FormData();

      // Required fields
      formDataToSend.append('businessId', businessId);
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('category', formData.category);
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('duration', formData.duration);

      // Price as JSON string
      formDataToSend.append('price', JSON.stringify({
        amount: parseFloat(formData.priceAmount),
        currency: formData.priceCurrency,
      }));

      // Availability as JSON string
      formDataToSend.append('availability', JSON.stringify({
        days: formData.availabilityDays,
        timeSlots: [{
          start: formData.timeSlotStart,
          end: formData.timeSlotEnd,
        }],
      }));

      // Requirements as JSON string
      const requirements = {
        petTypes: formData.petTypes,
      };

      if (formData.minAge || formData.maxAge) {
        requirements.ageRestrictions = {};
        if (formData.minAge) requirements.ageRestrictions.minAge = parseFloat(formData.minAge);
        if (formData.maxAge) requirements.ageRestrictions.maxAge = parseFloat(formData.maxAge);
      }

      if (formData.healthRequirements.trim()) {
        requirements.healthRequirements = formData.healthRequirements
          .split(',')
          .map(r => r.trim())
          .filter(r => r);
      }

      if (formData.specialNotes.trim()) {
        requirements.specialNotes = formData.specialNotes.trim();
      }

      formDataToSend.append('requirements', JSON.stringify(requirements));

      // Image file
      if (imageUri && !imageUri.startsWith('http')) {
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formDataToSend.append('image', {
          uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
          name: filename,
          type,
        });
      }

      await onAddService(formDataToSend);
      resetForm();
    } catch (error) {
      console.error('Error submitting service:', error);
      // Error is handled by parent component
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      availabilityDays: prev.availabilityDays.includes(day)
        ? prev.availabilityDays.filter(d => d !== day)
        : [...prev.availabilityDays, day],
    }));
    setErrors(prev => ({ ...prev, availabilityDays: null }));
  };

  const togglePetType = (type) => {
    setFormData(prev => ({
      ...prev,
      petTypes: prev.petTypes.includes(type)
        ? prev.petTypes.filter(t => t !== type)
        : [...prev.petTypes, type],
    }));
    setErrors(prev => ({ ...prev, petTypes: null }));
  };

  const getCategoryData = () => {
    return categories.find(c => c.value === formData.category);
  };

  const openTimePicker = (field) => {
    setCurrentTimePicker(field);
    setShowTimePicker(true);
  };

  const handleTimeChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    if (event.type === 'set' && selectedDate && currentTimePicker) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;

      setFormData(prev => ({
        ...prev,
        [currentTimePicker === 'start' ? 'timeSlotStart' : 'timeSlotEnd']: timeString
      }));

      if (Platform.OS === 'ios') {
        // On iOS, keep picker open until they tap outside or Done
      } else {
        setCurrentTimePicker(null);
      }
    } else if (event.type === 'dismissed') {
      setShowTimePicker(false);
      setCurrentTimePicker(null);
    }
  };

  const getTimeForPicker = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    return date;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingService ? 'Edit Service' : 'Add New Service'}
            </Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name="close-circle" size={moderateScale(28)} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
            {/* Service Image */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Service Image (Optional)</Text>
              <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.selectedImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera-outline" size={moderateScale(40)} color="#999" />
                    <Text style={styles.imagePlaceholderText}>Tap to add image</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Service Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Service Name *</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="e.g., Pet Vaccination"
                value={formData.name}
                onChangeText={(text) => {
                  setFormData({ ...formData, name: text });
                  setErrors({ ...errors, name: null });
                }}
                maxLength={100}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category *</Text>
              <TouchableOpacity
                style={[styles.dropdownContainer, errors.category && styles.inputError]}
                onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                <View style={styles.dropdownContent}>
                  {getCategoryData() && (
                    <View style={[styles.categoryIconSmall, { backgroundColor: getCategoryData().color }]}>
                      <Ionicons name={getCategoryData().icon} size={moderateScale(16)} color="#fff" />
                    </View>
                  )}
                  <Text style={[styles.dropdownText, !formData.category && styles.dropdownPlaceholder]}>
                    {getCategoryData()?.label || 'Select category'}
                  </Text>
                </View>
                <Ionicons
                  name={showCategoryDropdown ? "chevron-up" : "chevron-down"}
                  size={moderateScale(20)}
                  color="#666"
                />
              </TouchableOpacity>
              {showCategoryDropdown && (
                <ScrollView style={styles.dropdownList} nestedScrollEnabled={true}>
                  {categories.map((cat) => (
                    <Pressable
                      key={cat.value}
                      style={({ pressed }) => [
                        styles.dropdownItem,
                        formData.category === cat.value && styles.dropdownItemSelected,
                        pressed && styles.dropdownItemPressed,
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, category: cat.value });
                        setShowCategoryDropdown(false);
                        setErrors({ ...errors, category: null });
                      }}
                    >
                      <View style={[styles.categoryIcon, { backgroundColor: cat.color }]}>
                        <Ionicons name={cat.icon} size={moderateScale(20)} color="#fff" />
                      </View>
                      <Text style={[
                        styles.dropdownItemText,
                        formData.category === cat.value && styles.dropdownItemTextSelected
                      ]}>
                        {cat.label}
                      </Text>
                      {formData.category === cat.value && (
                        <Ionicons name="checkmark-circle" size={moderateScale(22)} color="#1C86FF" />
                      )}
                    </Pressable>
                  ))}
                </ScrollView>
              )}
              {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea, errors.description && styles.inputError]}
                placeholder="Brief description of the service"
                value={formData.description}
                onChangeText={(text) => {
                  setFormData({ ...formData, description: text });
                  setErrors({ ...errors, description: null });
                }}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={500}
              />
              {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
            </View>

            {/* Price and Duration */}
            <View style={styles.inputRow}>
              <View style={styles.inputGroupHalf}>
                <Text style={styles.inputLabel}>Price (PHP) *</Text>
                <TextInput
                  style={[styles.input, errors.priceAmount && styles.inputError]}
                  placeholder="1500"
                  value={formData.priceAmount}
                  onChangeText={(text) => {
                    setFormData({ ...formData, priceAmount: text });
                    setErrors({ ...errors, priceAmount: null });
                  }}
                  keyboardType="numeric"
                />
                {errors.priceAmount && <Text style={styles.errorText}>{errors.priceAmount}</Text>}
              </View>

              <View style={styles.inputGroupHalf}>
                <Text style={styles.inputLabel}>Duration (min) *</Text>
                <TextInput
                  style={[styles.input, errors.duration && styles.inputError]}
                  placeholder="60"
                  value={formData.duration}
                  onChangeText={(text) => {
                    setFormData({ ...formData, duration: text });
                    setErrors({ ...errors, duration: null });
                  }}
                  keyboardType="numeric"
                />
                {errors.duration && <Text style={styles.errorText}>{errors.duration}</Text>}
              </View>
            </View>

            {/* Availability Days */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Available Days *</Text>
              <View style={styles.daysContainer}>
                {daysOfWeek.map((day) => (
                  <TouchableOpacity
                    key={day.value}
                    style={[
                      styles.dayChip,
                      formData.availabilityDays.includes(day.value) && styles.dayChipActive,
                      errors.availabilityDays && styles.inputError
                    ]}
                    onPress={() => toggleDay(day.value)}
                  >
                    <Text style={[
                      styles.dayChipText,
                      formData.availabilityDays.includes(day.value) && styles.dayChipTextActive
                    ]}>
                      {day.label.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.availabilityDays && <Text style={styles.errorText}>{errors.availabilityDays}</Text>}
            </View>

            {/* Time Slots */}
            <View style={styles.inputRow}>
              <View style={styles.inputGroupHalf}>
                <Text style={styles.inputLabel}>Start Time</Text>
                <TouchableOpacity
                  style={styles.timePickerButton}
                  onPress={() => openTimePicker('start')}
                >
                  <Ionicons name="time-outline" size={moderateScale(20)} color="#1C86FF" />
                  <Text style={styles.timePickerText}>{formData.timeSlotStart}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroupHalf}>
                <Text style={styles.inputLabel}>End Time</Text>
                <TouchableOpacity
                  style={styles.timePickerButton}
                  onPress={() => openTimePicker('end')}
                >
                  <Ionicons name="time-outline" size={moderateScale(20)} color="#1C86FF" />
                  <Text style={styles.timePickerText}>{formData.timeSlotEnd}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Pet Types */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Suitable for Pets *</Text>
              <View style={styles.petTypesContainer}>
                {petTypes.map((pet) => (
                  <TouchableOpacity
                    key={pet.value}
                    style={[
                      styles.petTypeChip,
                      formData.petTypes.includes(pet.value) && styles.petTypeChipActive,
                      errors.petTypes && styles.inputError
                    ]}
                    onPress={() => togglePetType(pet.value)}
                  >
                    <Ionicons
                      name={pet.icon}
                      size={moderateScale(16)}
                      color={formData.petTypes.includes(pet.value) ? '#fff' : '#1C86FF'}
                    />
                    <Text style={[
                      styles.petTypeChipText,
                      formData.petTypes.includes(pet.value) && styles.petTypeChipTextActive
                    ]}>
                      {pet.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.petTypes && <Text style={styles.errorText}>{errors.petTypes}</Text>}
            </View>

            {/* Age Restrictions */}
            <View style={styles.inputRow}>
              <View style={styles.inputGroupHalf}>
                <Text style={styles.inputLabel}>Min Age (years)</Text>
                <TextInput
                  style={[styles.input, errors.minAge && styles.inputError]}
                  placeholder="0"
                  value={formData.minAge}
                  onChangeText={(text) => {
                    setFormData({ ...formData, minAge: text });
                    setErrors({ ...errors, minAge: null, maxAge: null });
                  }}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroupHalf}>
                <Text style={styles.inputLabel}>Max Age (years)</Text>
                <TextInput
                  style={[styles.input, errors.maxAge && styles.inputError]}
                  placeholder="30"
                  value={formData.maxAge}
                  onChangeText={(text) => {
                    setFormData({ ...formData, maxAge: text });
                    setErrors({ ...errors, maxAge: null });
                  }}
                  keyboardType="numeric"
                />
                {errors.maxAge && <Text style={styles.errorText}>{errors.maxAge}</Text>}
              </View>
            </View>

            {/* Health Requirements */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Health Requirements (comma-separated)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g., Current health certificate, No fever"
                value={formData.healthRequirements}
                onChangeText={(text) => setFormData({ ...formData, healthRequirements: text })}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            {/* Special Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Special Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any special instructions or notes"
                value={formData.specialNotes}
                onChangeText={(text) => setFormData({ ...formData, specialNotes: text })}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
                maxLength={300}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name={editingService ? "checkmark-circle" : "add-circle"}
                    size={moderateScale(20)}
                    color="#fff"
                  />
                  <Text style={styles.submitButtonText}>
                    {editingService ? 'Update Service' : 'Add Service'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Time Picker Modal */}
      {showTimePicker && currentTimePicker && (
        Platform.OS === 'ios' ? (
          <Modal
            visible={showTimePicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => {
              setShowTimePicker(false);
              setCurrentTimePicker(null);
            }}
          >
            <View style={styles.timePickerModalOverlay}>
              <View style={styles.timePickerModalContent}>
                <View style={styles.timePickerHeader}>
                  <Text style={styles.timePickerTitle}>
                    Select {currentTimePicker === 'start' ? 'Start' : 'End'} Time
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowTimePicker(false);
                      setCurrentTimePicker(null);
                    }}
                  >
                    <Text style={styles.timePickerDoneButton}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={getTimeForPicker(
                    currentTimePicker === 'start' ? formData.timeSlotStart : formData.timeSlotEnd
                  )}
                  mode="time"
                  is24Hour={true}
                  display="spinner"
                  onChange={handleTimeChange}
                  style={styles.timePicker}
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={getTimeForPicker(
              currentTimePicker === 'start' ? formData.timeSlotStart : formData.timeSlotEnd
            )}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={handleTimeChange}
          />
        )
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    padding: moderateScale(20),
    maxHeight: hp(90),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(20),
    paddingBottom: moderateScale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#1C86FF',
  },
  inputGroup: {
    marginBottom: moderateScale(16),
  },
  inputRow: {
    flexDirection: 'row',
    gap: moderateScale(12),
    marginBottom: moderateScale(16),
  },
  inputGroupHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(8),
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(10),
    padding: moderateScale(12),
    fontSize: scaleFontSize(14),
    color: '#333',
    borderWidth: 1.5,
    borderColor: '#1C86FF',
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  errorText: {
    fontSize: scaleFontSize(12),
    color: '#FF6B6B',
    marginTop: moderateScale(4),
  },
  textArea: {
    minHeight: moderateScale(80),
    paddingTop: moderateScale(12),
  },
  imagePickerButton: {
    width: '100%',
    height: moderateScale(150),
    borderRadius: moderateScale(12),
    borderWidth: 2,
    borderColor: '#1C86FF',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  imagePlaceholderText: {
    fontSize: scaleFontSize(13),
    color: '#999',
    marginTop: moderateScale(8),
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(12),
    borderWidth: 1.5,
    borderColor: '#1C86FF',
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
    flex: 1,
  },
  dropdownText: {
    fontSize: scaleFontSize(14),
    color: '#333',
    fontWeight: '500',
  },
  dropdownPlaceholder: {
    color: '#999',
    fontWeight: '400',
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(10),
    marginTop: moderateScale(8),
    borderWidth: 1.5,
    borderColor: '#1C86FF',
    maxHeight: moderateScale(200),
    elevation: 5,
    shadowColor: '#1C86FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: moderateScale(12),
  },
  dropdownItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  dropdownItemPressed: {
    backgroundColor: '#F5F5F5',
  },
  dropdownItemText: {
    fontSize: scaleFontSize(14),
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },
  dropdownItemTextSelected: {
    color: '#1C86FF',
    fontWeight: '600',
  },
  categoryIcon: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIconSmall: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  dayChip: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(8),
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#1C86FF',
  },
  dayChipActive: {
    backgroundColor: '#1C86FF',
  },
  dayChipText: {
    fontSize: scaleFontSize(12),
    color: '#1C86FF',
    fontWeight: '600',
  },
  dayChipTextActive: {
    color: '#fff',
  },
  petTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  petTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(8),
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#1C86FF',
  },
  petTypeChipActive: {
    backgroundColor: '#1C86FF',
  },
  petTypeChipText: {
    fontSize: scaleFontSize(12),
    color: '#1C86FF',
    fontWeight: '600',
  },
  petTypeChipTextActive: {
    color: '#fff',
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(12),
    borderWidth: 1.5,
    borderColor: '#1C86FF',
    gap: moderateScale(10),
  },
  timePickerText: {
    fontSize: scaleFontSize(14),
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  timePickerModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  timePickerModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    paddingBottom: moderateScale(20),
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timePickerTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: '#333',
  },
  timePickerDoneButton: {
    fontSize: scaleFontSize(16),
    color: '#1C86FF',
    fontWeight: '600',
  },
  timePicker: {
    width: '100%',
    height: moderateScale(200),
  },
  submitButton: {
    backgroundColor: '#1C86FF',
    borderRadius: moderateScale(12),
    paddingVertical: hp(1.8),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: moderateScale(8),
    marginTop: moderateScale(20),
    marginBottom: moderateScale(10),
  },
  submitButtonDisabled: {
    backgroundColor: '#91C4FF',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
});
