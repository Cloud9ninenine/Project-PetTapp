import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import Header from "@components/Header";

const Bookings = () => {
  const [searchText, setSearchText] = useState('');
  const router = useRouter();

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
        <Ionicons name={item.icon} size={30} color="#1C86FF" />
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
        <Ionicons name="search-outline" size={20} color="#C7C7CC" style={styles.searchIcon} />
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
    fontSize: 24,
    fontFamily: 'SFProBold',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1C86FF',
    height: 50,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    color: '#333',
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1C86FF',
    height:100,
  },
  circlePlaceholder: {
    width: 75,
    height: 75,
    borderRadius: 50,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  scheduleDetails: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 2,
  },
  businessName: {
    fontSize: 13,
    color: '#1C86FF',
    marginBottom: 4,
  },
  scheduleDateTime: {
    fontSize: 12,
    color: '#777777',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Bookings;
