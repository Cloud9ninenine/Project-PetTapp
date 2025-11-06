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
import { hp, moderateScale, scaleFontSize } from '@utils/responsive';

export default function AddServiceModal({ visible, onClose, onAddService, editingService, businessId }) {
  const [loading, setLoading] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [currentHealthReq, setCurrentHealthReq] = useState('');

  // Form state matching backend schema
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    duration: '',
    priceAmount: '',
    priceCurrency: 'PHP',
    petTypes: [],
    minAge: '',
    maxAge: '',
    healthRequirements: [], // Changed from string to array
    specialNotes: '',
  });

  const [errors, setErrors] = useState({});

  // Backend categories (aligned with home screen browse categories)
  const categories = [
    { value: 'veterinary', label: 'Veterinary', icon: 'medical-outline', color: '#FF6B6B' },
    { value: 'grooming', label: 'Grooming', icon: 'cut-outline', color: '#4ECDC4' },
    { value: 'accommodation', label: 'Accommodation', icon: 'home-outline', color: '#95E1D3' },
    { value: 'transport', label: 'Transport', icon: 'car-outline', color: '#FFD93D' },
    { value: 'pet-supplies', label: 'Pet Supplies', icon: 'cube-outline', color: '#6C5CE7' },
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
        petTypes: editingService.requirements?.petTypes || [],
        minAge: editingService.requirements?.ageRestrictions?.minAge?.toString() || '',
        maxAge: editingService.requirements?.ageRestrictions?.maxAge?.toString() || '',
        healthRequirements: editingService.requirements?.healthRequirements || [], // Keep as array
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
      petTypes: [],
      minAge: '',
      maxAge: '',
      healthRequirements: [], // Reset as empty array
      specialNotes: '',
    });
    setImageUri(null);
    setErrors({});
    setCurrentHealthReq('');
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

    // Validate businessId is present when creating new service
    if (!editingService && !businessId) {
      Alert.alert('Error', 'Business ID is required to create a service');
      return;
    }

    try {
      setLoading(true);

      const formDataToSend = new FormData();

      // businessId is only needed when creating (not when editing)
      // When editing, the service already has a businessId that can't be changed
      if (!editingService && businessId) {
        formDataToSend.append('businessId', businessId);
      }

      // Required fields
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('category', formData.category);
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('duration', formData.duration);

      // Price as JSON string
      formDataToSend.append('price', JSON.stringify({
        amount: parseFloat(formData.priceAmount),
        currency: formData.priceCurrency,
      }));

      // Requirements as JSON string - ALWAYS send complete object to avoid data loss
      // This prevents MongoDB from deleting fields when doing partial updates
      const requirements = {
        petTypes: formData.petTypes,
        healthRequirements: formData.healthRequirements, // Always an array (can be empty)
        specialNotes: formData.specialNotes.trim() || '', // Always a string (can be empty)
      };

      // Add ageRestrictions - include even if empty to prevent deletion on edit
      // If both fields are empty/cleared, we still include an empty object
      const hasMinAge = formData.minAge && formData.minAge.toString().trim() !== '';
      const hasMaxAge = formData.maxAge && formData.maxAge.toString().trim() !== '';

      if (hasMinAge || hasMaxAge) {
        requirements.ageRestrictions = {};
        if (hasMinAge) {
          requirements.ageRestrictions.minAge = parseFloat(formData.minAge);
        }
        if (hasMaxAge) {
          requirements.ageRestrictions.maxAge = parseFloat(formData.maxAge);
        }
      } else if (editingService) {
        // When editing and both are cleared, send empty object to clear old values
        // (undefined would cause the field to be omitted, keeping old values)
        requirements.ageRestrictions = {};
      }

      // Log submission details to help debugging
      console.log('=== SUBMITTING SERVICE ===');
      console.log('Mode:', editingService ? 'EDIT' : 'CREATE');
      console.log('Service ID:', editingService?._id || 'N/A');
      console.log('Business ID:', businessId || 'NOT SET');
      console.log('Business ID being sent:', !editingService && businessId ? businessId : 'OMITTED (editing mode)');
      console.log('Requirements being sent:', JSON.stringify(requirements, null, 2));

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

      // Call the appropriate handler (create or update)
      if (editingService) {
        await onAddService(formDataToSend, editingService._id);
      } else {
        await onAddService(formDataToSend);
      }
      resetForm();
    } catch (error) {
      console.error('Error submitting service:', error);
      // Error is handled by parent component
    } finally {
      setLoading(false);
    }
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

  const addHealthRequirement = () => {
    if (currentHealthReq.trim()) {
      setFormData(prev => ({
        ...prev,
        healthRequirements: [...prev.healthRequirements, currentHealthReq.trim()],
      }));
      setCurrentHealthReq('');
    }
  };

  const removeHealthRequirement = (index) => {
    setFormData(prev => ({
      ...prev,
      healthRequirements: prev.healthRequirements.filter((_, i) => i !== index),
    }));
  };

  const getCategoryData = () => {
    return categories.find(c => c.value === formData.category);
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
              <Text style={styles.inputLabel}>
                Service Name <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
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
              <Text style={styles.inputLabel}>
                Category <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
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
              <Text style={styles.inputLabel}>
                Description <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
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

            {/* Price and Currency */}
            <View style={styles.inputRow}>
              <View style={styles.inputGroupHalf}>
                <Text style={styles.inputLabel}>
                  Price <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
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
                <Text style={styles.inputLabel}>
                  Currency <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[styles.input, styles.currencyDropdown]}
                  onPress={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                >
                  <Text style={styles.currencyText}>{formData.priceCurrency}</Text>
                  <Ionicons
                    name={showCurrencyDropdown ? "chevron-up" : "chevron-down"}
                    size={moderateScale(20)}
                    color="#666"
                  />
                </TouchableOpacity>
                {showCurrencyDropdown && (
                  <View style={styles.currencyDropdownList}>
                    <Pressable
                      style={[
                        styles.currencyDropdownItem,
                        formData.priceCurrency === 'PHP' && styles.currencyDropdownItemSelected
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, priceCurrency: 'PHP' });
                        setShowCurrencyDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.currencyDropdownItemText,
                        formData.priceCurrency === 'PHP' && styles.currencyDropdownItemTextSelected
                      ]}>
                        PHP
                      </Text>
                      {formData.priceCurrency === 'PHP' && (
                        <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#1C86FF" />
                      )}
                    </Pressable>
                    <Pressable
                      style={[
                        styles.currencyDropdownItem,
                        formData.priceCurrency === 'USD' && styles.currencyDropdownItemSelected
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, priceCurrency: 'USD' });
                        setShowCurrencyDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.currencyDropdownItemText,
                        formData.priceCurrency === 'USD' && styles.currencyDropdownItemTextSelected
                      ]}>
                        USD
                      </Text>
                      {formData.priceCurrency === 'USD' && (
                        <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#1C86FF" />
                      )}
                    </Pressable>
                  </View>
                )}
              </View>
            </View>

            {/* Duration */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Duration (min) <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
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

            {/* Pet Types */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Suitable for Pets <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
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
              <Text style={styles.inputLabel}>Health Requirements</Text>
              <View style={styles.healthReqInputContainer}>
                <TextInput
                  style={[styles.input, styles.healthReqInput]}
                  placeholder="e.g., Current health certificate"
                  value={currentHealthReq}
                  onChangeText={setCurrentHealthReq}
                  onSubmitEditing={addHealthRequirement}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={addHealthRequirement}
                >
                  <Ionicons name="add-circle" size={moderateScale(28)} color="#1C86FF" />
                </TouchableOpacity>
              </View>

              {/* Display added health requirements */}
              <View style={styles.healthReqList}>
                {formData.healthRequirements.map((req, index) => (
                  <View key={index} style={styles.healthReqChip}>
                    <Text style={styles.healthReqChipText} numberOfLines={2}>{req}</Text>
                    <TouchableOpacity
                      onPress={() => removeHealthRequirement(index)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="close-circle" size={moderateScale(20)} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
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
  requiredAsterisk: {
    color: '#FF0000',
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
  currencyDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currencyText: {
    fontSize: scaleFontSize(14),
    color: '#333',
    fontWeight: '600',
  },
  currencyDropdownList: {
    position: 'absolute',
    top: moderateScale(75),
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: moderateScale(10),
    borderWidth: 1.5,
    borderColor: '#1C86FF',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#1C86FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  currencyDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  currencyDropdownItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  currencyDropdownItemText: {
    fontSize: scaleFontSize(14),
    color: '#333',
    fontWeight: '500',
  },
  currencyDropdownItemTextSelected: {
    color: '#1C86FF',
    fontWeight: '600',
  },
  petTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  petTypeChip: {
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
  healthReqInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  healthReqInput: {
    flex: 1,
    marginBottom: 0,
  },
  addButton: {
    padding: moderateScale(4),
  },
  healthReqList: {
    marginTop: moderateScale(12),
    gap: moderateScale(8),
  },
  healthReqChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E3F2FD',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#1C86FF',
  },
  healthReqChipText: {
    flex: 1,
    fontSize: scaleFontSize(13),
    color: '#333',
    marginRight: moderateScale(8),
  },
  removeButton: {
    padding: moderateScale(2),
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
