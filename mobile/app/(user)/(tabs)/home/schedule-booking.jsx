import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  TextInput,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Header from '@components/Header';
import BookingConfirmationModal from './booking-confirmation-modal';
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';

export default function ScheduleBookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Get service data from route params
  const serviceData = {
    id: params.id,
    name: params.name,
    type: params.type,
    rating: params.rating,
    address: params.address,
    distance: params.distance,
  };

  // Mock pets data
  const pets = [
    { id: '1', name: 'Max', type: 'Dog', breed: 'Golden Retriever' },
    { id: '2', name: 'Luna', type: 'Cat', breed: 'Persian' },
    { id: '3', name: 'Charlie', type: 'Dog', breed: 'Beagle' },
  ];

  // Mock payment options (cards only)
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
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [newCard, setNewCard] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
  });

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

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleChat = () => {
    router.push({
      pathname: `/(user)/(tabs)/messages/${serviceData.id}`,
      params: {
        serviceName: serviceData.name,
        fromService: 'true',
      }
    });
  };

  const handleAddCard = () => {
    if (!newCard.cardNumber || !newCard.cardHolder || !newCard.expiryDate || !newCard.cvv) {
      alert('Please fill all card details');
      return;
    }

    const cardType = newCard.cardNumber.startsWith('4') ? 'visa' : 'mastercard';
    const lastFourDigits = newCard.cardNumber.slice(-4);

    const card = {
      id: String(paymentOptions.length + 1),
      name: cardType.charAt(0).toUpperCase() + cardType.slice(1),
      cardNumber: `**** **** **** ${lastFourDigits}`,
      type: cardType,
    };

    setPaymentOptions([...paymentOptions, card]);
    setSelectedPayment(card.id);
    setNewCard({ cardNumber: '', cardHolder: '', expiryDate: '', cvv: '' });
    setShowAddCardModal(false);
  };

  const handleBook = () => {
    if (!selectedPet || !selectedTransportation || !selectedPayment) {
      alert('Please fill all required fields');
      return;
    }

    if (selectedTransportation === '2' && !pickupAddress) {
      alert('Please enter pickup address for PetTapp Rider');
      return;
    }

    const data = {
      service: serviceData,
      pet: pets.find(p => p.id === selectedPet),
      transportation: transportationOptions.find(t => t.id === selectedTransportation),
      payment: paymentOptions.find(p => p.id === selectedPayment),
      pickupAddress: selectedTransportation === '2' ? pickupAddress : null,
      date: formatDate(selectedDate),
      time: formatTime(selectedTime),
    };

    setBookingData(data);
    setShowConfirmationModal(true);
  };

  const handleFinalConfirm = () => {
    setShowConfirmationModal(false);
    // Navigate to success page
    router.push({
      pathname: 'home/service-scheduled',
      params: {
        serviceName: serviceData.name,
        date: bookingData.date,
        time: bookingData.time,
        petName: bookingData.pet?.name,
      },
    });
  };

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText} numberOfLines={1}>
        Schedule Booking
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header
        backgroundColor="#1C86FF"
        titleColor="#fff"
        customTitle={renderTitle()}
        showBack={true}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Service Type */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Service Type</Text>
          <View style={styles.serviceTypeCard}>
            <Text style={styles.serviceTypeName}>{serviceData?.name}</Text>
            <Text style={styles.serviceTypeCategory}>{serviceData?.type}</Text>
          </View>
        </View>

        {/* Select Pet */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Select Pet *</Text>
          <View style={styles.dropdownContainer}>
            <View style={styles.dropdownIconWrapper}>
              <Ionicons name="paw" size={moderateScale(20)} color="#1C86FF" />
            </View>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedPet}
                onValueChange={(itemValue) => setSelectedPet(itemValue)}
                style={styles.picker}
                dropdownIconColor="#1C86FF"
              >
                <Picker.Item label="Choose your pet" value="" color="#999" />
                {pets.map((pet) => (
                  <Picker.Item
                    key={pet.id}
                    label={`${pet.name} (${pet.type} - ${pet.breed})`}
                    value={pet.id}
                    color="#333"
                  />
                ))}
              </Picker>
            </View>
          </View>
          {selectedPet && (
            <View style={styles.selectedPetBadge}>
              <Ionicons name="checkmark-circle" size={moderateScale(16)} color="#4CAF50" />
              <Text style={styles.selectedPetText}>
                {pets.find(p => p.id === selectedPet)?.name} selected
              </Text>
            </View>
          )}
        </View>

        {/* Transportation */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Transportation *</Text>
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
                  size={moderateScale(28)}
                  color={selectedTransportation === option.id ? '#1C86FF' : '#666'}
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

          {/* PetTapp Rider Address Input */}
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
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Payment Method *</Text>
            <TouchableOpacity
              style={styles.addCardButton}
              onPress={() => setShowAddCardModal(true)}
            >
              <Ionicons name="add-circle-outline" size={moderateScale(20)} color="#1C86FF" />
              <Text style={styles.addCardText}>Add Card</Text>
            </TouchableOpacity>
          </View>
          {paymentOptions.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.cardOption,
                selectedPayment === card.id && styles.cardOptionSelected
              ]}
              onPress={() => setSelectedPayment(card.id)}
            >
              <View style={styles.cardContent}>
                <Ionicons
                  name="card"
                  size={moderateScale(32)}
                  color={selectedPayment === card.id ? '#1C86FF' : '#666'}
                />
                <View style={styles.cardDetails}>
                  <Text style={[
                    styles.cardName,
                    selectedPayment === card.id && styles.cardNameSelected
                  ]}>
                    {card.name}
                  </Text>
                  <Text style={styles.cardNumber}>{card.cardNumber}</Text>
                </View>
              </View>
              {selectedPayment === card.id && (
                <Ionicons name="checkmark-circle" size={moderateScale(24)} color="#1C86FF" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Date & Time</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={styles.dateTimeButtonHalf}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={moderateScale(20)} color="#1C86FF" />
              <Text style={styles.dateTimeText}>{formatDate(selectedDate)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateTimeButtonHalf}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={moderateScale(20)} color="#1C86FF" />
              <Text style={styles.dateTimeText}>{formatTime(selectedTime)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: hp(12) }} />
      </ScrollView>

      {/* Action Buttons - Fixed at bottom */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.chatButton} onPress={handleChat}>
          <Ionicons name="chatbubble-outline" size={moderateScale(20)} color="#1C86FF" />
          <Text style={styles.chatButtonText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bookButton} onPress={handleBook}>
          <Ionicons name="calendar-outline" size={moderateScale(20)} color="#fff" />
          <Text style={styles.bookButtonText}>Book</Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}

      {/* Booking Confirmation Modal */}
      <BookingConfirmationModal
        visible={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onConfirm={handleFinalConfirm}
        bookingData={bookingData}
      />

      {/* Add Card Modal */}
      <Modal
        visible={showAddCardModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddCardModal(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.addCardContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Add New Card</Text>
              <TouchableOpacity onPress={() => setShowAddCardModal(false)} style={styles.closeButton}>
                <Ionicons name="close" size={moderateScale(28)} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.addCardForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Card Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor="#999"
                  value={newCard.cardNumber}
                  onChangeText={(text) => setNewCard({ ...newCard, cardNumber: text })}
                  keyboardType="numeric"
                  maxLength={16}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Card Holder Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#999"
                  value={newCard.cardHolder}
                  onChangeText={(text) => setNewCard({ ...newCard, cardHolder: text })}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: moderateScale(8) }]}>
                  <Text style={styles.inputLabel}>Expiry Date</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    placeholderTextColor="#999"
                    value={newCard.expiryDate}
                    onChangeText={(text) => setNewCard({ ...newCard, expiryDate: text })}
                    maxLength={5}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: moderateScale(8) }]}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    placeholderTextColor="#999"
                    value={newCard.cvv}
                    onChangeText={(text) => setNewCard({ ...newCard, cvv: text })}
                    keyboardType="numeric"
                    maxLength={3}
                    secureTextEntry
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.addCardSubmitButton} onPress={handleAddCard}>
                <Text style={styles.addCardSubmitText}>Add Card</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  content: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
  },
  section: {
    marginTop: moderateScale(20),
  },
  sectionLabel: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(12),
  },
  serviceTypeCard: {
    backgroundColor: '#E3F2FD',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#1C86FF',
  },
  serviceTypeName: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(4),
  },
  serviceTypeCategory: {
    fontSize: scaleFontSize(14),
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(16),
    gap: moderateScale(12),
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1.8),
    borderRadius: moderateScale(12),
    borderWidth: 2,
    borderColor: '#1C86FF',
    backgroundColor: '#fff',
  },
  chatButtonText: {
    color: '#1C86FF',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    marginLeft: moderateScale(6),
  },
  bookButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1.8),
    borderRadius: moderateScale(12),
    backgroundColor: '#1C86FF',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    marginLeft: moderateScale(6),
  },
  // Dropdown styles
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: moderateScale(12),
    backgroundColor: '#fff',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownIconWrapper: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  pickerWrapper: {
    flex: 1,
  },
  picker: {
    flex: 1,
    height: moderateScale(50),
    color: '#333',
  },
  selectedPetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(8),
    marginTop: moderateScale(8),
    gap: moderateScale(6),
  },
  selectedPetText: {
    fontSize: scaleFontSize(13),
    color: '#4CAF50',
    fontWeight: '600',
  },
  // Transportation row styles
  transportationRow: {
    flexDirection: 'row',
    gap: moderateScale(10),
  },
  transportationCard: {
    flex: 1,
    alignItems: 'center',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  transportationCardSelected: {
    borderColor: '#1C86FF',
    backgroundColor: '#F0F8FF',
  },
  transportationLabel: {
    fontSize: scaleFontSize(12),
    color: '#666',
    marginTop: moderateScale(8),
    textAlign: 'center',
  },
  transportationLabelSelected: {
    color: '#1C86FF',
    fontWeight: '600',
  },
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: moderateScale(12),
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#1C86FF',
    backgroundColor: '#F0F8FF',
  },
  addressInput: {
    flex: 1,
    marginLeft: moderateScale(8),
    fontSize: scaleFontSize(14),
    color: '#333',
    minHeight: moderateScale(40),
  },
  // Payment styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
  },
  addCardText: {
    fontSize: scaleFontSize(14),
    color: '#1C86FF',
    fontWeight: '600',
  },
  cardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    marginBottom: moderateScale(10),
  },
  cardOptionSelected: {
    borderColor: '#1C86FF',
    backgroundColor: '#F0F8FF',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardDetails: {
    marginLeft: moderateScale(12),
    flex: 1,
  },
  cardName: {
    fontSize: scaleFontSize(16),
    fontWeight: '500',
    color: '#333',
  },
  cardNameSelected: {
    color: '#1C86FF',
    fontWeight: '600',
  },
  cardNumber: {
    fontSize: scaleFontSize(13),
    color: '#666',
    marginTop: moderateScale(2),
  },
  // Date/Time row
  dateTimeRow: {
    flexDirection: 'row',
    gap: moderateScale(10),
  },
  dateTimeButtonHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: moderateScale(14),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  dateTimeText: {
    fontSize: scaleFontSize(16),
    color: '#333',
    marginLeft: moderateScale(12),
    fontWeight: '500',
  },
  // Add Card Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCardContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(20),
    width: wp(85),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalHeaderTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#1C86FF',
  },
  closeButton: {
    padding: moderateScale(4),
  },
  addCardForm: {
    padding: moderateScale(20),
  },
  inputGroup: {
    marginBottom: moderateScale(16),
  },
  inputLabel: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(8),
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: moderateScale(12),
    padding: moderateScale(14),
    fontSize: scaleFontSize(14),
    color: '#333',
    backgroundColor: '#fff',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: moderateScale(20),
  },
  addCardSubmitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: hp(1.8),
    borderRadius: moderateScale(12),
    alignItems: 'center',
  },
  addCardSubmitText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
});
