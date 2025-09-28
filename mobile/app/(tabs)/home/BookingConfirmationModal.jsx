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
  ScrollView,
} from 'react-native';

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
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Time picker state
  const [selectedHour, setSelectedHour] = useState(null);
  const [selectedMinute, setSelectedMinute] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('AM');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const hours = Array.from({length: 12}, (_, i) => i + 1);
  const minutes = ['00', '15', '30', '45'];

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
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Text key={i} style={styles.fullStar}>★</Text>
        );
      } else {
        stars.push(
          <Text key={i} style={styles.emptyStar}>☆</Text>
        );
      }
    }
    return stars;
  };

  const formatDate = (date) => {
    if (!date) return 'Select date';
    const options = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = () => {
    if (!selectedHour || selectedMinute === null) return 'Select time';
    return `${selectedHour}:${selectedMinute} ${selectedPeriod}`;
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];
    
    // Empty cells for days before first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.emptyDay} />);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isToday = new Date().toDateString() === date.toDateString();
      const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();
      const isPastDate = date < new Date().setHours(0, 0, 0, 0);
      
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayButton,
            isToday && styles.todayButton,
            isSelected && styles.selectedDayButton,
            isPastDate && styles.pastDayButton
          ]}
          onPress={() => !isPastDate && selectDate(date)}
          disabled={isPastDate}
        >
          <Text style={[
            styles.dayText,
            isToday && styles.todayText,
            isSelected && styles.selectedDayText,
            isPastDate && styles.pastDayText
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }
    
    return days;
  };

  const selectDate = (date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  };

  const selectTime = () => {
    if (selectedHour && selectedMinute !== null) {
      setSelectedTime(formatTime());
      setShowTimePicker(false);
    }
  };

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      onConfirm({ 
        date: formatDate(selectedDate), 
        time: selectedTime 
      });
    } else {
      alert('Please select both date and time');
    }
  };

  const changeMonth = (direction) => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
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
          <View style={styles.handleBar} />
          
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
                {formatTime()}
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

      {/* Calendar Date Picker */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.calendarContainer}>
            <Text style={styles.pickerTitle}>Select Date</Text>
            
            {/* Month/Year Header */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => changeMonth('prev')}>
                <Text style={styles.navButton}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthYearText}>
                {months[currentMonth]} {currentYear}
              </Text>
              <TouchableOpacity onPress={() => changeMonth('next')}>
                <Text style={styles.navButton}>›</Text>
              </TouchableOpacity>
            </View>
            
            {/* Days of Week Header */}
            <View style={styles.daysOfWeekContainer}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Text key={day} style={styles.dayOfWeekText}>{day}</Text>
              ))}
            </View>
            
            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {renderCalendar()}
            </View>
            
            <TouchableOpacity
              style={styles.pickerCloseButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.pickerCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Time Picker */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.timePickerContainer}>
            <Text style={styles.pickerTitle}>Select Time</Text>
            
            <View style={styles.timePickerContent}>
              {/* Hours */}
              <View style={styles.timeColumn}>
                <Text style={styles.timeColumnLabel}>Hour</Text>
                <ScrollView style={styles.timeScrollView}>
                  {hours.map(hour => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.timeOption,
                        selectedHour === hour && styles.selectedTimeOption
                      ]}
                      onPress={() => setSelectedHour(hour)}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        selectedHour === hour && styles.selectedTimeText
                      ]}>
                        {hour}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Minutes */}
              <View style={styles.timeColumn}>
                <Text style={styles.timeColumnLabel}>Min</Text>
                <ScrollView style={styles.timeScrollView}>
                  {minutes.map(minute => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.timeOption,
                        selectedMinute === minute && styles.selectedTimeOption
                      ]}
                      onPress={() => setSelectedMinute(minute)}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        selectedMinute === minute && styles.selectedTimeText
                      ]}>
                        {minute}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* AM/PM */}
              <View style={styles.timeColumn}>
                <Text style={styles.timeColumnLabel}>Period</Text>
                <View style={styles.periodContainer}>
                  <TouchableOpacity
                    style={[
                      styles.periodOption,
                      selectedPeriod === 'AM' && styles.selectedTimeOption
                    ]}
                    onPress={() => setSelectedPeriod('AM')}
                  >
                    <Text style={[
                      styles.timeOptionText,
                      selectedPeriod === 'AM' && styles.selectedTimeText
                    ]}>
                      AM
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.periodOption,
                      selectedPeriod === 'PM' && styles.selectedTimeOption
                    ]}
                    onPress={() => setSelectedPeriod('PM')}
                  >
                    <Text style={[
                      styles.timeOptionText,
                      selectedPeriod === 'PM' && styles.selectedTimeText
                    ]}>
                      PM
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <View style={styles.timePickerButtons}>
              <TouchableOpacity
                style={styles.timeConfirmButton}
                onPress={selectTime}
              >
                <Text style={styles.timeConfirmText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pickerCloseButton}
                onPress={() => setShowTimePicker(false)}
              >
                <Text style={styles.pickerCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
    minHeight: 450,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 15,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#1C86FF',
  },
  serviceImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  serviceInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: 4,
  },
  serviceCategory: {
    fontSize: 12,
    color: '#FF9B79',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 1,
  },
  fullStar: {
    color: '#FFD700',
    fontSize: 12,
  },
  emptyStar: {
    color: '#E0E0E0',
    fontSize: 12,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputField: {
    backgroundColor: '#1C86FF',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  calendarIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarIconText: {
    fontSize: 18,
    color: '#fff',
  },
  dropdownIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownIconText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 20,
  },
  bookButton: {
    flex: 1,
    backgroundColor: '#1C86FF',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1C86FF',
    paddingVertical: 13,
    borderRadius: 25,
    alignItems: 'center',
  },
  chatButtonText: {
    color: '#1C86FF',
    fontSize: 16,
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
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C86FF',
    textAlign: 'center',
    marginBottom: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    fontSize: 24,
    color: '#1C86FF',
    fontWeight: 'bold',
    paddingHorizontal: 15,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  daysOfWeekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  dayOfWeekText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    width: 40,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  emptyDay: {
    width: 40,
    height: 40,
  },
  dayButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginBottom: 5,
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
    fontSize: 16,
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
    borderRadius: 15,
    padding: 20,
    width: '85%',
    maxHeight: '70%',
  },
  timePickerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 200,
  },
  timeColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timeColumnLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: 10,
  },
  timeScrollView: {
    maxHeight: 150,
  },
  timeOption: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginVertical: 2,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    minWidth: 60,
    alignItems: 'center',
  },
  selectedTimeOption: {
    backgroundColor: '#1C86FF',
  },
  timeOptionText: {
    fontSize: 16,
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
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginVertical: 5,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    minWidth: 60,
    alignItems: 'center',
  },
  timePickerButtons: {
    marginTop: 20,
  },
  timeConfirmButton: {
    backgroundColor: '#1C86FF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  timeConfirmText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  pickerCloseButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  pickerCloseText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
});