import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Image,
  Modal,
  ScrollView,
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
  const [selectedStatus, setSelectedStatus] = useState('all'); // active, all, pending, confirmed, in-progress, completed, cancelled
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Filter state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    sortBy: 'dateDesc', // dateDesc, dateAsc, amount
    paymentMethod: 'all', // all, cash, card, online, wallet
  });
  const [tempFilterOptions, setTempFilterOptions] = useState(filterOptions);

  // Service image cache state
  const [serviceImageCache, setServiceImageCache] = useState({});

  // Fetch service image from API
  const fetchServiceImage = useCallback(async (serviceId) => {
    try {
      // Check if image is already cached
      if (serviceImageCache[serviceId]) {
        return serviceImageCache[serviceId];
      }

      // Fetch service details to get image
      const response = await apiClient.get(`/services/${serviceId}`);
      if (response.data.success && response.data.data) {
        const imageUrl = response.data.data.imageUrl;
        // Cache the image URL
        setServiceImageCache(prev => ({
          ...prev,
          [serviceId]: imageUrl
        }));
        return imageUrl;
      }
    } catch (error) {
      // Error fetching service image
    }
    return null;
  }, [serviceImageCache]);

  // Fetch bookings from API
  const fetchBookings = useCallback(async (page = 1, status = selectedStatus, isRefresh = false, isLoadMore = false, searchQuery = '') => {
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
      };

      // Apply sort based on filter options
      switch (filterOptions.sortBy) {
        case 'dateAsc':
          params.sort = 'appointmentDateTime'; // Ascending (oldest first)
          break;
        case 'dateDesc':
        default:
          params.sort = '-appointmentDateTime'; // Descending (most recent first)
          break;
      }

      // Add search query if provided
      if (searchQuery && searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      // Add payment method filter if not 'all'
      // The API will filter bookings by the selected payment method
      if (filterOptions.paymentMethod && filterOptions.paymentMethod !== 'all') {
        params.paymentMethod = filterOptions.paymentMethod;
      }

      // Handle status filter
      if (status && status !== 'all') {
        // Specific status
        params.status = status;
      }

      const response = await apiClient.get('/bookings', { params });

      if (response.data.success) {
        let newBookings = response.data.data || [];

        // Frontend safety filter: Ensure payment method filter is applied correctly
        // If backend doesn't filter properly, we filter client-side
        if (filterOptions.paymentMethod && filterOptions.paymentMethod !== 'all') {
          const beforeFilterCount = newBookings.length;
          newBookings = newBookings.filter(booking =>
            booking.paymentMethod === filterOptions.paymentMethod
          );

          // Frontend safety filter applied if backend filtering removed bookings
          if (beforeFilterCount !== newBookings.length) {
            // Payment filter applied client-side
          }
        }

        // Frontend sorting: Multi-level sorting with reschedule awareness
        const now = Date.now();

        newBookings.sort((a, b) => {
          // CRITICAL PRIORITY: Pending reschedule requests
          const aHasPendingEdit = a.editRequest?.approvalStatus === 'pending';
          const bHasPendingEdit = b.editRequest?.approvalStatus === 'pending';

          if (aHasPendingEdit && !bHasPendingEdit) return -1;
          if (!aHasPendingEdit && bHasPendingEdit) return 1;

          // PRIMARY SORT: Closeness to current date (by default)
          if (filterOptions.sortBy === 'dateDesc' || filterOptions.sortBy === 'dateAsc') {
            const dateA = new Date(a.appointmentDateTime).getTime();
            const dateB = new Date(b.appointmentDateTime).getTime();

            if (filterOptions.sortBy === 'dateDesc') {
              return dateB - dateA; // Newest first
            } else {
              // For dateAsc, show appointments closest to today first
              const distanceA = Math.abs(dateA - now);
              const distanceB = Math.abs(dateB - now);
              return distanceA - distanceB;
            }
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

          // Default: by appointment date ascending
          const defaultDateA = new Date(a.appointmentDateTime).getTime();
          const defaultDateB = new Date(b.appointmentDateTime).getTime();
          return defaultDateA - defaultDateB;
        });

        // Bookings loaded and sorted

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
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load bookings';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [selectedStatus, pagination.limit, filterOptions]);

  // Initial fetch
  useEffect(() => {
    fetchBookings();
  }, []);

  // Fetch service images for all bookings
  useEffect(() => {
    if (bookings && bookings.length > 0) {
      bookings.forEach(booking => {
        if (booking.serviceId?._id && !serviceImageCache[booking.serviceId._id]) {
          fetchServiceImage(booking.serviceId._id);
        }
      });
    }
  }, [bookings, fetchServiceImage, serviceImageCache]);

  // Show modal if profile is incomplete
  useEffect(() => {
    if (!isProfileComplete) {
      setShowProfileIncompleteModal(true);
    }
  }, [isProfileComplete]);

  // Debounced search effect - includes filter options for consistent results
  useEffect(() => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchText.trim().length >= 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        // Search results respect payment method and sort filters
        fetchBookings(1, selectedStatus, false, false, searchText.trim());
        setIsSearching(false);
      }, 300);
    } else if (searchText.trim().length === 0) {
      // Reset to show all bookings when search is cleared
      fetchBookings(1, selectedStatus, false, false, '');
      setIsSearching(false);
    }

    return () => {
      // Cleanup: cancel pending requests and clear timeout
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchText, selectedStatus, filterOptions]);

  // Sync filter changes with fetch
  useEffect(() => {
    // When filter options change (not during initial state setup), fetch with new filters
    if (showFilterModal === false && (filterOptions.sortBy !== 'dateDesc' || filterOptions.paymentMethod !== 'all')) {
      // Filter has been applied, fetch with current filters
      fetchBookings(1, selectedStatus, false, false, searchText);
    }
  }, [filterOptions]);

  // Handle refresh
  const handleRefresh = () => {
    fetchBookings(1, selectedStatus, true);
  };

  // Handle status filter change
  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    // Reset sorting to default when changing status to avoid conflicts
    setFilterOptions({
      sortBy: 'dateDesc',
      paymentMethod: filterOptions.paymentMethod,
    });
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

  // Get service image based on cache or category fallback
  const getServiceImage = (serviceId) => {
    if (!serviceId) {
      return require('@assets/images/service_icon/10.png');
    }

    const category = serviceId?.category?.toLowerCase();

    // Priority 1: Check cached image from separate service API call
    if (serviceId?._id && serviceImageCache[serviceId._id]) {
      const cachedImageUrl = serviceImageCache[serviceId._id];
      if (cachedImageUrl) {
        return { uri: cachedImageUrl };
      }
    }

    // Priority 2: Check if service has images array (from backend)
    if (serviceId?.images && Array.isArray(serviceId.images) && serviceId.images.length > 0) {
      const primaryImage = serviceId.images.find(img => img.isPrimary) || serviceId.images[0];
      if (primaryImage?.url) {
        return { uri: primaryImage.url };
      }
    }

    // Priority 3: Check for direct imageUrl property from booking API
    if (serviceId?.imageUrl && typeof serviceId.imageUrl === 'string' && serviceId.imageUrl.length > 0) {
      return { uri: serviceId.imageUrl };
    }

    // Priority 4: Category-based fallback icon
    switch (category) {
      case 'veterinary':
        return require('@assets/images/service_icon/10.png');
      case 'grooming':
        return require('@assets/images/service_icon/11.png');
      case 'boarding':
        return require('@assets/images/service_icon/12.png');
      case 'daycare':
        return require('@assets/images/service_icon/13.png');
      case 'training':
        return require('@assets/images/service_icon/10.png');
      case 'emergency':
        return require('@assets/images/service_icon/11.png');
      case 'consultation':
        return require('@assets/images/service_icon/12.png');
      case 'other':
        return require('@assets/images/service_icon/13.png');
      default:
        return require('@assets/images/service_icon/10.png');
    }
  };

  // Get background color based on service category
  const getServiceColor = (serviceId) => {
    const category = serviceId?.category?.toLowerCase();
    switch (category) {
      case 'veterinary':
        return '#FF6B6B';
      case 'grooming':
        return '#4ECDC4';
      case 'boarding':
        return '#95E1D3';
      case 'daycare':
        return '#FFD93D';
      case 'training':
        return '#6C5CE7';
      case 'emergency':
        return '#FF6348';
      case 'consultation':
        return '#74B9FF';
      case 'other':
        return '#A29BFE';
      default:
        return '#1C86FF';
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

  // Handle filter modal open
  const handleOpenFilterModal = () => {
    setTempFilterOptions(filterOptions);
    setShowFilterModal(true);
  };

  // Handle filter apply
  const handleApplyFilter = () => {
    setFilterOptions(tempFilterOptions);
    setShowFilterModal(false);
    // Fetch will be triggered by the useEffect watching filterOptions
  };

  // Handle filter reset
  const handleResetFilter = () => {
    const defaultOptions = {
      sortBy: 'dateDesc',
      paymentMethod: 'all',
    };
    setTempFilterOptions(defaultOptions);
    setFilterOptions(defaultOptions);
    setShowFilterModal(false);
    // Fetch will be triggered by the useEffect watching filterOptions
  };

  // Check if filters are active
  const hasActiveFilters = () => {
    return filterOptions.sortBy !== 'dateDesc' || filterOptions.paymentMethod !== 'all';
  };

  // Render filter modal
  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setShowFilterModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowFilterModal(false)}
      >
        <View style={styles.filterModalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter & Sort</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
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
                { value: 'dateDesc', label: 'Date - Newest First', icon: 'arrow-down' },
                { value: 'dateAsc', label: 'Date - Oldest First', icon: 'arrow-up' },
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
    </Modal>
  );

  const renderScheduleItem = ({ item }) => {
    // Check reschedule status
    const hasPendingReschedule = item.editRequest?.approvalStatus === 'pending';
    const isRescheduleRejected = item.editRequest?.approvalStatus === 'rejected';
    const isRescheduled = item.editRequest?.approvalStatus === 'approved';

    // Check if service has actual image or fallback icon
    const serviceImage = getServiceImage(item.serviceId);
    const isActualImage = serviceImage && serviceImage.uri;

    return (
      <TouchableOpacity
        style={[
          styles.scheduleItem,
          hasPendingReschedule && styles.scheduleItemPendingReschedule
        ]}
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
        {/* Service Image inside colored circle */}
        <View style={[styles.circlePlaceholder, { backgroundColor: getServiceColor(item.serviceId) }]}>
          <Image
            source={serviceImage}
            style={isActualImage ? styles.serviceIconImage : styles.serviceIconPlaceholder}
            resizeMode="cover"
          />
        </View>

        {/* Details */}
        <View style={styles.scheduleDetails}>
          <View style={styles.titleRow}>
            <Text style={styles.scheduleTitle}>{item.serviceId?.name || 'Service'}</Text>
            {hasPendingReschedule && (
              <View style={styles.pendingBadge}>
                <Ionicons name="time-outline" size={moderateScale(12)} color="#FF9B79" />
                <Text style={styles.pendingBadgeText}>Pending</Text>
              </View>
            )}
            {isRescheduleRejected && (
              <View style={styles.rejectedBadge}>
                <Ionicons name="close-circle" size={moderateScale(12)} color="#FF6B6B" />
                <Text style={styles.rejectedBadgeText}>Rejected</Text>
              </View>
            )}
            {isRescheduled && (
              <View style={styles.approvedBadge}>
                <Ionicons name="checkmark-circle" size={moderateScale(12)} color="#4CAF50" />
                <Text style={styles.approvedBadgeText}>Rescheduled</Text>
              </View>
            )}
          </View>
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
  };

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText} numberOfLines={1}>
        Appointments
      </Text>
    </View>
  );

  // Status filter chips - aligned with backend booking statuses
  const statusFilters = [
    { value: 'all', label: 'All', icon: 'list-outline' },
    { value: 'pending', label: 'Pending', icon: 'hourglass-outline' },
    { value: 'confirmed', label: 'Confirmed', icon: 'checkmark-circle-outline' },
    { value: 'in-progress', label: 'In Progress', icon: 'play-circle-outline' },
    { value: 'completed', label: 'Completed', icon: 'checkmark-done-outline' },
    { value: 'cancelled', label: 'Cancelled', icon: 'close-circle-outline' },
    { value: 'no-show', label: 'No-Show', icon: 'alert-circle-outline' },
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
    } else if (selectedStatus === 'pending') {
      message = 'You have no pending appointments';
    } else if (selectedStatus === 'confirmed') {
      message = 'You have no confirmed appointments';
    } else if (selectedStatus === 'in-progress') {
      message = 'You have no in-progress appointments';
    } else if (selectedStatus === 'completed') {
      message = 'You have no completed appointments';
    } else if (selectedStatus === 'cancelled') {
      message = 'You have no cancelled appointments';
    } else if (selectedStatus === 'no-show') {
      message = 'You have no no-show appointments';
    } else if (selectedStatus !== 'all') {
      message = `You don't have any ${selectedStatus} appointments`;
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={moderateScale(64)} color="#ccc" />
        <Text style={styles.emptyTitle}>No appointments found</Text>
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
        showBack={true}
        onBackPress={() => router.push('/(user)/(tabs)/home')}
      />

      {/* Search Bar and Filter Button */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={moderateScale(20)} color="#C7C7CC" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by service, business, or pet"
            placeholderTextColor="#C7C7CC"
            value={searchText}
            onChangeText={setSearchText}
          />
          {isSearching && (
            <ActivityIndicator size="small" color="#1C86FF" style={styles.searchLoader} />
          )}
          {searchText.length > 0 && !isSearching && (
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
            name={hasActiveFilters() ? "filter" : "filter"}
            size={moderateScale(20)}
            color={hasActiveFilters() ? "#fff" : "#fff"}
          />
          {hasActiveFilters() && <View style={styles.filterBadge} />}
        </TouchableOpacity>
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
          data={bookings}
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

      {/* Filter Modal */}
      {renderFilterModal()}

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
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp(4),
    marginVertical: moderateScale(15),
    gap: moderateScale(10),
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
  searchLoader: {
    marginRight: moderateScale(8),
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
  scheduleItemPendingReschedule: {
    borderWidth: 2,
    borderColor: '#FF9B79',
    backgroundColor: '#FFF9F5',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginBottom: moderateScale(2),
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(8),
    gap: moderateScale(4),
    borderWidth: 1,
    borderColor: '#FF9B79',
  },
  pendingBadgeText: {
    fontSize: scaleFontSize(10),
    fontWeight: '600',
    color: '#FF9B79',
  },
  rejectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(8),
    gap: moderateScale(4),
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  rejectedBadgeText: {
    fontSize: scaleFontSize(10),
    fontWeight: '600',
    color: '#FF6B6B',
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(8),
    gap: moderateScale(4),
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  approvedBadgeText: {
    fontSize: scaleFontSize(10),
    fontWeight: '600',
    color: '#4CAF50',
  },
  circlePlaceholder: {
    width: hp(9),
    height: hp(9),
    borderRadius: hp(4.5),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(15),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    overflow: 'hidden',
  },
  serviceIconImage: {
    width: '100%',
    height: '100%',
    borderRadius: hp(4.5),
  },
  serviceIconPlaceholder: {
    width: '65%',
    height: '65%',
    borderRadius: hp(4.5),
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
  // Filter button in search bar
  filterButton: {
    width: hp(6),
    height: hp(6),
    borderRadius: moderateScale(10),
    backgroundColor: '#1C86FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Filter button badge
  filterButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    backgroundColor: '#FF6B6B',
  },
  // Filter modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(6),
  },
  filterModalContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    maxHeight: '75%',
    width: '100%',
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: '600',
    color: '#333',
  },
  filterContent: {
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(16),
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
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(8),
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterCheckbox: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(4),
    borderWidth: 2,
    borderColor: '#1C86FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  optionIcon: {
    marginRight: moderateScale(8),
  },
  filterOptionText: {
    fontSize: scaleFontSize(14),
    color: '#333',
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(16),
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: moderateScale(12),
    backgroundColor: '#fff',
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(10),
    gap: moderateScale(8),
  },
  resetButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1C86FF',
  },
  applyButton: {
    backgroundColor: '#1C86FF',
    borderWidth: 0,
  },
  resetButtonText: {
    color: '#1C86FF',
    fontSize: scaleFontSize(14),
    fontWeight: '600',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(14),
    fontWeight: '600',
  },
});

export default Bookings;
