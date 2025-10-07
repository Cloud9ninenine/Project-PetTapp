import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  useWindowDimensions,
  Alert,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import Header from "@components/Header";
import CompleteProfileModal from "@components/CompleteProfileModal";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from "../../../config/api";

const Bookings = () => {
  const [searchText, setSearchText] = useState('');
  const router = useRouter();

  const [showProfileIncompleteModal, setShowProfileIncompleteModal] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(true);

  const [schedules] = useState([
    {
      id: '109-177-748',
      title: 'Veterinary Appointment',
      businessName: 'PetCo Animal Clinic',
      businessType: 'Veterinary Service',
      date: '10-08-2025',
      time: '1:00 PM',
      icon: 'medical-outline',
      status: 'Scheduled'
    },
    {
      id: '356-455-349',
      title: 'Pet Grooming',
      businessName: 'Paws & Claws Grooming',
      businessType: 'Pet Grooming',
      date: '10-02-2025',
      time: '8:00 AM',
      icon: 'cut-outline',
      status: 'Cancelled'
    },
    {
      id: '497-370-547',
      title: 'Pet Boarding',
      businessName: 'Happy Tails Pet Hotel',
      businessType: 'Pet Boarding',
      date: '09-30-2025',
      time: '6:00 PM',
      icon: 'home-outline',
      status: 'Completed'
    },
    {
      id: '266-139-886',
      title: 'Vaccination',
      businessName: 'Animed Veterinary Clinic',
      businessType: 'Veterinary Service',
      date: '10-03-2025',
      time: '8:00 AM',
      icon: 'medical-outline',
      status: 'Scheduled'
    },
    {
      id: '976-630-165',
      title: 'Pet Training',
      businessName: 'Bark & Train Academy',
      businessType: 'Pet Training',
      date: '10-06-2025',
      time: '10:00 AM',
      icon: 'school-outline',
      status: 'Completed'
    }
  ]);

  // Check profile completeness on mount
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const meResponse = await apiClient.get('/auth/me');

        if (meResponse.status === 200) {
          const userData = meResponse.data.user;

          // Check if profile is incomplete
          const isIncomplete = (
            !userData.lastName ||
            !userData.firstName ||
            !userData.phoneNumber
          );

          setIsProfileComplete(!isIncomplete);

          if (isIncomplete) {
            setShowProfileIncompleteModal(true);
          }
        }
      } catch (error) {
        console.error('Error checking profile:', error);
      }
    };

    checkProfile();
  }, []);

  const filteredSchedules = schedules.filter(schedule =>
    schedule.title.toLowerCase().includes(searchText.toLowerCase())
  );

  

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return '#28a745'; // green
      case 'cancelled':
        return '#dc3545'; // red
      case 'completed':
        return '#007bff'; // blue
      default:
        return '#6c757d';
    }
  };

  const renderScheduleItem = ({ item }) => (
    <TouchableOpacity
      style={styles.scheduleItem}
      onPress={() => router.push({ pathname: "../booking/ScheduleDetail", params: { ...item } })}
    >
      {/* Icon inside circle */}
      <View style={styles.circlePlaceholder}>
        <Ionicons name={item.icon} size={hp(4)} color="#1C86FF" />
      </View>

      {/* Details */}
      <View style={styles.scheduleDetails}>
        <Text style={styles.scheduleTitle}>{item.title}</Text>
        <Text style={styles.businessName}>{item.businessName}</Text>
        <Text style={styles.scheduleDateTime}>{item.date} | {item.time}</Text>
      </View>

      {/* Status */}
      <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
        {item.status}
      </Text>
    </TouchableOpacity>
  );

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText} numberOfLines={1}>
        My Schedules
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("@assets/images/PetTapp pattern.png")}
        style={styles.backgroundimg}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="repeat"
      />
      {/* Header */}
      <Header
        backgroundColor="#1C86FF"
        titleColor="#fff"
        customTitle={renderTitle()}
        showBack={false}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={moderateScale(20)} color="#C7C7CC" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#C7C7CC"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* List */}
      <FlatList
        data={filteredSchedules}
        renderItem={renderScheduleItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      {/* Profile Incomplete Modal */}
      <CompleteProfileModal
        visible={showProfileIncompleteModal}
        onClose={() => setShowProfileIncompleteModal(false)}
        message="Please complete your profile information before accessing bookings. You need to provide your first name, last name, address, and contact number."
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  backgroundimg: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.5 }],
  },

  backgroundImageStyle: { opacity: 0.1 },
  titleContainer: {
    flex: 1,
  },
  titleText: {
    color: '#fff',
    fontSize: scaleFontSize(24),
    fontFamily: 'SFProBold',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp(4),
    marginVertical: moderateScale(15),
    paddingHorizontal: moderateScale(15),
    borderRadius: moderateScale(10),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1C86FF',
    height: hp(6),
  },
  searchIcon: {
    marginRight: moderateScale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: scaleFontSize(16),
    paddingVertical: moderateScale(10),
    color: '#333',
  },
  listContent: {
    paddingHorizontal: wp(4),
    paddingBottom: moderateScale(20),
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(10),
    padding: moderateScale(15),
    marginBottom: moderateScale(12),
    borderWidth: 1,
    borderColor: '#1C86FF',
    minHeight: hp(12),
  },
  circlePlaceholder: {
    width: hp(9),
    height: hp(9),
    borderRadius: hp(4.5),
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(15),
  },
  scheduleDetails: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: moderateScale(2),
  },
  businessName: {
    fontSize: scaleFontSize(13),
    color: '#1C86FF',
    marginBottom: moderateScale(4),
  },
  scheduleDateTime: {
    fontSize: scaleFontSize(12),
    color: '#777777',
  },
  statusText: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
  },
  
});

export default Bookings;
