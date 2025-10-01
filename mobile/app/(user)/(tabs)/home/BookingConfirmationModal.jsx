import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { wp, moderateScale, scaleFontSize } from '@utils/responsive';

const { height: screenHeight } = Dimensions.get('window');

export default function BookingConfirmationModal({
  visible,
  onClose,
  onConfirm,
  bookingData,
}) {
  const [slideAnim] = useState(new Animated.Value(screenHeight));

  // Mock pets data
  const pets = [
    { id: '1', name: 'Max', type: 'Dog', breed: 'Golden Retriever' },
    { id: '2', name: 'Luna', type: 'Cat', breed: 'Persian' },
    { id: '3', name: 'Charlie', type: 'Dog', breed: 'Beagle' },
  ];

  // Mock payment options
  const [paymentOptions, setPaymentOptions] = useState([
    { id: '1', name: 'Visa', cardNumber: '**** **** **** 1234', type: 'visa' },
    { id: '2', name: 'Mastercard', cardNumber: '**** **** **** 5678', type: 'mastercard' },
  ]);

  const transportationOptions = [
    { id: '1', label: 'Own Transportation', icon: 'car-outline' },
    { id: '2', label: 'PetTapp Rider', icon: 'bicycle-outline' },
    { id: '3', label: 'Walk-in', icon: 'walk-outline' },
  ];

  const [selectedPet, setSelectedPet] = useState('');
  const [selectedTransportation, setSelectedTransportation] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

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

  const getServiceImage = () => {
    const serviceName = bookingData?.service?.name;
    if (serviceName === 'Animed Veterinary Clinic') {
      return require('@assets/images/serviceimages/17.png');
    } else if (serviceName === 'Vetfusion Animal Clinic') {
      return require('@assets/images/serviceimages/19.png');
    } else {
      return require('@assets/images/serviceimages/18.png');
    }
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

  const handleConfirm = () => {
    if (!selectedPet || !selectedTransportation || !selectedPayment) {
      alert('Please fill all required fields');
      return;
    }

    if (selectedTransportation === '2' && !pickupAddress) {
      alert('Please enter pickup address for PetTapp Rider');
      return;
    }

    const data = {
      service: bookingData?.service,
      pet: pets.find(p => p.id === selectedPet),
      transportation: transportationOptions.find(t => t.id === selectedTransportation),
      payment: paymentOptions.find(p => p.id === selectedPayment),
      pickupAddress: selectedTransportation === '2' ? pickupAddress : null,
      date: formatDate(selectedDate),
      time: formatTime(selectedTime),
    };

    onConfirm(data);
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
              <Image source={getServiceImage()} style={styles.serviceImage} />
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{bookingData?.service?.name}</Text>
                <Text style={styles.serviceCategory}>{bookingData?.service?.type}</Text>
                <View style={styles.starsContainer}>
                  {renderStars()}
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Pet Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Select Pet *</Text>
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
                      key={pet.id}
                      label={`${pet.name} (${pet.type} - ${pet.breed})`}
                      value={pet.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Transportation */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Transportation *</Text>
              <View style={styles.transportationRow}>
                {transportationOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.transportationCard,
                      selectedTransportation === option.id && styles.transportationCardSelected
                    ]}
                    onPress={() => setSelectedTransportation(option.id)}
                  >
                    <Ionicons
                      name={option.icon}
                      size={moderateScale(24)}
                      color={selectedTransportation === option.id ? '#fff' : '#1C86FF'}
                    />
                    <Text style={[
                      styles.transportationLabel,
                      selectedTransportation === option.id && styles.transportationLabelSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Pickup Address (conditional) */}
              {selectedTransportation === '2' && (
                <View style={styles.addressInputContainer}>
                  <Ionicons name="location-outline" size={moderateScale(20)} color="#1C86FF" />
                  <TextInput
                    style={styles.addressInput}
                    placeholder="Enter pickup address *"
                    placeholderTextColor="#999"
                    value={pickupAddress}
                    onChangeText={setPickupAddress}
                    multiline
                  />
                </View>
              )}
            </View>

            {/* Payment Method */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Payment Method *</Text>
              {paymentOptions.map((card) => (
                <TouchableOpacity
                  key={card.id}
                  style={[
                    styles.paymentCard,
                    selectedPayment === card.id && styles.paymentCardSelected
                  ]}
                  onPress={() => setSelectedPayment(card.id)}
                >
                  <Ionicons
                    name="card"
                    size={moderateScale(28)}
                    color={selectedPayment === card.id ? '#fff' : '#1C86FF'}
                  />
                  <View style={styles.cardDetails}>
                    <Text style={[
                      styles.paymentCardName,
                      selectedPayment === card.id && styles.paymentCardNameSelected
                    ]}>
                      {card.name}
                    </Text>
                    <Text style={[
                      styles.paymentCardNumber,
                      selectedPayment === card.id && styles.paymentCardNumberSelected
                    ]}>
                      {card.cardNumber}
                    </Text>
                  </View>
                  {selectedPayment === card.id && (
                    <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Date */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Date</Text>
              <TouchableOpacity style={styles.inputField} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.inputText}>
                  {bookingData?.date || formatDate(selectedDate)}
                </Text>
                <View style={styles.calendarIcon}>
                  <Text style={styles.calendarIconText}>📅</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Time */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Time</Text>
              <TouchableOpacity style={styles.inputField} onPress={() => setShowTimePicker(true)}>
                <Text style={styles.inputText}>
                  {bookingData?.time || formatTime(selectedTime)}
                </Text>
                <View style={styles.dropdownIcon}>
                  <Text style={styles.dropdownIconText}>⌄</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.bookButton}
                onPress={handleConfirm}
              >
                <Text style={styles.bookButtonText}>Book</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.chatButton}
                onPress={onClose}
              >
                <Text style={styles.chatButtonText}>Chat</Text>
              </TouchableOpacity>
            </View>
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
  buttonContainer: {
    flexDirection: 'row',
    gap: moderateScale(12),
    marginTop: moderateScale(15),
  },
  bookButton: {
    flex: 1,
    backgroundColor: '#1C86FF',
    paddingVertical: moderateScale(15),
    borderRadius: moderateScale(25),
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
  chatButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1C86FF',
    paddingVertical: moderateScale(13),
    borderRadius: moderateScale(25),
    alignItems: 'center',
  },
  chatButtonText: {
    color: '#1C86FF',
    fontSize: scaleFontSize(16),
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
  // Transportation styles
  transportationRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
    marginBottom: moderateScale(8),
  },
  transportationCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(6),
    borderRadius: moderateScale(8),
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#B3D9FF',
  },
  transportationCardSelected: {
    backgroundColor: '#1C86FF',
    borderColor: '#1C86FF',
    borderWidth: 2,
  },
  transportationLabel: {
    fontSize: scaleFontSize(10),
    color: '#1C86FF',
    marginTop: moderateScale(6),
    textAlign: 'center',
    fontWeight: '600',
  },
  transportationLabelSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: moderateScale(8),
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#B3D9FF',
  },
  addressInput: {
    flex: 1,
    marginLeft: moderateScale(8),
    fontSize: scaleFontSize(14),
    color: '#333',
    minHeight: moderateScale(45),
    textAlignVertical: 'top',
  },
  // Payment card styles
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(10),
    borderRadius: moderateScale(8),
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#B3D9FF',
    marginBottom: moderateScale(8),
  },
  paymentCardSelected: {
    backgroundColor: '#1C86FF',
    borderColor: '#1C86FF',
  },
  cardDetails: {
    flex: 1,
    marginLeft: moderateScale(12),
  },
  paymentCardName: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#1C86FF',
  },
  paymentCardNameSelected: {
    color: '#fff',
  },
  paymentCardNumber: {
    fontSize: scaleFontSize(12),
    color: '#666',
    marginTop: moderateScale(2),
  },
  paymentCardNumberSelected: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
});
