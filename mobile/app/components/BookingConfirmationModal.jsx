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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { wp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from '../config/api';

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

  const [selectedPet, setSelectedPet] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

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
    // If service has an imageUrl (from API), use it
    if (bookingData?.service?.imageUrl) {
      return { uri: bookingData.service.imageUrl };
    }
    // Otherwise, try to get from hardcoded images based on name
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
    if (!selectedPet) {
      alert('Please select a pet');
      return;
    }

    const data = {
      service: bookingData?.service,
      pet: pets.find(p => p._id === selectedPet),
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
              <Image source={getServiceImageSource()} style={styles.serviceImage} />
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{bookingData?.service?.name}</Text>
                <Text style={styles.serviceCategory}>
                  {bookingData?.service?.category || bookingData?.service?.type}
                </Text>
                <View style={styles.starsContainer}>
                  {renderStars(bookingData?.service?.rating)}
                </View>
                {bookingData?.service?.price && (
                  <Text style={styles.servicePriceText}>
                    ₱{typeof bookingData.service.price === 'object'
                      ? bookingData.service.price.amount
                      : bookingData.service.price}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Pet Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Select Pet *</Text>
              {loadingPets ? (
                <View style={styles.loadingContainer}>
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
                        label={`${pet.name} (${pet.species} - ${pet.breed})`}
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

            {/* Payment Method - Coming Soon */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Payment Method</Text>
              <View style={styles.comingSoonContainer}>
                <Ionicons name="card-outline" size={moderateScale(48)} color="#B3D9FF" />
                <Text style={styles.comingSoonTitle}>Payment Integration</Text>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
                <Text style={styles.comingSoonSubtext}>
                  Multiple payment options will be available in the next update
                </Text>
              </View>
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

            {/* Book Button */}
            <TouchableOpacity
              style={styles.bookButton}
              onPress={handleConfirm}
            >
              <Text style={styles.bookButtonText}>Book Service</Text>
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
    alignItems: 'center',
  },
  loadingText: {
    fontSize: scaleFontSize(14),
    color: '#1C86FF',
    fontWeight: '600',
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
  comingSoonContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: moderateScale(12),
    padding: moderateScale(24),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B3D9FF',
  },
  comingSoonTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: '700',
    color: '#1C86FF',
    marginTop: moderateScale(12),
  },
  comingSoonText: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#FF9B79',
    marginTop: moderateScale(4),
  },
  comingSoonSubtext: {
    fontSize: scaleFontSize(12),
    color: '#666',
    marginTop: moderateScale(8),
    textAlign: 'center',
  },
});
