import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from '@config/api';

const CustomerBookings = () => {
  const [searchText, setSearchText] = useState('');
  const [bookings, setBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchBookings();
    fetchAllBookingsForStats();
  }, [selectedStatus]);

  const fetchAllBookingsForStats = async () => {
    try {
      // Fetch first 100 bookings for filter counts only
      const response = await apiClient.get('/bookings', {
        params: { page: 1, limit: 100 }
      });

      if (response.data && response.data.success) {
        setAllBookings(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching bookings for stats:', error);
    }
  };

  const fetchBookings = async (pageNum = 1) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      }

      const params = {
        page: pageNum,
        limit: 20,
      };

      // Add status filter if not 'all'
      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }

      const response = await apiClient.get('/bookings', { params });

      if (response.data && response.data.success) {
        const newBookings = response.data.data || [];

        if (pageNum === 1) {
          setBookings(newBookings);
        } else {
          setBookings(prev => [...prev, ...newBookings]);
        }

        // Check if there are more pages
        const pagination = response.data.pagination;
        setHasMore(pagination && pagination.page < pagination.pages);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchBookings(1);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchBookings(page + 1);
    }
  };

  const getServiceIcon = (serviceName) => {
    const name = serviceName?.toLowerCase() || '';
    if (name.includes('vet') || name.includes('check')) return 'medical-outline';
    if (name.includes('groom')) return 'cut-outline';
    if (name.includes('board')) return 'home-outline';
    if (name.includes('train')) return 'school-outline';
    if (name.includes('vaccin')) return 'medical-outline';
    return 'paw-outline';
  };

  const filteredBookings = bookings.filter(booking => {
    const searchLower = searchText.toLowerCase();
    // Access populated fields correctly
    const petOwner = booking.petOwnerId || {};
    const customerName = `${petOwner.firstName || ''} ${petOwner.lastName || ''}`.toLowerCase();
    const petName = booking.petId?.name?.toLowerCase() || '';
    const service = booking.serviceId?.name?.toLowerCase() || '';

    return customerName.includes(searchLower) ||
           petName.includes(searchLower) ||
           service.includes(searchLower);
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '#FF9B79'; // orange
      case 'confirmed':
        return '#28a745'; // green
      case 'in-progress':
        return '#FFC107'; // yellow
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

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'no-show':
        return 'No Show';
      default:
        return status || 'Unknown';
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    const date = new Date(dateTime);
    const dateStr = date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return `${dateStr} | ${timeStr}`;
  };

  const renderBookingItem = ({ item }) => {
    // Backend returns populated fields as petOwnerId, petId, serviceId (not petOwnerDetails, etc.)
    const petOwner = item.petOwnerId || {};
    const customerName = (petOwner.firstName && petOwner.lastName)
      ? `${petOwner.firstName} ${petOwner.lastName}`.trim()
      : 'Unknown Customer';

    const pet = item.petId || {};
    const petName = pet.name || 'Unknown Pet';
    const petType = pet.species || 'Pet';

    const service = item.serviceId?.name || 'Service';

    // Payment proof is stored as an object with imageUrl
    const hasPaymentProof = !!(item.paymentProof?.imageUrl);
    const paymentStatus = item.paymentStatus?.toLowerCase();

    // Format booking ID for display
    const bookingId = item._id ? `#${item._id.slice(-8).toUpperCase()}` : 'N/A';

    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={() => router.push({
          pathname: "../booking/AppointmentDetails",
          params: {
            bookingId: item._id,
          }
        })}
        activeOpacity={0.6}
      >
        <View style={styles.cardContent}>
          {/* Header Row: Booking ID & Status */}
          <View style={styles.headerRow}>
            <View style={styles.bookingIdContainer}>
              <Ionicons name="receipt-outline" size={moderateScale(16)} color="#666" />
              <Text style={styles.bookingId}>{bookingId}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
            </View>
          </View>

          {/* Customer Name */}
          <View style={styles.customerRow}>
            <Ionicons name="person-outline" size={moderateScale(18)} color="#1C86FF" />
            <Text style={styles.customerName}>{customerName}</Text>
          </View>

          {/* Service */}
          <View style={styles.infoRow}>
            <Ionicons name="cut-outline" size={moderateScale(16)} color="#666" />
            <Text style={styles.service}>{service}</Text>
          </View>

          {/* Pet Info */}
          <View style={styles.infoRow}>
            <Ionicons name="paw-outline" size={moderateScale(16)} color="#666" />
            <Text style={styles.metaText}>{petName} ({petType})</Text>
          </View>

          {/* Date/Time */}
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={moderateScale(16)} color="#666" />
            <Text style={styles.metaText}>{formatDateTime(item.appointmentDateTime)}</Text>
          </View>

          {/* Payment Indicator */}
          {(paymentStatus === 'paid' || (hasPaymentProof && paymentStatus === 'proof-uploaded')) && (
            <View style={styles.paymentRow}>
              {paymentStatus === 'paid' && (
                <>
                  <Ionicons name="checkmark-circle" size={moderateScale(16)} color="#4CAF50" />
                  <Text style={[styles.paymentText, { color: '#4CAF50' }]}>Payment Verified</Text>
                </>
              )}
              {hasPaymentProof && paymentStatus === 'proof-uploaded' && (
                <>
                  <Ionicons name="time-outline" size={moderateScale(16)} color="#FFC107" />
                  <Text style={[styles.paymentText, { color: '#FFC107' }]}>Awaiting Verification</Text>
                </>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const statusFilters = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'No Show', value: 'no-show' },
  ];

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText} numberOfLines={1}>
        Customer Bookings
      </Text>
    </View>
  );


  const getStatusCount = (status) => {
    if (status === 'all') return allBookings.length;
    const statusMap = {
      'pending': 'pending',
      'confirmed': 'confirmed',
      'in-progress': 'in-progress',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'no-show': 'no-show',
    };
    return allBookings.filter(b => b.status === statusMap[status]).length;
  };

  const renderFilterModal = () => (
    <Modal
      visible={filterModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setFilterModalVisible(false)}
      >
        <View style={styles.filterDropdown}>
          {statusFilters.map((filter) => {
            const count = getStatusCount(filter.value);
            const isSelected = selectedStatus === filter.value;
            return (
              <TouchableOpacity
                key={filter.value}
                style={[
                  styles.filterOption,
                  isSelected && styles.filterOptionSelected
                ]}
                onPress={() => {
                  setSelectedStatus(filter.value);
                  setPage(1);
                  setHasMore(true);
                  setFilterModalVisible(false);
                }}
              >
                <View style={styles.filterOptionContent}>
                  <Text style={[
                    styles.filterOptionText,
                    isSelected && styles.filterOptionTextSelected
                  ]}>
                    {filter.label}
                  </Text>
                  {allBookings.length > 0 && count > 0 && (
                    <View style={[
                      styles.filterCountBadge,
                      isSelected && styles.filterCountBadgeSelected
                    ]}>
                      <Text style={[
                        styles.filterCountText,
                        isSelected && styles.filterCountTextSelected
                      ]}>
                        {count}
                      </Text>
                    </View>
                  )}
                </View>
                {isSelected && (
                  <Ionicons name="checkmark" size={moderateScale(20)} color="#1C86FF" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderFooter = () => {
    if (!loading || page === 1) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#1C86FF" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={moderateScale(80)} color="#ccc" />
        <Text style={styles.emptyText}>No bookings found</Text>
        <Text style={styles.emptySubtext}>
          Bookings from customers will appear here
        </Text>
      </View>
    );
  };

  if (loading && page === 1) {
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1C86FF" />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

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

      {/* Search Bar with Filter Button */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={moderateScale(20)} color="#C7C7CC" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search customers, pets, services..."
          placeholderTextColor="#C7C7CC"
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="filter" size={moderateScale(22)} color="#1C86FF" />
          {selectedStatus !== 'all' && (
            <View style={styles.filterActiveDot} />
          )}
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      {renderFilterModal()}

      {/* List */}
      <FlatList
        data={filteredBookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1C86FF']}
            tintColor="#1C86FF"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
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
  filterButton: {
    padding: moderateScale(8),
    marginLeft: moderateScale(8),
    position: 'relative',
  },
  filterActiveDot: {
    position: 'absolute',
    top: moderateScale(6),
    right: moderateScale(6),
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#FF6B6B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: hp(13),
    paddingRight: wp(4),
  },
  filterDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(8),
    minWidth: wp(50),
    maxWidth: wp(80),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterOptionSelected: {
    backgroundColor: '#F0F7FF',
  },
  filterOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: moderateScale(8),
  },
  filterOptionText: {
    fontSize: scaleFontSize(15),
    color: '#333',
    fontWeight: '500',
  },
  filterOptionTextSelected: {
    color: '#1C86FF',
    fontWeight: '600',
  },
  filterCountBadge: {
    backgroundColor: '#E8E8E8',
    borderRadius: moderateScale(10),
    minWidth: moderateScale(24),
    height: moderateScale(24),
    paddingHorizontal: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterCountBadgeSelected: {
    backgroundColor: '#1C86FF',
  },
  filterCountText: {
    fontSize: scaleFontSize(12),
    color: '#666',
    fontWeight: 'bold',
  },
  filterCountTextSelected: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: wp(4),
    paddingBottom: moderateScale(20),
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: moderateScale(16),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    padding: moderateScale(16),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(12),
    paddingBottom: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  bookingIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  bookingId: {
    fontSize: scaleFontSize(13),
    fontWeight: '600',
    color: '#666',
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(12),
  },
  statusText: {
    fontSize: scaleFontSize(12),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginBottom: moderateScale(10),
  },
  customerName: {
    fontSize: scaleFontSize(17),
    fontWeight: 'bold',
    color: '#1C86FF',
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginBottom: moderateScale(8),
  },
  service: {
    fontSize: scaleFontSize(15),
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  metaText: {
    fontSize: scaleFontSize(14),
    color: '#666',
    flex: 1,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    marginTop: moderateScale(8),
    paddingTop: moderateScale(12),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  paymentText: {
    fontSize: scaleFontSize(13),
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: moderateScale(12),
    fontSize: scaleFontSize(14),
    color: '#666',
  },
  footerLoader: {
    paddingVertical: moderateScale(20),
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(80),
  },
  emptyText: {
    fontSize: scaleFontSize(18),
    fontWeight: '600',
    color: '#666',
    marginTop: moderateScale(20),
    marginBottom: moderateScale(8),
  },
  emptySubtext: {
    fontSize: scaleFontSize(14),
    color: '#999',
    textAlign: 'center',
  },
});

export default CustomerBookings;
