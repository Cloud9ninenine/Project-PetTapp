import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import Header from "@components/Header";
import { wp, moderateScale, scaleFontSize } from '@utils/responsive';

const Bookings = () => {
  const [searchText, setSearchText] = useState('');
  const router = useRouter();

  const [schedules] = useState([
    {
      id: '1',
      title: 'Veterinary Appointment',
      date: 'Date',
      time: 'Time',
      icon: 'medical-outline',
      status: 'Scheduled'
    },
    {
      id: '2',
      title: 'Pet Grooming',
      date: 'Date',
      time: 'Time',
      icon: 'cut-outline',
      status: 'Cancelled'
    },
    {
      id: '3',
      title: 'Pet Boarding',
      date: 'Date',
      time: 'Time',
      icon: 'home-outline',
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
        <Ionicons name={item.icon} size={moderateScale(24)} color="#4A90E2" />
      </View>

      {/* Details */}
      <View style={styles.scheduleDetails}>
        <Text style={styles.scheduleTitle}>{item.title}</Text>
        <Text style={styles.scheduleDateTime}>{item.date} | {item.time}</Text>
      </View>

      {/* Status */}
      <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
        {item.status}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header title="My Schedules" />

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingVertical: moderateScale(20),
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(20),
    paddingTop: moderateScale(50),
    gap: moderateScale(13),
    borderBottomLeftRadius: moderateScale(20),
    borderBottomRightRadius: moderateScale(20),
  },
  headerTitle: {
    fontSize: scaleFontSize(22),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: moderateScale(15),
    paddingHorizontal: moderateScale(15),
    borderRadius: moderateScale(10),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
    borderColor: '#E0E0E0',
  },
  circlePlaceholder: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
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
    marginBottom: moderateScale(4),
  },
  scheduleDateTime: {
    fontSize: scaleFontSize(14),
    color: '#777777',
  },
  statusText: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
  },
});

export default Bookings;
