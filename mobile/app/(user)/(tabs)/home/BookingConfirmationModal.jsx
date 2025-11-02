import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  TextInput,
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

  // Fetch addresses from API
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Required fields
  const [selectedPet, setSelectedPet] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [locationType, setLocationType] = useState('clinic');

  // Optional fields
  const [selectedAddress, setSelectedAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states for custom styled alerts
  const [alertModal, setAlertModal] = useState({
    visible: false,
    type: '', // 'error', 'success', 'validation'
    title: '',
    message: '',
  });

  // Payment methods from API enum (aligned with web version)
  const paymentMethods = [
    {
      value: 'cash',
      label: 'Cash',
      icon: 'cash-outline',
      description: 'Pay in cash when you receive the service'
    },
    {
      value: 'qr-payment',
      label: 'QR Payment',
      icon: 'qr-code-outline',
      description: 'Pay via GCash, PayMaya, or Bank Transfer'
    },
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
        showAlert('error', 'Error', 'Failed to load your pets. Please try again.');
      } finally {
        setLoadingPets(false);
      }
    };

    if (visible) {
      fetchPets();
    }
  }, [visible]);

  // Fetch addresses from API
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setLoadingAddresses(true);
        const response = await apiClient.get('/addresses');
        if (response.data.success) {
          setAddresses(response.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
        // Don't show alert for addresses as they're optional
      } finally {
        setLoadingAddresses(false);
      }
    };

    if (visible && locationType === 'home') {
      fetchAddresses();
    }
  }, [visible, locationType]);

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

  // Helper functions for showing styled alerts
  const showAlert = (type, title, message) => {
    setAlertModal({ visible: true, type, title, message });
  };

  const hideAlert = () => {
    setAlertModal({ visible: false, type: '', title: '', message: '' });
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
      showAlert('validation', 'Required Field', 'Please select a pet');
      return;
    }

    if (!paymentMethod) {
      showAlert('validation', 'Required Field', 'Please select a payment method');
      return;
    }

    if (!locationType) {
      showAlert('validation', 'Required Field', 'Please select service location');
      return;
    }

    if (locationType === 'home' && !selectedAddress) {
      showAlert('validation', 'Required Field', 'Please select an address for home service');
      return;
    }

    // Validate field lengths
    if (notes.length > 500) {
      showAlert('validation', 'Validation Error', 'Notes must be 500 characters or less');
      return;
    }

    if (specialRequests.length > 300) {
      showAlert('validation', 'Validation Error', 'Special requests must be 300 characters or less');
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
        paymentMethod,
        locationType,
        ...(locationType === 'home' && selectedAddress && { addressId: selectedAddress }),
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

        showAlert('success', 'Success!', 'Your booking request has been submitted successfully. The business will review and confirm your appointment.');
        setTimeout(() => {
          hideAlert();
          onConfirm(bookingResult);
        }, 2000);
      } else {
        showAlert('error', 'Booking Failed', response.data.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
      showAlert('error', 'Booking Error', errorMessage);
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

            <Text style={styles.modalTitle}>Book Appointment</Text>
            <Text style={styles.modalSubtitle}>
              Fill in the details to submit your booking request.
            </Text>

            {/* Status Information Notice */}
            <View style={styles.statusInfoBox}>
              <View style={styles.statusInfoHeader}>
                <Ionicons name="information-circle" size={moderateScale(20)} color="#1C86FF" />
                <Text style={styles.statusInfoTitle}>Booking Status</Text>
              </View>
              <Text style={styles.statusInfoText}>
                Your booking will be created with <Text style={styles.statusBadge}>PENDING</Text> status.
              </Text>
            </View>

            {/* Pet Selection - REQUIRED */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Select Pet <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
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
              <Text style={styles.inputLabel}>
                Date <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TouchableOpacity style={styles.inputField} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.inputText}>
                  {formatDate(selectedDate)}
                </Text>
                <Ionicons name="calendar-outline" size={moderateScale(20)} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Time - REQUIRED */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Time <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TouchableOpacity style={styles.inputField} onPress={() => setShowTimePicker(true)}>
                <Text style={styles.inputText}>
                  {formatTime(selectedTime)}
                </Text>
                <Ionicons name="chevron-down" size={moderateScale(20)} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Service Location - REQUIRED */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Service Location <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.pickerContainer}>
                <Ionicons name="location-outline" size={moderateScale(20)} color="#fff" style={styles.inputIcon} />
                <Picker
                  selectedValue={locationType}
                  onValueChange={(itemValue) => {
                    setLocationType(itemValue);
                    if (itemValue === 'clinic') {
                      setSelectedAddress('');
                    }
                  }}
                  style={styles.picker}
                  dropdownIconColor="#fff"
                >
                  <Picker.Item label="Clinic" value="clinic" />
                  <Picker.Item label="Home Service" value="home" />
                </Picker>
              </View>
            </View>

            {/* Address Selection - REQUIRED for home service */}
            {locationType === 'home' && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  Choose Address <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                {loadingAddresses ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#1C86FF" />
                    <Text style={styles.loadingText}>Loading addresses...</Text>
                  </View>
                ) : addresses.length > 0 ? (
                  <View style={styles.pickerContainer}>
                    <Ionicons name="home-outline" size={moderateScale(20)} color="#fff" style={styles.inputIcon} />
                    <Picker
                      selectedValue={selectedAddress}
                      onValueChange={(itemValue) => setSelectedAddress(itemValue)}
                      style={styles.picker}
                      dropdownIconColor="#fff"
                    >
                      <Picker.Item label="Select an address" value="" />
                      {addresses.map((addr) => (
                        <Picker.Item
                          key={addr._id}
                          label={`${addr.label} — ${addr.city}`}
                          value={addr._id}
                        />
                      ))}
                    </Picker>
                  </View>
                ) : (
                  <View style={styles.noPetsContainer}>
                    <Ionicons name="home-outline" size={moderateScale(32)} color="#999" />
                    <Text style={styles.noPetsText}>No saved addresses. Please add one in your profile.</Text>
                  </View>
                )}
              </View>
            )}

            {/* Payment Method - REQUIRED */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Payment Method <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
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
                <Text style={styles.bookButtonText}>Submit Booking Request</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>

      {/* Custom Styled Alert Modal */}
      <Modal
        visible={alertModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={hideAlert}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertContainer}>
            {/* Icon based on type */}
            <View style={[
              styles.alertIconContainer,
              alertModal.type === 'success' && styles.successIconContainer,
              alertModal.type === 'error' && styles.errorIconContainer,
              alertModal.type === 'validation' && styles.validationIconContainer,
            ]}>
              <Ionicons
                name={
                  alertModal.type === 'success' ? 'checkmark-circle' :
                  alertModal.type === 'error' ? 'close-circle' :
                  'alert-circle'
                }
                size={moderateScale(60)}
                color="#fff"
              />
            </View>

            {/* Title */}
            <Text style={styles.alertTitle}>{alertModal.title}</Text>

            {/* Message */}
            <Text style={styles.alertMessage}>{alertModal.message}</Text>

            {/* OK Button */}
            <TouchableOpacity
              style={[
                styles.alertButton,
                alertModal.type === 'success' && styles.successButton,
                alertModal.type === 'error' && styles.errorButton,
                alertModal.type === 'validation' && styles.validationButton,
              ]}
              onPress={hideAlert}
            >
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    maxHeight: screenHeight * 0.95,
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
    height: moderateScale(50),
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
    height: moderateScale(50),
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
  // Status info box styles
  statusInfoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: moderateScale(16),
    borderLeftWidth: moderateScale(4),
    borderLeftColor: '#1C86FF',
  },
  statusInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  statusInfoTitle: {
    fontSize: scaleFontSize(15),
    fontWeight: '700',
    color: '#1C86FF',
    marginLeft: moderateScale(8),
  },
  statusInfoText: {
    fontSize: scaleFontSize(13),
    color: '#333',
    lineHeight: scaleFontSize(20),
  },
  statusBadge: {
    fontWeight: '700',
    color: '#FF9B79',
  },
  requiredAsterisk: {
    color: '#FF0000',
  },
  // Custom Alert Modal Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  alertContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(20),
    padding: moderateScale(30),
    width: '90%',
    maxWidth: moderateScale(400),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  alertIconContainer: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(20),
  },
  successIconContainer: {
    backgroundColor: '#4CAF50',
  },
  errorIconContainer: {
    backgroundColor: '#F44336',
  },
  validationIconContainer: {
    backgroundColor: '#FF9800',
  },
  alertTitle: {
    fontSize: scaleFontSize(22),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: moderateScale(12),
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: scaleFontSize(15),
    color: '#666',
    textAlign: 'center',
    lineHeight: scaleFontSize(22),
    marginBottom: moderateScale(25),
  },
  alertButton: {
    width: '100%',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(12),
    alignItems: 'center',
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  errorButton: {
    backgroundColor: '#F44336',
  },
  validationButton: {
    backgroundColor: '#FF9800',
  },
  alertButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
});
