import React, { useState, useEffect, useCallback } from 'react';
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
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import Header from "@components/Header";
import CompleteProfileModal from "@components/CompleteProfileModal";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from "@config/api";
import { useProfileCompletion } from "../../../_hooks/useProfileCompletion";

const Bookings = () => {
  const [searchText, setSearchText] = useState('');
  const router = useRouter();

  const [showProfileIncompleteModal, setShowProfileIncompleteModal] = useState(false);
  const { isProfileComplete } = useProfileCompletion();

  // API state
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [selectedStatus, setSelectedStatus] = useState('active'); // active, all, pending, confirmed, in-progress, completed, cancelled
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch bookings from API
  const fetchBookings = useCallback(async (page = 1, status = selectedStatus, isRefresh = false, isLoadMore = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const params = {
        page,
        limit: pagination.limit,
        sort: '-appointmentDateTime', // Sort by appointment date descending (most recent/upcoming first)
      };

      // Handle special filter statuses
      if (status === 'active') {
        // Active bookings: pending, confirmed, in-progress
        params.status = 'pending,confirmed,in-progress';
      } else if (status && status !== 'all') {
        // Specific status
        params.status = status;
      }

      const response = await apiClient.get('/bookings', { params });

      if (response.data.success) {
        const newBookings = response.data.data || [];

        // If loading more, append to existing bookings
        if (isLoadMore && page > 1) {
          setBookings(prev => [...prev, ...newBookings]);
        } else {
          setBookings(newBookings);
        }

        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load bookings';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [selectedStatus, pagination.limit]);

  // Initial fetch
  useEffect(() => {
    fetchBookings();
  }, []);

  // Show modal if profile is incomplete
  useEffect(() => {
    if (!isProfileComplete) {
      setShowProfileIncompleteModal(true);
    }
  }, [isProfileComplete]);

  // Filter bookings by search text
  const filteredBookings = bookings.filter(booking => {
    if (!searchText) return true;

    const searchLower = searchText.toLowerCase();
    const serviceName = booking.serviceId?.name?.toLowerCase() || '';
    const businessName = booking.businessId?.businessName?.toLowerCase() || '';
    const petName = booking.petId?.name?.toLowerCase() || '';

    return serviceName.includes(searchLower) ||
           businessName.includes(searchLower) ||
           petName.includes(searchLower);
  });

  // Handle refresh
  const handleRefresh = () => {
    fetchBookings(1, selectedStatus, true);
  };

  // Handle status filter change
  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    fetchBookings(1, status);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (!isLoadingMore && pagination.page < pagination.pages) {
      const nextPage = pagination.page + 1;
      fetchBookings(nextPage, selectedStatus, false, true);
    }
  };

  // Format date from ISO to readable format
  const formatDate = (isoDate) => {
    try {
      const date = new Date(isoDate);
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Format time from ISO to readable format
  const formatTime = (isoDate) => {
    try {
      const date = new Date(isoDate);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'Invalid time';
    }
  };

  // Get icon based on service category or default
  const getServiceIcon = (serviceId) => {
    const category = serviceId?.category?.toLowerCase();
    switch (category) {
      case 'veterinary':
        return 'medical-outline';
      case 'grooming':
        return 'cut-outline';
      case 'boarding':
      case 'daycare':
        return 'home-outline';
      case 'training':
        return 'school-outline';
      case 'emergency':
        return 'alert-circle-outline';
      default:
        return 'paw-outline';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '#FF9B79'; // orange
      case 'confirmed':
        return '#28a745'; // green
      case 'in-progress':
        return '#1C86FF'; // blue
      case 'completed':
        return '#007bff'; // blue
      case 'cancelled':
        return '#dc3545'; // red
      case 'no-show':
        return '#6c757d'; // gray
      default:
        return '#6c757d';
    }
  };

  // Get display status text
  const getStatusDisplay = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
  };

  const renderScheduleItem = ({ item }) => (
    <TouchableOpacity
      style={styles.scheduleItem}
      onPress={() => router.push({
        pathname: "../booking/ScheduleDetail",
        params: {
          bookingId: item._id,
          serviceName: item.serviceId?.name || 'Service',
          businessName: item.businessId?.businessName || 'Business',
          date: formatDate(item.appointmentDateTime),
          time: formatTime(item.appointmentDateTime),
          status: item.status,
          petName: item.petId?.name || 'Pet',
          paymentMethod: item.paymentMethod,
          totalAmount: item.totalAmount?.amount,
          currency: item.totalAmount?.currency,
          notes: item.notes,
          specialRequests: item.specialRequests,
        }
      })}
    >
      {/* Icon inside circle */}
      <View style={styles.circlePlaceholder}>
        <Ionicons name={getServiceIcon(item.serviceId)} size={hp(4)} color="#1C86FF" />
      </View>

      {/* Details */}
      <View style={styles.scheduleDetails}>
        <Text style={styles.scheduleTitle}>{item.serviceId?.name || 'Service'}</Text>
        <Text style={styles.businessName}>{item.businessId?.businessName || 'Business'}</Text>
        <Text style={styles.petName}>
          <Ionicons name="paw" size={moderateScale(12)} color="#666" /> {item.petId?.name || 'Pet'}
        </Text>
        <Text style={styles.scheduleDateTime}>
          {formatDate(item.appointmentDateTime)} | {formatTime(item.appointmentDateTime)}
        </Text>
      </View>

      {/* Status */}
      <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
        {getStatusDisplay(item.status)}
      </Text>
    </TouchableOpacity>
  );

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText} numberOfLines={1}>
        My Bookings
      </Text>
    </View>
  );

  // Status filter chips
  const statusFilters = [
    { value: 'active', label: 'Active', icon: 'time-outline' },
    { value: 'all', label: 'All', icon: 'list-outline' },
    { value: 'pending', label: 'Pending', icon: 'hourglass-outline' },
    { value: 'confirmed', label: 'Confirmed', icon: 'checkmark-circle-outline' },
    { value: 'in-progress', label: 'In Progress', icon: 'play-circle-outline' },
    { value: 'completed', label: 'Completed', icon: 'checkmark-done-outline' },
    { value: 'cancelled', label: 'Cancelled', icon: 'close-circle-outline' },
  ];

  const renderStatusFilter = () => (
    <View style={styles.filterContainer}>
      <FlatList
        horizontal
        data={statusFilters}
        keyExtractor={(item) => item.value}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedStatus === item.value && styles.filterChipActive
            ]}
            onPress={() => handleStatusChange(item.value)}
          >
            {item.icon && (
              <Ionicons
                name={item.icon}
                size={moderateScale(16)}
                color={selectedStatus === item.value ? '#fff' : '#1C86FF'}
                style={styles.filterChipIcon}
              />
            )}
            <Text style={[
              styles.filterChipText,
              selectedStatus === item.value && styles.filterChipTextActive
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.filterList}
      />
    </View>
  );

  // Load More button
  const renderLoadMoreButton = () => {
    if (pagination.page >= pagination.pages) return null;

    return (
      <View style={styles.loadMoreContainer}>
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={handleLoadMore}
          disabled={isLoadingMore}
        >
          {isLoadingMore ? (
            <ActivityIndicator size="small" color="#1C86FF" />
          ) : (
            <>
              <Ionicons name="arrow-down-circle-outline" size={moderateScale(20)} color="#1C86FF" />
              <Text style={styles.loadMoreText}>
                Load More ({pagination.page} of {pagination.pages})
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // Empty state
  const renderEmptyState = () => {
    let message = 'Start booking services for your pets';

    if (searchText) {
      message = 'Try adjusting your search terms';
    } else if (selectedStatus === 'active') {
      message = 'You have no active bookings at the moment';
    } else if (selectedStatus === 'cancelled') {
      message = 'You have no cancelled bookings';
    } else if (selectedStatus === 'completed') {
      message = 'You have no completed bookings';
    } else if (selectedStatus !== 'all') {
      message = `You don't have any ${selectedStatus} bookings`;
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={moderateScale(64)} color="#ccc" />
        <Text style={styles.emptyTitle}>No bookings found</Text>
        <Text style={styles.emptySubtitle}>{message}</Text>
      </View>
    );
  };

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
          placeholder="Search by service, business, or pet"
          placeholderTextColor="#C7C7CC"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Status Filter */}
      {renderStatusFilter()}

      {/* Loading State */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1C86FF" />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      ) : (
        /* List */
        <FlatList
          data={filteredBookings}
          renderItem={renderScheduleItem}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderLoadMoreButton}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#1C86FF']}
              tintColor="#1C86FF"
            />
          }
        />
      )}

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
    marginBottom: moderateScale(2),
  },
  petName: {
    fontSize: scaleFontSize(12),
    color: '#666',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(40),
  },
  loadingText: {
    marginTop: moderateScale(12),
    fontSize: scaleFontSize(14),
    color: '#666',
  },
  filterContainer: {
    marginHorizontal: wp(4),
    marginBottom: moderateScale(10),
  },
  filterList: {
    paddingVertical: moderateScale(5),
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1C86FF',
    marginRight: moderateScale(8),
  },
  filterChipActive: {
    backgroundColor: '#1C86FF',
  },
  filterChipIcon: {
    marginRight: moderateScale(4),
  },
  filterChipText: {
    fontSize: scaleFontSize(13),
    color: '#1C86FF',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  loadMoreContainer: {
    paddingVertical: moderateScale(20),
    alignItems: 'center',
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(25),
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1C86FF',
    gap: moderateScale(8),
  },
  loadMoreText: {
    fontSize: scaleFontSize(14),
    color: '#1C86FF',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(60),
    paddingHorizontal: wp(10),
  },
  emptyTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#333',
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  emptySubtitle: {
    fontSize: scaleFontSize(14),
    color: '#666',
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
});

export default Bookings;
