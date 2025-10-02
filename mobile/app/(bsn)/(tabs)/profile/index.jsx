import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';

export default function BusinessProfileScreen() {
  const router = useRouter();
  const [operatingHoursModal, setOperatingHoursModal] = useState(false);
  const [operatingHours, setOperatingHours] = useState({
    monday: { open: true, start: '8:00 AM', end: '6:00 PM' },
    tuesday: { open: true, start: '8:00 AM', end: '6:00 PM' },
    wednesday: { open: true, start: '8:00 AM', end: '6:00 PM' },
    thursday: { open: true, start: '8:00 AM', end: '6:00 PM' },
    friday: { open: true, start: '8:00 AM', end: '6:00 PM' },
    saturday: { open: true, start: '8:00 AM', end: '6:00 PM' },
    sunday: { open: false, start: '8:00 AM', end: '6:00 PM' },
  });
  const [openForHolidays, setOpenForHolidays] = useState(false);
  const businessInfo = {
    name: 'Pawsome Pet Care',
    type: 'Veterinary Services',
    phone: '+63 917 555 1234',
    email: 'contact@pawsomepetcare.com',
    address: '456 Pet Avenue, Quezon City, Metro Manila',
    hours: 'Mon-Sat: 8:00 AM - 6:00 PM',
    rating: 4.9,
    totalReviews: 128,
    verified: true,
  };

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText}>Business Profile</Text>
    </View>
  );

  const settingsOptions = [
    {
      id: '1',
      title: 'Business Information',
      icon: 'business',
      color: '#1C86FF',
      route: '/(bsn)/(tabs)/profile/business-info',
    },
    {
      id: '2',
      title: 'Operating Hours',
      icon: 'time',
      color: '#4CAF50',
      action: 'modal',
    },
    {
      id: '3',
      title: 'Revenue',
      icon: 'cash',
      color: '#2196F3',
      route: '/(bsn)/(tabs)/profile/revenue',
    },
    {
      id: '4',
      title: 'Payment Settings',
      icon: 'card',
      color: '#FF9B79',
      route: '/(bsn)/(tabs)/profile/payment-settings',
    },
    {
      id: '5',
      title: 'Notifications',
      icon: 'notifications',
      color: '#9C27B0',
      route: '/(bsn)/(tabs)/profile/notifications',
    },
    {
      id: '6',
      title: 'Reviews & Ratings',
      icon: 'star',
      color: '#FFD700',
      route: '/(bsn)/(tabs)/rating-review',
    },
  ];

  const toggleDayOpen = (day) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], open: !prev[day].open }
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("@assets/images/PetTapp pattern.png")}
        style={styles.backgroundimg}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="repeat"
      />
      <Header
        backgroundColor="#1C86FF"
        titleColor="#fff"
        customTitle={renderTitle()}
        showBack={false}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Business Card */}
        <View style={styles.businessCard}>
          <View style={styles.businessIconContainer}>
            <Ionicons name="storefront" size={moderateScale(50)} color="#1C86FF" />
            {businessInfo.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#4CAF50" />
              </View>
            )}
          </View>

          <Text style={styles.businessName}>{businessInfo.name}</Text>
          <Text style={styles.businessType}>{businessInfo.type}</Text>

          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={moderateScale(18)} color="#FFD700" />
            <Text style={styles.ratingText}>
              {businessInfo.rating} ({businessInfo.totalReviews} reviews)
            </Text>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.infoRow}>
            <Ionicons name="call" size={moderateScale(20)} color="#1C86FF" />
            <Text style={styles.infoText}>{businessInfo.phone}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="mail" size={moderateScale(20)} color="#1C86FF" />
            <Text style={styles.infoText}>{businessInfo.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location" size={moderateScale(20)} color="#1C86FF" />
            <Text style={styles.infoText}>{businessInfo.address}</Text>
          </View>
        </View>

        {/* Settings Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          {settingsOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.settingCard}
              onPress={() => {
                if (option.action === 'modal') {
                  setOperatingHoursModal(true);
                } else if (option.route) {
                  router.push(option.route);
                }
              }}
            >
              <View style={[styles.settingIconContainer, { backgroundColor: option.color }]}>
                <Ionicons name={option.icon} size={moderateScale(22)} color="#fff" />
              </View>
              <Text style={styles.settingTitle}>{option.title}</Text>
              <Ionicons name="chevron-forward" size={moderateScale(20)} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            Alert.alert(
              'Logout',
              'Are you sure you want to logout?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Logout',
                  style: 'destructive',
                  onPress: () => router.replace('/(auth)/login'),
                },
              ]
            );
          }}
        >
          <Ionicons name="log-out-outline" size={moderateScale(22)} color="#FF6B6B" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Operating Hours Modal */}
      <Modal
        visible={operatingHoursModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOperatingHoursModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Operating Hours</Text>
              <TouchableOpacity onPress={() => setOperatingHoursModal(false)}>
                <Ionicons name="close" size={moderateScale(28)} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {Object.keys(operatingHours).map((day) => (
                <View key={day} style={styles.dayRow}>
                  <View style={styles.dayInfo}>
                    <Text style={styles.dayName}>
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </Text>
                    {operatingHours[day].open && (
                      <Text style={styles.dayTime}>
                        {operatingHours[day].start} - {operatingHours[day].end}
                      </Text>
                    )}
                    {!operatingHours[day].open && (
                      <Text style={styles.dayClosed}>Closed</Text>
                    )}
                  </View>
                  <Switch
                    value={operatingHours[day].open}
                    onValueChange={() => toggleDayOpen(day)}
                    trackColor={{ false: '#ccc', true: '#1C86FF' }}
                    thumbColor="#fff"
                  />
                </View>
              ))}

              <View style={styles.holidayRow}>
                <View style={styles.holidayInfo}>
                  <Ionicons name="calendar" size={moderateScale(24)} color="#1C86FF" />
                  <Text style={styles.holidayText}>Open for Holidays</Text>
                </View>
                <Switch
                  value={openForHolidays}
                  onValueChange={setOpenForHolidays}
                  trackColor={{ false: '#ccc', true: '#1C86FF' }}
                  thumbColor="#fff"
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => {
                setOperatingHoursModal(false);
                Alert.alert('Success', 'Operating hours updated successfully!');
              }}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  backgroundimg: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.5 }],
  },
  backgroundImageStyle: {
    opacity: 0.1,
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
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(20),
    paddingBottom: moderateScale(100),
  },
  businessCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(25),
    alignItems: 'center',
    marginBottom: moderateScale(20),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  businessIconContainer: {
    position: 'relative',
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(15),
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(2),
  },
  businessName: {
    fontSize: scaleFontSize(24),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(4),
    textAlign: 'center',
  },
  businessType: {
    fontSize: scaleFontSize(14),
    color: '#666',
    marginBottom: moderateScale(12),
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  ratingText: {
    fontSize: scaleFontSize(14),
    color: '#333',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    marginBottom: moderateScale(15),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(15),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(10),
    gap: moderateScale(12),
  },
  infoText: {
    fontSize: scaleFontSize(14),
    color: '#333',
    flex: 1,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingIconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  settingTitle: {
    flex: 1,
    fontSize: scaleFontSize(15),
    color: '#333',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    paddingVertical: hp(1.8),
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    borderWidth: 2,
    borderColor: '#FF6B6B',
    marginTop: moderateScale(10),
  },
  logoutText: {
    color: '#FF6B6B',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    maxHeight: '80%',
    paddingBottom: moderateScale(20),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(20),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#1C86FF',
  },
  modalBody: {
    padding: moderateScale(20),
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(4),
  },
  dayTime: {
    fontSize: scaleFontSize(13),
    color: '#666',
  },
  dayClosed: {
    fontSize: scaleFontSize(13),
    color: '#999',
    fontStyle: 'italic',
  },
  holidayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(20),
    marginTop: moderateScale(10),
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(15),
  },
  holidayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  holidayText: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#1C86FF',
    marginHorizontal: moderateScale(20),
    marginTop: moderateScale(10),
    paddingVertical: moderateScale(15),
    borderRadius: moderateScale(12),
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
});
