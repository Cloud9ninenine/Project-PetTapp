import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ImageBackground,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import Header from '@components/Header';
import CompleteProfileModal from "@components/CompleteProfileModal";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from "../../../config/api";
import { useProfileCompletion } from "../../../_hooks/useProfileCompletion";

export default function BusinessesScreen() {
  const params = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(params.businessType || 'all');
  const [location, setLocation] = useState(null);
  const [useLocation, setUseLocation] = useState(false);
  const [showProfileIncompleteModal, setShowProfileIncompleteModal] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const router = useRouter();
  const { isProfileComplete } = useProfileCompletion();

  const categories = [
    { id: 'all', name: 'All', icon: 'apps' },
    { id: 'veterinary', name: 'Veterinary', icon: 'medical' },
    { id: 'grooming', name: 'Grooming', icon: 'cut' },
    { id: 'boarding', name: 'Boarding', icon: 'home' },
    { id: 'daycare', name: 'Daycare', icon: 'sunny' },
    { id: 'training', name: 'Training', icon: 'school' },
    { id: 'pet-shop', name: 'Pet Shop', icon: 'cart' },
    { id: 'other', name: 'Other', icon: 'ellipsis-horizontal' },
  ];

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText} numberOfLines={1}>
        Pet Businesses
      </Text>
    </View>
  );

  // Request location permission and get current location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const currentLocation = await Location.getCurrentPositionAsync({});
          setLocation({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          });
        }
      } catch (error) {
        console.error('Error getting location:', error);
      }
    })();
  }, []);

  // Show modal if profile is incomplete
  useEffect(() => {
    if (!isProfileComplete) {
      setShowProfileIncompleteModal(true);
    }
  }, [isProfileComplete]);

  // Handle category param from navigation
  useEffect(() => {
    if (params.businessType && params.businessType !== selectedCategory) {
      setSelectedCategory(params.businessType);
    }
  }, [params.businessType]);

  // Fetch businesses
  const fetchBusinesses = async (pageNum = 1, append = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = {
        page: pageNum,
        limit: 10,
        sort: '-averageRating',
      };

      // Add search query
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      // Add category filter
      if (selectedCategory && selectedCategory !== 'all') {
        params.businessType = selectedCategory;
      }

      // Add location parameters for nearby businesses
      if (useLocation && location) {
        params.latitude = location.latitude;
        params.longitude = location.longitude;
        params.radius = 10; // 10km radius
      }

      const response = await apiClient.get('/businesses', { params });

      if (response.data.success) {
        const newBusinesses = response.data.data || [];
        if (append) {
          setBusinesses(prev => [...prev, ...newBusinesses]);
        } else {
          setBusinesses(newBusinesses);
        }

        // Check if there are more pages
        const { pagination } = response.data;
        setHasMore(pagination && pageNum < pagination.pages);
      } else {
        Alert.alert('Error', 'Failed to fetch businesses');
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch businesses');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchBusinesses(1, false);
  }, [selectedCategory, useLocation]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) {
        setPage(1);
        fetchBusinesses(1, false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchBusinesses(1, false);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchBusinesses(nextPage, true);
    }
  };

  const handleCategoryPress = (categoryId) => {
    setSelectedCategory(categoryId);
    setPage(1);
  };

  const toggleLocation = () => {
    if (!location) {
      Alert.alert(
        'Location Required',
        'Please enable location permissions to use this feature',
        [{ text: 'OK' }]
      );
      return;
    }
    setUseLocation(!useLocation);
    setPage(1);
  };

  const handleBusinessPress = (business) => {
    // Check if profile is complete before allowing access
    if (!isProfileComplete) {
      setShowProfileIncompleteModal(true);
      return;
    }

    // Navigate to business details page
    router.push({
      pathname: '/(user)/(tabs)/home/business-details',
      params: {
        id: business._id,
      }
    });
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Ionicons key={i} name="star" size={moderateScale(14)} color="#FFD700" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Ionicons key={i} name="star-half" size={moderateScale(14)} color="#FFD700" />
        );
      } else {
        stars.push(
          <Ionicons key={i} name="star-outline" size={moderateScale(14)} color="#FFD700" />
        );
      }
    }
    return stars;
  };

  // Check if business is currently open
  const isBusinessOpen = (businessHours) => {
    if (!businessHours) return null;

    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = days[now.getDay()];
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes

    const todayHours = businessHours[currentDay];
    if (!todayHours || !todayHours.isOpen) {
      return false;
    }

    // Parse open and close times
    const [openHour, openMin] = todayHours.open.split(':').map(Number);
    const [closeHour, closeMin] = todayHours.close.split(':').map(Number);

    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    return currentTime >= openTime && currentTime <= closeTime;
  };

  const renderBusinessCard = ({ item }) => {
    const isOpen = isBusinessOpen(item.businessHours);

    return (
      <TouchableOpacity
        style={styles.businessCard}
        activeOpacity={0.8}
        onPress={() => handleBusinessPress(item)}
      >
        <View style={styles.businessImageContainer}>
          {item.images?.logo || item.logo ? (
            <Image
              source={{ uri: item.images?.logo || item.logo }}
              style={styles.businessImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.businessImage, styles.placeholderImage]}>
              <Ionicons name="business" size={moderateScale(40)} color="#ccc" />
            </View>
          )}
          {item.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#4CAF50" />
            </View>
          )}
          {isOpen !== null && (
            <View style={[styles.statusBadge, isOpen ? styles.openBadge : styles.closedBadge]}>
              <View style={[styles.statusDot, isOpen ? styles.openDot : styles.closedDot]} />
              <Text style={styles.statusText}>{isOpen ? 'Open' : 'Closed'}</Text>
            </View>
          )}
        </View>

      <View style={styles.businessInfo}>
        <Text style={styles.businessName} numberOfLines={1}>
          {item.businessName}
        </Text>

        <View style={styles.businessType}>
          <Ionicons name="pricetag" size={moderateScale(14)} color="#666" />
          <Text style={styles.businessTypeText} numberOfLines={1}>
            {item.businessType?.charAt(0).toUpperCase() + item.businessType?.slice(1)}
          </Text>
        </View>

        {item.description && (
          <Text style={styles.businessDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.businessFooter}>
          {item.averageRating > 0 && (
            <View style={styles.ratingContainer}>
              <View style={styles.starsRow}>
                {renderStars(item.averageRating)}
              </View>
              <Text style={styles.ratingText}>
                {item.averageRating?.toFixed(1)} ({item.totalReviews || 0})
              </Text>
            </View>
          )}
        </View>

        {item.distance && (
          <View style={styles.distanceContainer}>
            <Ionicons name="location" size={moderateScale(12)} color="#1C86FF" />
            <Text style={styles.distanceText}>{item.distance.toFixed(1)} km away</Text>
          </View>
        )}
      </View>
      </TouchableOpacity>
    );
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === item.id && styles.categoryChipActive,
      ]}
      onPress={() => handleCategoryPress(item.id)}
      activeOpacity={0.7}
    >
      <Ionicons
        name={item.icon}
        size={moderateScale(18)}
        color={selectedCategory === item.id ? '#fff' : '#1C86FF'}
      />
      <Text
        style={[
          styles.categoryChipText,
          selectedCategory === item.id && styles.categoryChipTextActive,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
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
        showBack={true}
      />

      {/* Search Bar with Location Toggle */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={moderateScale(20)} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search businesses..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={moderateScale(20)} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.locationButton, useLocation && styles.locationButtonActive]}
          onPress={toggleLocation}
          activeOpacity={0.7}
        >
          <Ionicons
            name={useLocation ? "location" : "location-outline"}
            size={moderateScale(24)}
            color={useLocation ? "#fff" : "#1C86FF"}
          />
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <View style={styles.categoriesSection}>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Businesses List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1C86FF" />
          <Text style={styles.loadingText}>Loading businesses...</Text>
        </View>
      ) : businesses.length > 0 ? (
        <FlatList
          data={businesses}
          renderItem={renderBusinessCard}
          keyExtractor={item => item._id}
          style={styles.businessesList}
          contentContainerStyle={styles.businessesListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1C86FF']} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() =>
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#1C86FF" />
              </View>
            ) : null
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.centerContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1C86FF']} />
          }
        >
          <Ionicons name="business-outline" size={moderateScale(64)} color="#ccc" />
          <Text style={styles.emptyTitle}>No businesses found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? 'Try adjusting your search or filters'
              : 'Check back later for available businesses'}
          </Text>
        </ScrollView>
      )}

      {/* Profile Incomplete Modal */}
      <CompleteProfileModal
        visible={showProfileIncompleteModal}
        onClose={() => setShowProfileIncompleteModal(false)}
        message="Please complete your profile information before viewing business details. You need to provide your first name, last name, address, and contact number."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp(4),
    marginTop: moderateScale(20),
    marginBottom: moderateScale(12),
    gap: moderateScale(10),
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: moderateScale(15),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#1C86FF',
    height: moderateScale(50),
  },
  searchIcon: {
    marginRight: moderateScale(8),
  },
  searchInput: {
    flex: 1,
    height: moderateScale(44),
    fontSize: scaleFontSize(16),
    color: '#333',
  },
  locationButton: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(12),
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1C86FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationButtonActive: {
    backgroundColor: '#1C86FF',
  },
  categoriesSection: {
    marginBottom: moderateScale(12),
  },
  categoriesList: {
    paddingHorizontal: wp(4),
    gap: moderateScale(8),
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: '#1C86FF',
    gap: moderateScale(6),
  },
  categoryChipActive: {
    backgroundColor: '#1C86FF',
  },
  categoryChipText: {
    fontSize: scaleFontSize(14),
    color: '#1C86FF',
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  businessesList: {
    flex: 1,
  },
  businessesListContent: {
    paddingHorizontal: wp(4),
    paddingBottom: moderateScale(20),
  },
  businessCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#1C86FF',
    marginBottom: moderateScale(16),
    overflow: 'hidden',
  },
  businessImageContainer: {
    position: 'relative',
    width: '100%',
    height: hp(20),
  },
  businessImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    top: moderateScale(10),
    right: moderateScale(10),
    backgroundColor: '#fff',
    borderRadius: moderateScale(15),
    padding: moderateScale(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  businessInfo: {
    padding: moderateScale(16),
  },
  businessName: {
    fontSize: scaleFontSize(18),
    fontWeight: '700',
    color: '#333',
    marginBottom: moderateScale(6),
  },
  businessType: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(8),
    gap: moderateScale(4),
  },
  businessTypeText: {
    fontSize: scaleFontSize(14),
    color: '#666',
    flex: 1,
  },
  businessDescription: {
    fontSize: scaleFontSize(14),
    color: '#666',
    marginBottom: moderateScale(12),
    lineHeight: scaleFontSize(20),
  },
  businessFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  starsRow: {
    flexDirection: 'row',
    gap: moderateScale(2),
  },
  ratingText: {
    fontSize: scaleFontSize(14),
    color: '#666',
    fontWeight: '600',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(8),
    gap: moderateScale(4),
  },
  distanceText: {
    fontSize: scaleFontSize(12),
    color: '#1C86FF',
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(10),
  },
  loadingText: {
    marginTop: moderateScale(12),
    fontSize: scaleFontSize(16),
    color: '#666',
  },
  emptyTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: '600',
    color: '#333',
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  emptySubtitle: {
    fontSize: scaleFontSize(14),
    color: '#999',
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: moderateScale(20),
    alignItems: 'center',
  },
});
