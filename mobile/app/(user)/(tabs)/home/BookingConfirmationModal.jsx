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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { wp, moderateScale, scaleFontSize } from '@utils/responsive';

const { height: screenHeight } = Dimensions.get('window');

export default function BookingConfirmationModal({
  visible,
  onClose,
  onConfirm,
  serviceName,
  serviceCategory,
  servicePrice
}) {
  const [slideAnim] = useState(new Animated.Value(screenHeight));
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
    onConfirm({
      date: formatDate(selectedDate),
      time: formatTime(selectedTime)
    });
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
          <View style={styles.handleBar} />

          <Text style={styles.modalTitle}>Book Confirmation</Text>
          <Text style={styles.modalSubtitle}>
            This service will be booked to {'\n'}the selected schedule.
          </Text>

          <View style={styles.serviceCard}>
            <Image source={getServiceImage()} style={styles.serviceImage} />
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{serviceName}</Text>
              <Text style={styles.serviceCategory}>{serviceCategory}</Text>
              <Text style={styles.servicePrice}>{servicePrice}</Text>
              <View style={styles.starsContainer}>
                {renderStars()}
              </View>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Date</Text>
            <TouchableOpacity style={styles.inputField} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.inputText}>
                {formatDate(selectedDate)}
              </Text>
              <View style={styles.calendarIcon}>
                <Text style={styles.calendarIconText}>📅</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Time</Text>
            <TouchableOpacity style={styles.inputField} onPress={() => setShowTimePicker(true)}>
              <Text style={styles.inputText}>
                {formatTime(selectedTime)}
              </Text>
              <View style={styles.dropdownIcon}>
                <Text style={styles.dropdownIconText}>⌄</Text>
              </View>
            </TouchableOpacity>
          </View>

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
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(40),
    paddingTop: moderateScale(10),
    minHeight: moderateScale(450),
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
    padding: moderateScale(15),
    marginBottom: moderateScale(30),
    borderWidth: 1,
    borderColor: '#1C86FF',
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
    marginBottom: moderateScale(4),
  },
  servicePrice: {
    fontSize: scaleFontSize(12),
    color: '#666',
    marginBottom: moderateScale(6),
  },
  starsContainer: {
    flexDirection: 'row',
    gap: moderateScale(1),
  },
  inputContainer: {
    marginBottom: moderateScale(20),
  },
  inputLabel: {
    fontSize: scaleFontSize(16),
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
    gap: moderateScale(15),
    marginTop: moderateScale(20),
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
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(15),
    padding: moderateScale(20),
    width: '90%',
    maxHeight: '80%',
  },
  pickerTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#1C86FF',
    textAlign: 'center',
    marginBottom: moderateScale(20),
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(20),
  },
  navButton: {
    fontSize: scaleFontSize(24),
    color: '#1C86FF',
    fontWeight: 'bold',
    paddingHorizontal: moderateScale(15),
  },
  monthYearText: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#333',
  },
  daysOfWeekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: moderateScale(10),
  },
  dayOfWeekText: {
    fontSize: scaleFontSize(14),
    fontWeight: 'bold',
    color: '#666',
    width: moderateScale(40),
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  emptyDay: {
    width: moderateScale(40),
    height: moderateScale(40),
  },
  dayButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: moderateScale(20),
    marginBottom: moderateScale(5),
  },
  todayButton: {
    backgroundColor: '#E3F2FD',
  },
  selectedDayButton: {
    backgroundColor: '#1C86FF',
  },
  pastDayButton: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: scaleFontSize(16),
    color: '#333',
  },
  todayText: {
    color: '#1C86FF',
    fontWeight: 'bold',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pastDayText: {
    color: '#999',
  },
  timePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(15),
    padding: moderateScale(20),
    width: '85%',
    maxHeight: '70%',
  },
  timePickerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: moderateScale(200),
  },
  timeColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timeColumnLabel: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(10),
  },
  timeScrollView: {
    maxHeight: moderateScale(150),
  },
  timeOption: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(20),
    marginVertical: moderateScale(2),
    borderRadius: moderateScale(8),
    backgroundColor: '#f8f8f8',
    minWidth: moderateScale(60),
    alignItems: 'center',
  },
  selectedTimeOption: {
    backgroundColor: '#1C86FF',
  },
  timeOptionText: {
    fontSize: scaleFontSize(16),
    color: '#333',
    fontWeight: '600',
  },
  selectedTimeText: {
    color: '#fff',
  },
  periodContainer: {
    alignItems: 'center',
  },
  periodOption: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(20),
    marginVertical: moderateScale(5),
    borderRadius: moderateScale(8),
    backgroundColor: '#f8f8f8',
    minWidth: moderateScale(60),
    alignItems: 'center',
  },
  timePickerButtons: {
    marginTop: moderateScale(20),
  },
  timeConfirmButton: {
    backgroundColor: '#1C86FF',
    paddingVertical: moderateScale(15),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  timeConfirmText: {
    fontSize: scaleFontSize(16),
    color: '#fff',
    fontWeight: 'bold',
  },
  pickerCloseButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: moderateScale(15),
    borderRadius: moderateScale(10),
    alignItems: 'center',
  },
  pickerCloseText: {
    fontSize: scaleFontSize(16),
    color: '#666',
    fontWeight: '600',
  },
});