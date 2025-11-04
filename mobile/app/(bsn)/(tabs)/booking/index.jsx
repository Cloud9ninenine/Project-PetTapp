import React, { useState, useEffect, useRef } from 'react';
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
  ScrollView,
  AppState,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback } from 'react';
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    sortBy: 'appointmentAsc', // appointmentAsc, bookingCreatedDesc, serviceAlpha, revenueDesc, customerAlpha
    paymentMethod: 'all', // all, cash, qr-payment
    bookingStatus: 'all', // all, pending, confirmed, in-progress, completed, cancelled, no-show
    paymentStatus: 'all', // all, pending, proof-uploaded, paid, failed
  });
  const [tempFilterOptions, setTempFilterOptions] = useState(filterOptions);

  const router = useRouter();
  const appState = useRef(AppState.currentState);
  const lastFetchTimeRef = useRef(Date.now());

  const handleBackPress = () => {
    router.push('/(bsn)/(tabs)/home');
  };

  useEffect(() => {
    fetchBookings();
    fetchAllBookingsForStats();
  }, [selectedStatus, filterOptions]);

  // App state listener (foreground/background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  // Screen focus listener - automatically refresh when returning to screen
  useFocusEffect(
    useCallback(() => {
      // Automatically refresh data when screen comes into focus
      const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;

      // Fetch if more than 2 seconds have passed since last fetch
      if (timeSinceLastFetch > 2000) {
        silentRefresh();
      }

      return () => {
        // Cleanup if needed
      };
    }, [])
  );

  const handleAppStateChange = (nextAppState) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground
      console.log('App is now active - refreshing bookings');
      silentRefresh();
    }

    appState.current = nextAppState;
  };

  const silentRefresh = async () => {
    try {
      lastFetchTimeRef.current = Date.now();
      await fetchBookings(1);
      await fetchAllBookingsForStats();
    } catch (error) {
      console.error('Error during silent refresh:', error);
    }
  };

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
      } else {
        setIsLoadingMore(true);
      }

      const params = {
        page: pageNum,
        limit: 20,
      };

      // Apply sort based on filter options
      switch (filterOptions.sortBy) {
        case 'appointmentAsc':
          params.sort = 'appointmentDateTime'; // Ascending (what's next)
          break;
        case 'bookingCreatedDesc':
          params.sort = '-createdAt'; // Descending (recent activity)
          break;
        case 'serviceAlpha':
        case 'revenueDesc':
        case 'customerAlpha':
        default:
          // These require client-side sorting with populated data
          params.sort = 'appointmentDateTime'; // Default fetch order
          break;
      }

      // Add payment method filter if not 'all'
      if (filterOptions.paymentMethod && filterOptions.paymentMethod !== 'all') {
        params.paymentMethod = filterOptions.paymentMethod;
      }

      // Add booking status filter if not 'all'
      if (filterOptions.bookingStatus && filterOptions.bookingStatus !== 'all') {
        params.bookingStatus = filterOptions.bookingStatus;
      }

      // Add payment status filter if not 'all'
      if (filterOptions.paymentStatus && filterOptions.paymentStatus !== 'all') {
        params.paymentStatus = filterOptions.paymentStatus;
      }

      // Handle special filter statuses
      if (selectedStatus === 'active') {
        // Active bookings: pending, confirmed, in-progress
        params.status = 'pending,confirmed,in-progress';
      } else if (selectedStatus !== 'all') {
        // Specific status
        params.status = selectedStatus;
      }
      // For 'all' status, we'll sort on client-side after fetching

      const response = await apiClient.get('/bookings', { params });

      if (response.data && response.data.success) {
        let newBookings = response.data.data || [];

        // Frontend safety filter: Ensure payment method filter is applied correctly
        if (filterOptions.paymentMethod && filterOptions.paymentMethod !== 'all') {
          const beforeFilterCount = newBookings.length;
          newBookings = newBookings.filter(booking =>
            booking.paymentMethod === filterOptions.paymentMethod
          );

          if (beforeFilterCount !== newBookings.length) {
            console.warn('⚠️ Payment filter mismatch detected!', {
              requestedPaymentMethod: filterOptions.paymentMethod,
              beforeFilterCount: beforeFilterCount,
              afterFilterCount: newBookings.length,
            });
          }
        }

        // Frontend safety filter: Ensure booking status filter is applied correctly
        if (filterOptions.bookingStatus && filterOptions.bookingStatus !== 'all') {
          newBookings = newBookings.filter(booking =>
            booking.status === filterOptions.bookingStatus
          );
        }

        // Frontend safety filter: Ensure payment status filter is applied correctly
        if (filterOptions.paymentStatus && filterOptions.paymentStatus !== 'all') {
          newBookings = newBookings.filter(booking =>
            booking.paymentStatus === filterOptions.paymentStatus
          );
        }

        // Frontend sorting: Advanced multi-level sorting with reschedule priority
        const now = Date.now();

        newBookings.sort((a, b) => {
          // CRITICAL PRIORITY: Pending reschedule requests (especially if new date is closer)
          const aHasPendingEdit = a.editRequest?.approvalStatus === 'pending';
          const bHasPendingEdit = b.editRequest?.approvalStatus === 'pending';

          if (aHasPendingEdit && !bHasPendingEdit) return -1;
          if (!aHasPendingEdit && bHasPendingEdit) return 1;

          // If both have pending edits, prioritize by closeness of NEW proposed date
          if (aHasPendingEdit && bHasPendingEdit) {
            const aNewDate = new Date(a.editRequest.appointmentDateTime).getTime();
            const bNewDate = new Date(b.editRequest.appointmentDateTime).getTime();
            const aDistance = Math.abs(aNewDate - now);
            const bDistance = Math.abs(bNewDate - now);
            return aDistance - bDistance; // Closer new dates first
          }

          // PRIMARY SORT: Closeness to current date (by default)
          if (filterOptions.sortBy === 'appointmentAsc' || selectedStatus === 'all') {
            const dateA = new Date(a.appointmentDateTime).getTime();
            const dateB = new Date(b.appointmentDateTime).getTime();
            const distanceA = Math.abs(dateA - now);
            const distanceB = Math.abs(dateB - now);

            // Closest to today first
            const closenessCompare = distanceA - distanceB;
            if (closenessCompare !== 0) return closenessCompare;
          }

          // SECONDARY SORT: Status priority
          const statusPriority = {
            'pending': 1,
            'confirmed': 2,
            'in-progress': 3,
            'completed': 4,
            'cancelled': 5,
            'no-show': 6,
          };

          const aPriority = statusPriority[a.status] || 999;
          const bPriority = statusPriority[b.status] || 999;

          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }

          // TERTIARY SORT: Apply user-selected sort option
          switch (filterOptions.sortBy) {
            case 'bookingCreatedDesc':
              const createdA = new Date(a.createdAt).getTime();
              const createdB = new Date(b.createdAt).getTime();
              return createdB - createdA;

            case 'serviceAlpha':
              const serviceA = (a.serviceId?.name || '').toLowerCase();
              const serviceB = (b.serviceId?.name || '').toLowerCase();
              return serviceA.localeCompare(serviceB);

            case 'revenueDesc':
              const feeA = a.totalFee || 0;
              const feeB = b.totalFee || 0;
              return feeB - feeA;

            case 'customerAlpha':
              const petOwnerA = a.petOwnerId || {};
              const petOwnerB = b.petOwnerId || {};
              const nameA = `${petOwnerA.firstName || ''} ${petOwnerA.lastName || ''}`.trim().toLowerCase();
              const nameB = `${petOwnerB.firstName || ''} ${petOwnerB.lastName || ''}`.trim().toLowerCase();
              return nameA.localeCompare(nameB);

            default:
              // Default: by appointment date ascending (what's coming up)
              const defaultDateA = new Date(a.appointmentDateTime).getTime();
              const defaultDateB = new Date(b.appointmentDateTime).getTime();
              return defaultDateA - defaultDateB;
          }
        });

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
      setIsLoadingMore(false);
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
    // First, filter by pending edits if that filter is selected
    if (selectedStatus === 'pending-edits') {
      if (booking.editRequest?.approvalStatus !== 'pending') {
        return false;
      }
    }

    // Then apply search filter
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

    // Check for pending reschedule request
    const hasPendingReschedule = item.editRequest?.approvalStatus === 'pending';
    const isRescheduled = item.editRequest?.approvalStatus === 'approved';

    return (
      <TouchableOpacity
        style={[
          styles.bookingCard,
          hasPendingReschedule && styles.bookingCardPendingReschedule
        ]}
        onPress={() => router.push({
          pathname: "../booking/AppointmentDetails",
          params: {
            bookingId: item._id,
          }
        })}
        activeOpacity={0.6}
      >
        <View style={styles.cardContent}>
          {/* CRITICAL: Pending Reschedule Alert */}
          {hasPendingReschedule && (
            <View style={styles.pendingRescheduleAlert}>
              <Ionicons name="alarm-outline" size={moderateScale(18)} color="#FF6B00" />
              <Text style={styles.pendingRescheduleText}>
                Reschedule Request - Needs Your Approval
              </Text>
            </View>
          )}

          {/* Header Row: Booking ID & Status */}
          <View style={styles.headerRow}>
            <View style={styles.bookingIdContainer}>
              <Ionicons name="receipt-outline" size={moderateScale(16)} color="#666" />
              <Text style={styles.bookingId}>{bookingId}</Text>
              {isRescheduled && (
                <View style={styles.rescheduledBadge}>
                  <Ionicons name="sync-outline" size={moderateScale(12)} color="#4CAF50" />
                  <Text style={styles.rescheduledText}>Rescheduled</Text>
                </View>
              )}
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
    { label: 'All', value: 'all', icon: 'list-outline' },
    { label: 'Pending Edits', value: 'pending-edits', icon: 'alarm-outline', special: true },
    { label: 'Active', value: 'active', icon: 'time-outline' },
    { label: 'Pending', value: 'pending', icon: 'hourglass-outline' },
    { label: 'Confirmed', value: 'confirmed', icon: 'checkmark-circle-outline' },
    { label: 'In Progress', value: 'in-progress', icon: 'play-circle-outline' },
    { label: 'Completed', value: 'completed', icon: 'checkmark-done-outline' },
    { label: 'Cancelled', value: 'cancelled', icon: 'close-circle-outline' },
    { label: 'No Show', value: 'no-show', icon: 'ban-outline' },
  ];

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText} numberOfLines={1}>
        Appointments
      </Text>
    </View>
  );


  const getStatusCount = (status) => {
    if (status === 'all') return allBookings.length;
    if (status === 'active') {
      return allBookings.filter(b =>
        b.status === 'pending' || b.status === 'confirmed' || b.status === 'in-progress'
      ).length;
    }
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

  // Handle filter modal open
  const handleOpenFilterModal = () => {
    setTempFilterOptions(filterOptions);
    setFilterModalVisible(true);
  };

  // Handle filter modal close without applying
  const handleCloseFilterModal = () => {
    // Reset temp options to current filter options (discard changes)
    setTempFilterOptions(filterOptions);
    setFilterModalVisible(false);
  };

  // Handle filter apply
  const handleApplyFilter = () => {
    setFilterOptions(tempFilterOptions);
    setFilterModalVisible(false);
  };

  // Handle filter reset
  const handleResetFilter = () => {
    const defaultOptions = {
      sortBy: 'appointmentAsc',
      paymentMethod: 'all',
      bookingStatus: 'all',
      paymentStatus: 'all',
    };
    setTempFilterOptions(defaultOptions);
    setFilterOptions(defaultOptions);
    setFilterModalVisible(false);
  };

  // Check if filters are active
  const hasActiveFilters = () => {
    return filterOptions.sortBy !== 'appointmentAsc' ||
           filterOptions.paymentMethod !== 'all' ||
           filterOptions.bookingStatus !== 'all' ||
           filterOptions.paymentStatus !== 'all';
  };

  const renderFilterModal = () => (
    <Modal
      visible={filterModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCloseFilterModal}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={handleCloseFilterModal}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.filterModalContent}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter & Sort</Text>
            <TouchableOpacity onPress={handleCloseFilterModal}>
              <Ionicons name="close" size={moderateScale(24)} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.filterContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {/* Sort Section */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Sort By</Text>

              {[
                { value: 'appointmentAsc', label: 'Appointment Date', icon: 'calendar-outline' },
                { value: 'bookingCreatedDesc', label: 'Appointment Created', icon: 'time-outline' },
                { value: 'serviceAlpha', label: 'Service Type (A-Z)', icon: 'cut-outline' },
                { value: 'revenueDesc', label: 'Highest Revenue', icon: 'cash-outline' },
                { value: 'customerAlpha', label: 'Customer Name (A-Z)', icon: 'person-outline' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.filterOption}
                  onPress={() => setTempFilterOptions({ ...tempFilterOptions, sortBy: option.value })}
                >
                  <View style={styles.filterCheckbox}>
                    {tempFilterOptions.sortBy === option.value && (
                      <Ionicons name="checkmark" size={moderateScale(16)} color="#1C86FF" />
                    )}
                  </View>
                  <Ionicons name={option.icon} size={moderateScale(18)} color="#1C86FF" style={styles.optionIcon} />
                  <Text style={styles.filterOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Payment Method Section */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Payment Method</Text>

              {[
                { value: 'all', label: 'All Methods', icon: 'list' },
                { value: 'cash', label: 'Cash', icon: 'cash-outline' },
                { value: 'qr-payment', label: 'QR Payment', icon: 'qr-code-outline' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.filterOption}
                  onPress={() => setTempFilterOptions({ ...tempFilterOptions, paymentMethod: option.value })}
                >
                  <View style={styles.filterCheckbox}>
                    {tempFilterOptions.paymentMethod === option.value && (
                      <Ionicons name="checkmark" size={moderateScale(16)} color="#1C86FF" />
                    )}
                  </View>
                  <Ionicons name={option.icon} size={moderateScale(18)} color="#1C86FF" style={styles.optionIcon} />
                  <Text style={styles.filterOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Booking Status Section */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Booking Status</Text>

              {[
                { value: 'all', label: 'All Statuses', icon: 'list' },
                { value: 'pending', label: 'Pending', icon: 'hourglass-outline' },
                { value: 'confirmed', label: 'Confirmed', icon: 'checkmark-circle-outline' },
                { value: 'in-progress', label: 'In Progress', icon: 'play-circle-outline' },
                { value: 'completed', label: 'Completed', icon: 'checkmark-done-outline' },
                { value: 'cancelled', label: 'Cancelled', icon: 'close-circle-outline' },
                { value: 'no-show', label: 'No Show', icon: 'ban-outline' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.filterOption}
                  onPress={() => setTempFilterOptions({ ...tempFilterOptions, bookingStatus: option.value })}
                >
                  <View style={styles.filterCheckbox}>
                    {tempFilterOptions.bookingStatus === option.value && (
                      <Ionicons name="checkmark" size={moderateScale(16)} color="#1C86FF" />
                    )}
                  </View>
                  <Ionicons name={option.icon} size={moderateScale(18)} color="#1C86FF" style={styles.optionIcon} />
                  <Text style={styles.filterOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Payment Status Section */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Payment Status</Text>

              {[
                { value: 'all', label: 'All Statuses', icon: 'list' },
                { value: 'pending', label: 'Pending', icon: 'time-outline' },
                { value: 'proof-uploaded', label: 'Proof Uploaded', icon: 'cloud-upload-outline' },
                { value: 'paid', label: 'Paid', icon: 'checkmark-circle' },
                { value: 'failed', label: 'Failed', icon: 'close-circle' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.filterOption}
                  onPress={() => setTempFilterOptions({ ...tempFilterOptions, paymentStatus: option.value })}
                >
                  <View style={styles.filterCheckbox}>
                    {tempFilterOptions.paymentStatus === option.value && (
                      <Ionicons name="checkmark" size={moderateScale(16)} color="#1C86FF" />
                    )}
                  </View>
                  <Ionicons name={option.icon} size={moderateScale(18)} color="#1C86FF" style={styles.optionIcon} />
                  <Text style={styles.filterOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.footerButton, styles.resetButton]}
              onPress={handleResetFilter}
            >
              <Ionicons name="refresh" size={moderateScale(18)} color="#1C86FF" />
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerButton, styles.applyButton]}
              onPress={handleApplyFilter}
            >
              <Ionicons name="checkmark-done" size={moderateScale(18)} color="#fff" />
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

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
              selectedStatus === item.value && styles.filterChipActive,
              item.special && styles.filterChipSpecial,
              item.special && selectedStatus === item.value && styles.filterChipSpecialActive
            ]}
            onPress={() => setSelectedStatus(item.value)}
          >
            {item.icon && (
              <Ionicons
                name={item.icon}
                size={moderateScale(16)}
                color={
                  item.special
                    ? (selectedStatus === item.value ? '#fff' : '#FF6B00')
                    : (selectedStatus === item.value ? '#fff' : '#1C86FF')
                }
                style={styles.filterChipIcon}
              />
            )}
            <Text style={[
              styles.filterChipText,
              selectedStatus === item.value && styles.filterChipTextActive,
              item.special && styles.filterChipTextSpecial,
              item.special && selectedStatus === item.value && styles.filterChipTextSpecialActive
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.filterList}
      />
    </View>
  );

  const renderLoadMoreButton = () => {
    if (!hasMore) return null;

    return (
      <View style={styles.loadMoreContainer}>
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={loadMore}
          disabled={isLoadingMore}
        >
          {isLoadingMore ? (
            <ActivityIndicator size="small" color="#1C86FF" />
          ) : (
            <>
              <Ionicons name="arrow-down-circle-outline" size={moderateScale(20)} color="#1C86FF" />
              <Text style={styles.loadMoreText}>Load More</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

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

    let message = 'Bookings from customers will appear here';

    if (searchText) {
      message = 'Try adjusting your search terms';
    } else if (selectedStatus === 'active') {
      message = 'No active bookings at the moment';
    } else if (selectedStatus === 'cancelled') {
      message = 'No cancelled bookings';
    } else if (selectedStatus === 'completed') {
      message = 'No completed bookings';
    } else if (selectedStatus !== 'all') {
      message = `No ${selectedStatus} bookings`;
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={moderateScale(80)} color="#ccc" />
        <Text style={styles.emptyText}>No bookings found</Text>
        <Text style={styles.emptySubtext}>{message}</Text>
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
          showBack={true}
          onBackPress={handleBackPress}
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
        showBack={true}
        onBackPress={handleBackPress}
      />

      {/* Search Bar and Filter Button */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={moderateScale(20)} color="#C7C7CC" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers, pets, services..."
            placeholderTextColor="#C7C7CC"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={moderateScale(20)} color="#C7C7CC" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterButton, hasActiveFilters() && styles.filterButtonActive]}
          onPress={handleOpenFilterModal}
        >
          <Ionicons
            name="filter"
            size={moderateScale(20)}
            color={hasActiveFilters() ? "#fff" : "#1C86FF"}
          />
          {hasActiveFilters() && <View style={styles.filterBadge} />}
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
        ListFooterComponent={renderLoadMoreButton}
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
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp(4),
    marginVertical: moderateScale(12),
    gap: moderateScale(8),
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(15),
    borderRadius: moderateScale(10),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: hp(5.5),
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
  filterButtonActive: {
    backgroundColor: '#1C86FF',
    borderRadius: moderateScale(8),
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
  filterBadge: {
    position: 'absolute',
    top: moderateScale(4),
    right: moderateScale(4),
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#FF6B6B',
  },
  filterContainer: {
    paddingVertical: moderateScale(8),
    backgroundColor: '#fff',
  },
  filterList: {
    paddingHorizontal: wp(4),
    gap: moderateScale(8),
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(20),
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: moderateScale(6),
  },
  filterChipActive: {
    backgroundColor: '#1C86FF',
    borderColor: '#1C86FF',
  },
  filterChipIcon: {
    marginRight: moderateScale(2),
  },
  filterChipText: {
    fontSize: scaleFontSize(13),
    color: '#1C86FF',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  filterChipSpecial: {
    backgroundColor: '#FFF4E6',
    borderColor: '#FF6B00',
    borderWidth: 2,
  },
  filterChipSpecialActive: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  filterChipTextSpecial: {
    color: '#FF6B00',
    fontWeight: '700',
  },
  filterChipTextSpecialActive: {
    color: '#fff',
    fontWeight: '700',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(18),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#1C86FF',
  },
  filterContent: {
    maxHeight: moderateScale(400),
    padding: moderateScale(16),
  },
  filterSection: {
    marginBottom: moderateScale(24),
  },
  filterSectionTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(12),
  },
  filterCheckbox: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(4),
    borderWidth: 2,
    borderColor: '#1C86FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(12),
  },
  optionIcon: {
    marginLeft: moderateScale(4),
  },
  modalFooter: {
    flexDirection: 'row',
    gap: moderateScale(10),
    padding: moderateScale(16),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(10),
    gap: moderateScale(6),
  },
  resetButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1C86FF',
  },
  resetButtonText: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#1C86FF',
  },
  applyButton: {
    backgroundColor: '#1C86FF',
  },
  applyButtonText: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(5),
  },
  filterModalContent: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(20),
    width: '90%',
    maxWidth: wp(90),
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
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
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: moderateScale(12),
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
  bookingCardPendingReschedule: {
    borderWidth: 2,
    borderColor: '#FF6B00',
    backgroundColor: '#FFF9F5',
    shadowColor: '#FF6B00',
    shadowOpacity: 0.15,
    elevation: 4,
  },
  pendingRescheduleAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE8D6',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(12),
    gap: moderateScale(8),
    borderLeftWidth: moderateScale(4),
    borderLeftColor: '#FF6B00',
  },
  pendingRescheduleText: {
    fontSize: scaleFontSize(13),
    fontWeight: '700',
    color: '#C55000',
    flex: 1,
  },
  rescheduledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(10),
    marginLeft: moderateScale(8),
    gap: moderateScale(4),
  },
  rescheduledText: {
    fontSize: scaleFontSize(10),
    fontWeight: '600',
    color: '#4CAF50',
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
