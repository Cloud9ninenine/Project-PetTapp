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
import { isBusinessOpen } from "@utils/businessHelpers";

export default function ServicesScreen() {
  const params = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(params.category || 'all');
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
    { id: 'emergency', name: 'Emergency', icon: 'alert-circle' },
    { id: 'consultation', name: 'Consultation', icon: 'chatbubble' },
    { id: 'other', name: 'Other', icon: 'ellipsis-horizontal' },
  ];

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText} numberOfLines={1}>
        Pet Services
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
    if (params.category && params.category !== selectedCategory) {
      setSelectedCategory(params.category);
    }
  }, [params.category]);

  // Fetch services
  const fetchServices = async (pageNum = 1, append = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = {
        page: pageNum,
        limit: 10,
      };

      // Add search query
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      // Add category filter
      if (selectedCategory && selectedCategory !== 'all') {
        params.category = selectedCategory;
      }

      // Add location parameters
      if (useLocation && location) {
        params.latitude = location.latitude;
        params.longitude = location.longitude;
        params.radius = 10; // 10km radius
      }

      const response = await apiClient.get('/services', { params });

      if (response.data.success) {
        const newServices = response.data.data || [];
        if (append) {
          setServices(prev => [...prev, ...newServices]);
        } else {
          setServices(newServices);
        }

        // Check if there are more pages
        const { pagination } = response.data;
        setHasMore(pagination && pageNum < pagination.pages);
      } else {
        Alert.alert('Error', 'Failed to fetch services');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch services');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchServices(1, false);
  }, [selectedCategory, useLocation]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) {
        setPage(1);
        fetchServices(1, false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchServices(1, false);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchServices(nextPage, true);
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

  const handleServicePress = (service) => {
    // Check if profile is complete before allowing access
    if (!isProfileComplete) {
      setShowProfileIncompleteModal(true);
      return;
    }
    
    // Navigate to service details page
    router.push({
      pathname: '/(user)/(tabs)/home/service-details',
      params: {
        id: service._id,
        name: service.name,
        category: service.category,
        serviceType: service.category,
      }
    });
  };


  const renderServiceCard = ({ item }) => (
    <TouchableOpacity
      style={styles.serviceCard}
      activeOpacity={0.8}
      onPress={() => handleServicePress(item)}
    >
      <View style={styles.serviceImageContainer}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.serviceImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.serviceImage, styles.placeholderImage]}>
            <Ionicons name="paw" size={moderateScale(40)} color="#ccc" />
          </View>
        )}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>
            {item.category?.charAt(0).toUpperCase() + item.category?.slice(1)}
          </Text>
        </View>
        {item.businessId?.businessHours && (() => {
          const { isOpen, status } = isBusinessOpen(item.businessId.businessHours);
          return (
            <View style={[styles.serviceStatusBadge, isOpen ? styles.serviceStatusOpen : styles.serviceStatusClosed]}>
              <View style={styles.serviceStatusDot} />
              <Text style={styles.serviceStatusText}>{status}</Text>
            </View>
          );
        })()}
      </View>

      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName} numberOfLines={1}>
          {item.name}
        </Text>

        {item.businessId && (
          <View style={styles.businessInfo}>
            <Ionicons name="business" size={moderateScale(14)} color="#666" />
            <Text style={styles.businessName} numberOfLines={1}>
              {item.businessId.name || 'Business'}
            </Text>
          </View>
        )}

        <Text style={styles.serviceDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.serviceFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>From </Text>
            <Text style={styles.priceValue}>
              ₱{typeof item.price === 'object' ? (item.price?.amount || 0) : (item.price || 0)}
            </Text>
          </View>

          {item.duration && (
            <View style={styles.durationContainer}>
              <Ionicons name="time" size={moderateScale(14)} color="#666" />
              <Text style={styles.durationText}>{item.duration} min</Text>
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
        showBack={false}
      />

      {/* Search Bar with Location Toggle */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={moderateScale(20)} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
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

      {/* Services List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1C86FF" />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      ) : services.length > 0 ? (
        <FlatList
          data={services}
          renderItem={renderServiceCard}
          keyExtractor={item => item._id}
          style={styles.servicesList}
          contentContainerStyle={styles.servicesListContent}
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
          <Ionicons name="paw-outline" size={moderateScale(64)} color="#ccc" />
          <Text style={styles.emptyTitle}>No services found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? 'Try adjusting your search or filters'
              : 'Check back later for available services'}
          </Text>
        </ScrollView>
      )}

      {/* Profile Incomplete Modal */}
      <CompleteProfileModal
        visible={showProfileIncompleteModal}
        onClose={() => setShowProfileIncompleteModal(false)}
        message="Please complete your profile information before booking services. You need to provide your first name, last name, address, and contact number."
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
  servicesList: {
    flex: 1,
  },
  servicesListContent: {
    paddingHorizontal: wp(4),
    paddingBottom: moderateScale(20),
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    marginBottom: moderateScale(16),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  serviceImageContainer: {
    position: 'relative',
    width: '100%',
    height: hp(22),
    backgroundColor: '#f8f9fa',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    top: moderateScale(10),
    right: moderateScale(10),
    backgroundColor: 'rgba(255, 155, 121, 0.95)',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: scaleFontSize(12),
    fontWeight: '600',
  },
  serviceStatusBadge: {
    position: 'absolute',
    bottom: moderateScale(10),
    left: moderateScale(10),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(12),
    gap: moderateScale(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  serviceStatusOpen: {
    backgroundColor: 'rgba(76, 175, 80, 0.95)',
  },
  serviceStatusClosed: {
    backgroundColor: 'rgba(244, 67, 54, 0.95)',
  },
  serviceStatusDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: '#fff',
  },
  serviceStatusText: {
    color: '#fff',
    fontSize: scaleFontSize(11),
    fontWeight: '600',
  },
  serviceInfo: {
    padding: moderateScale(16),
  },
  serviceName: {
    fontSize: scaleFontSize(18),
    fontWeight: '700',
    color: '#333',
    marginBottom: moderateScale(6),
  },
  businessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(8),
    gap: moderateScale(4),
  },
  businessName: {
    fontSize: scaleFontSize(14),
    color: '#666',
    flex: 1,
  },
  serviceDescription: {
    fontSize: scaleFontSize(14),
    color: '#666',
    marginBottom: moderateScale(12),
    lineHeight: scaleFontSize(20),
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: scaleFontSize(14),
    color: '#666',
  },
  priceValue: {
    fontSize: scaleFontSize(18),
    fontWeight: '700',
    color: '#1C86FF',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
  },
  durationText: {
    fontSize: scaleFontSize(14),
    color: '#666',
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
