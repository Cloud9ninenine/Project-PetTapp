import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { wp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from '@config/api';

const { height: screenHeight } = Dimensions.get('window');

export default function BookingConfirmationModal({
  visible,
  onClose,
  onConfirm,
  bookingData,
}) {
  const [slideAnim] = useState(new Animated.Value(screenHeight));

  // Fetch pets from API
  const [pets, setPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);

  // Required fields
  const [selectedPet, setSelectedPet] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());

  // Optional fields
  const [notes, setNotes] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment methods from API enum
  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: 'cash-outline' },
    { value: 'gcash', label: 'GCash', icon: 'phone-portrait-outline' },
    { value: 'paymaya', label: 'PayMaya', icon: 'phone-portrait-outline' },
    { value: 'credit-card', label: 'Credit Card', icon: 'card-outline' },
    { value: 'debit-card', label: 'Debit Card', icon: 'card-outline' },
  ];

  // Fetch pets from API
  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoadingPets(true);
        const response = await apiClient.get('/pets');
        if (response.data.success) {
          setPets(response.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching pets:', error);
        Alert.alert('Error', 'Failed to load your pets. Please try again.');
      } finally {
        setLoadingPets(false);
      }
    };

    if (visible) {
      fetchPets();
    }
  }, [visible]);

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const getServiceImageSource = () => {
    // Priority 1: Use imageUrl from API response if available
    if (bookingData?.service?.imageUrl && typeof bookingData.service.imageUrl === 'string') {
      return { uri: bookingData.service.imageUrl };
    }

    // Priority 2: Fallback to category-based images
    const category = bookingData?.service?.category || bookingData?.service?.type;
    const serviceName = bookingData?.service?.name;

    // Veterinary services
    if (category === 'veterinary') {
      if (serviceName === 'Animed Veterinary Clinic') {
        return require('@assets/images/serviceimages/17.png');
      } else if (serviceName === 'Vetfusion Animal Clinic') {
        return require('@assets/images/serviceimages/19.png');
      } else {
        return require('@assets/images/serviceimages/18.png');
      }
    }

    // Grooming services
    if (category === 'grooming') {
      return require('@assets/images/serviceimages/21.png');
    }

    // Boarding services
    if (category === 'boarding' || category === 'daycare') {
      if (serviceName === 'PetCity Daycare') {
        return require('@assets/images/serviceimages/16.png');
      }
      return require('@assets/images/serviceimages/22.png');
    }

    // Training services
    if (category === 'training') {
      return require('@assets/images/serviceimages/17.png');
    }

    // Emergency services
    if (category === 'emergency') {
      return require('@assets/images/serviceimages/19.png');
    }

    // Consultation services
    if (category === 'consultation') {
      return require('@assets/images/serviceimages/18.png');
    }

    // Default fallback
    return require('@assets/images/serviceimages/18.png');
  };

  const renderStars = (rating = 4.9) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={moderateScale(14)} color="#ff9b79" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Ionicons key={i} name="star-half" size={moderateScale(14)} color="#ff9b79" />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={moderateScale(14)} color="#E0E0E0" />);
      }
    }
    return stars;
  };

  const formatDate = (date) => {
    const options = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (time) => {
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimeChange = (event, time) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (time) {
      setSelectedTime(time);
    }
  };

  const handleConfirm = async () => {
    // Validate required fields
    if (!selectedPet) {
      Alert.alert('Required Field', 'Please select a pet');
      return;
    }

    if (!paymentMethod) {
      Alert.alert('Required Field', 'Please select a payment method');
      return;
    }

    // Validate field lengths
    if (notes.length > 500) {
      Alert.alert('Validation Error', 'Notes must be 500 characters or less');
      return;
    }

    if (specialRequests.length > 300) {
      Alert.alert('Validation Error', 'Special requests must be 300 characters or less');
      return;
    }

    try {
      setIsSubmitting(true);

      // Combine date and time into ISO datetime string
      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(selectedTime.getHours());
      appointmentDate.setMinutes(selectedTime.getMinutes());
      appointmentDate.setSeconds(0);
      appointmentDate.setMilliseconds(0);

      // Prepare booking payload matching API requirements
      const bookingPayload = {
        serviceId: bookingData?.service?.id,
        petId: selectedPet,
        appointmentDateTime: appointmentDate.toISOString(),
        ...(paymentMethod && { paymentMethod }),
        ...(notes.trim() && { notes: notes.trim() }),
        ...(specialRequests.trim() && { specialRequests: specialRequests.trim() }),
      };

      console.log('Creating booking with payload:', bookingPayload);

      const response = await apiClient.post('/bookings', bookingPayload);

      if (response.data.success) {
        const selectedPetData = pets.find(p => p._id === selectedPet);
        const bookingResult = {
          booking: response.data.data,
          service: bookingData?.service,
          pet: selectedPetData,
          date: formatDate(appointmentDate),
          time: formatTime(appointmentDate),
          paymentMethod,
          notes,
          specialRequests,
        };

        onConfirm(bookingResult);
      } else {
        Alert.alert('Booking Failed', response.data.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
      Alert.alert('Booking Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.handleBar} />

            <Text style={styles.modalTitle}>Book Confirmation</Text>
            <Text style={styles.modalSubtitle}>
              This service will be booked to {'\n'}the selected schedule.
            </Text>

            <View style={styles.serviceCard}>
              <Image source={getServiceImageSource()} style={styles.serviceImage} />
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{bookingData?.service?.name}</Text>
                <Text style={styles.serviceCategory}>
                  {((bookingData?.service?.category || bookingData?.service?.type || '').charAt(0).toUpperCase() +
                   (bookingData?.service?.category || bookingData?.service?.type || '').slice(1))}
                </Text>
                <View style={styles.starsContainer}>
                  {renderStars(bookingData?.service?.rating)}
                </View>
                {bookingData?.service?.price && (
                  <Text style={styles.servicePriceText}>
                    {typeof bookingData.service.price === 'string' && bookingData.service.price.startsWith('₱')
                      ? bookingData.service.price
                      : typeof bookingData.service.price === 'object'
                      ? `₱${bookingData.service.price.amount}`
                      : `₱${bookingData.service.price}`}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Pet Selection - REQUIRED */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Select Pet *</Text>
              {loadingPets ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#1C86FF" />
                  <Text style={styles.loadingText}>Loading your pets...</Text>
                </View>
              ) : pets.length > 0 ? (
                <View style={styles.pickerContainer}>
                  <Ionicons name="paw" size={moderateScale(20)} color="#fff" style={styles.inputIcon} />
                  <Picker
                    selectedValue={selectedPet}
                    onValueChange={(itemValue) => setSelectedPet(itemValue)}
                    style={styles.picker}
                    dropdownIconColor="#fff"
                  >
                    <Picker.Item label="Choose your pet" value="" />
                    {pets.map((pet) => (
                      <Picker.Item
                        key={pet._id}
                        label={`${pet.name} (${pet.species} - ${pet.breed || 'Mixed'})`}
                        value={pet._id}
                      />
                    ))}
                  </Picker>
                </View>
              ) : (
                <View style={styles.noPetsContainer}>
                  <Ionicons name="paw-outline" size={moderateScale(32)} color="#999" />
                  <Text style={styles.noPetsText}>No pets found. Please add a pet first.</Text>
                </View>
              )}
            </View>

            {/* Date - REQUIRED */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Date *</Text>
              <TouchableOpacity style={styles.inputField} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.inputText}>
                  {formatDate(selectedDate)}
                </Text>
                <View style={styles.calendarIcon}>
                  <Text style={styles.calendarIconText}>📅</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Time - REQUIRED */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Time *</Text>
              <TouchableOpacity style={styles.inputField} onPress={() => setShowTimePicker(true)}>
                <Text style={styles.inputText}>
                  {formatTime(selectedTime)}
                </Text>
                <View style={styles.dropdownIcon}>
                  <Text style={styles.dropdownIconText}>⌄</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Payment Method - REQUIRED */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Payment Method *</Text>
              <View style={styles.pickerContainer}>
                <Ionicons name="wallet-outline" size={moderateScale(20)} color="#fff" style={styles.inputIcon} />
                <Picker
                  selectedValue={paymentMethod}
                  onValueChange={(itemValue) => setPaymentMethod(itemValue)}
                  style={styles.picker}
                  dropdownIconColor="#fff"
                >
                  <Picker.Item label="Choose payment method" value="" />
                  {paymentMethods.map((method) => (
                    <Picker.Item
                      key={method.value}
                      label={method.label}
                      value={method.value}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Notes - OPTIONAL (max 500 chars) */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Notes (Optional) {notes.length > 0 && `- ${notes.length}/500`}
              </Text>
              <View style={styles.textAreaContainer}>
                <TextInput
                  style={styles.textArea}
                  placeholder="e.g., Please call when you arrive"
                  placeholderTextColor="#999"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  maxLength={500}
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Special Requests - OPTIONAL (max 300 chars) */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Special Requests (Optional) {specialRequests.length > 0 && `- ${specialRequests.length}/300`}
              </Text>
              <View style={styles.textAreaContainer}>
                <TextInput
                  style={styles.textArea}
                  placeholder="e.g., Pet is nervous around loud noises"
                  placeholderTextColor="#999"
                  value={specialRequests}
                  onChangeText={setSpecialRequests}
                  multiline
                  maxLength={300}
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Book Button */}
            <TouchableOpacity
              style={[styles.bookButton, isSubmitting && styles.bookButtonDisabled]}
              onPress={handleConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.bookButtonText}>Confirm Booking</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>

      {/* Native Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Native Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    paddingHorizontal: moderateScale(18),
    paddingBottom: moderateScale(30),
    paddingTop: moderateScale(10),
    maxHeight: screenHeight * 0.9,
  },
  handleBar: {
    width: moderateScale(40),
    height: moderateScale(4),
    backgroundColor: '#E0E0E0',
    borderRadius: moderateScale(2),
    alignSelf: 'center',
    marginBottom: moderateScale(15),
  },
  modalTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#1C86FF',
    textAlign: 'center',
    marginBottom: moderateScale(8),
  },
  modalSubtitle: {
    fontSize: scaleFontSize(14),
    color: '#666',
    textAlign: 'center',
    marginBottom: moderateScale(20),
    lineHeight: moderateScale(20),
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    marginBottom: moderateScale(12),
    borderWidth: 1,
    borderColor: '#1C86FF',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: moderateScale(15),
  },
  serviceImage: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(8),
    resizeMode: 'cover',
  },
  serviceInfo: {
    flex: 1,
    marginLeft: moderateScale(15),
    justifyContent: 'center',
  },
  serviceName: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(4),
  },
  serviceCategory: {
    fontSize: scaleFontSize(12),
    color: '#FF9B79',
    marginBottom: moderateScale(6),
  },
  starsContainer: {
    flexDirection: 'row',
    gap: moderateScale(1),
  },
  servicePriceText: {
    fontSize: scaleFontSize(14),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginTop: moderateScale(4),
  },
  inputContainer: {
    marginBottom: moderateScale(12),
  },
  inputLabel: {
    fontSize: scaleFontSize(13),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(8),
  },
  inputField: {
    backgroundColor: '#1C86FF',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputIcon: {
    marginRight: moderateScale(10),
  },
  inputText: {
    flex: 1,
    fontSize: scaleFontSize(16),
    color: '#fff',
  },
  calendarIcon: {
    width: moderateScale(24),
    height: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarIconText: {
    fontSize: scaleFontSize(18),
    color: '#fff',
  },
  dropdownIcon: {
    width: moderateScale(24),
    height: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownIconText: {
    fontSize: scaleFontSize(18),
    color: '#fff',
    fontWeight: 'bold',
  },
  bookButton: {
    backgroundColor: '#1C86FF',
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    marginTop: moderateScale(20),
    shadowColor: '#1C86FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bookButtonDisabled: {
    backgroundColor: '#B3D9FF',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
  },
  // Picker styles
  pickerContainer: {
    backgroundColor: '#1C86FF',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(15),
    flexDirection: 'row',
    alignItems: 'center',
  },
  picker: {
    flex: 1,
    color: '#fff',
    height: moderateScale(50),
  },
  loadingContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: moderateScale(8),
    padding: moderateScale(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: scaleFontSize(14),
    color: '#1C86FF',
    fontWeight: '600',
    marginLeft: moderateScale(10),
  },
  noPetsContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: moderateScale(8),
    padding: moderateScale(20),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  noPetsText: {
    fontSize: scaleFontSize(14),
    color: '#666',
    marginTop: moderateScale(12),
    textAlign: 'center',
  },
  // Text area styles
  textAreaContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    padding: moderateScale(12),
    fontSize: scaleFontSize(14),
    color: '#333',
    minHeight: moderateScale(60),
    maxHeight: moderateScale(100),
  },
});
