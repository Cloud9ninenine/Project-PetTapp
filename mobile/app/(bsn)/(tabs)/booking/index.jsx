import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';

const CustomerBookings = () => {
  const [searchText, setSearchText] = useState('');
  const router = useRouter();

  const [bookings] = useState([
    {
      id: '109-177-748',
      customerName: 'John Doe',
      petName: 'Max',
      petType: 'Dog',
      service: 'Veterinary Check-up',
      date: '10-08-2025',
      time: '1:00 PM',
      icon: 'medical-outline',
      status: 'Scheduled',
      phone: '+63 912 345 6789'
    },
    {
      id: '356-455-349',
      customerName: 'Jane Smith',
      petName: 'Luna',
      petType: 'Cat',
      service: 'Pet Grooming',
      date: '10-02-2025',
      time: '8:00 AM',
      icon: 'cut-outline',
      status: 'Cancelled',
      phone: '+63 923 456 7890'
    },
    {
      id: '497-370-547',
      customerName: 'Mike Johnson',
      petName: 'Buddy',
      petType: 'Dog',
      service: 'Pet Boarding',
      date: '09-30-2025',
      time: '6:00 PM',
      icon: 'home-outline',
      status: 'Completed',
      phone: '+63 934 567 8901'
    },
    {
      id: '266-139-886',
      customerName: 'Sarah Wilson',
      petName: 'Whiskers',
      petType: 'Cat',
      service: 'Vaccination',
      date: '10-03-2025',
      time: '8:00 AM',
      icon: 'medical-outline',
      status: 'Scheduled',
      phone: '+63 945 678 9012'
    },
    {
      id: '976-630-165',
      customerName: 'David Brown',
      petName: 'Charlie',
      petType: 'Dog',
      service: 'Pet Training',
      date: '10-06-2025',
      time: '10:00 AM',
      icon: 'school-outline',
      status: 'Completed',
      phone: '+63 956 789 0123'
    }
  ]);

  const filteredBookings = bookings.filter(booking =>
    booking.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
    booking.petName.toLowerCase().includes(searchText.toLowerCase()) ||
    booking.service.toLowerCase().includes(searchText.toLowerCase())
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

  const renderBookingItem = ({ item }) => (
    <TouchableOpacity
      style={styles.bookingItem}
      onPress={() => router.push({
        pathname: "../booking/ScheduleDetail",
        params: {
          ...item,
          businessName: 'Your Business', // Add business context
          businessType: item.service
        }
      })}
    >
      {/* Icon inside circle */}
      <View style={styles.circlePlaceholder}>
        <Ionicons name={item.icon} size={hp(4)} color="#1C86FF" />
      </View>

      {/* Details */}
      <View style={styles.bookingDetails}>
        <Text style={styles.customerName}>{item.customerName}</Text>
        <Text style={styles.petInfo}>
          {item.petName} • {item.petType}
        </Text>
        <Text style={styles.serviceText}>{item.service}</Text>
        <Text style={styles.bookingDateTime}>{item.date} | {item.time}</Text>
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
        Customer Bookings
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
          placeholder="Search customers, pets, services..."
          placeholderTextColor="#C7C7CC"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* List */}
      <FlatList
        data={filteredBookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
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
    fontSize: scaleFontSize(14),
    paddingVertical: moderateScale(10),
    color: '#333',
  },
  listContent: {
    paddingHorizontal: wp(4),
    paddingBottom: moderateScale(20),
  },
  bookingItem: {
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
  bookingDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(2),
  },
  petInfo: {
    fontSize: scaleFontSize(13),
    color: '#666',
    marginBottom: moderateScale(4),
  },
  serviceText: {
    fontSize: scaleFontSize(14),
    color: '#333',
    fontWeight: '500',
    marginBottom: moderateScale(4),
  },
  bookingDateTime: {
    fontSize: scaleFontSize(12),
    color: '#777777',
  },
  statusText: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
  },
});

export default CustomerBookings;
