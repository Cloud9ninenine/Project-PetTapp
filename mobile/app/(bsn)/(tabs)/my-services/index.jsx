import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  Alert,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Image,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Header from "@components/Header";
import AddServiceModal from './AddServiceModal';
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from '@config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MyServicesListSkeleton } from '@components/SkeletonLoader';

export default function MyServicesScreen() {
  const router = useRouter();
  const [services, setServices] = useState([]);

  const handleBackPress = () => {
    router.push('/(bsn)/(tabs)/home');
  };
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [businessId, setBusinessId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Category filters with icons (will be populated from API)
  const categoryIcons = {
    veterinary: 'medical-outline',
    grooming: 'cut-outline',
    boarding: 'home-outline',
    daycare: 'sunny-outline',
    training: 'school-outline',
    emergency: 'alert-circle-outline',
    consultation: 'chatbubbles-outline',
    other: 'ellipsis-horizontal-outline',
  };

  useEffect(() => {
    fetchBusinessId();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (businessId) {
      fetchServices(1, selectedCategory);
    }
  }, [businessId, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/services/categories');
      if (response.data.success && response.data.data) {
        const cats = [
          { value: 'all', label: 'All', icon: 'list-outline' },
          ...response.data.data.map(cat => ({
            value: cat,
            label: cat.charAt(0).toUpperCase() + cat.slice(1),
            icon: categoryIcons[cat] || 'ellipsis-horizontal-outline'
          }))
        ];
        setCategories(cats);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to hardcoded categories
      setCategories([
        { value: 'all', label: 'All', icon: 'list-outline' },
        { value: 'veterinary', label: 'Veterinary', icon: 'medical-outline' },
        { value: 'grooming', label: 'Grooming', icon: 'cut-outline' },
        { value: 'boarding', label: 'Boarding', icon: 'home-outline' },
        { value: 'daycare', label: 'Daycare', icon: 'sunny-outline' },
        { value: 'training', label: 'Training', icon: 'school-outline' },
        { value: 'emergency', label: 'Emergency', icon: 'alert-circle-outline' },
        { value: 'consultation', label: 'Consultation', icon: 'chatbubbles-outline' },
        { value: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
      ]);
    }
  };

  const fetchBusinessId = async () => {
    try {
      const storedBusinessId = await AsyncStorage.getItem('businessId');
      if (storedBusinessId) {
        setBusinessId(storedBusinessId);
      } else {
        // Try to fetch from API
        try {
          const response = await apiClient.get('/businesses');
          if (response.data && response.data.data && response.data.data.length > 0) {
            const business = response.data.data[0];
            await AsyncStorage.setItem('businessId', business._id);
            setBusinessId(business._id);
          } else {
            setLoading(false);
            Alert.alert(
              'Business Profile Required',
              'Please complete your business profile to manage services.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Go to Profile',
                  onPress: () => router.push('/(bsn)/(tabs)/profile')
                }
              ]
            );
          }
        } catch (apiError) {
          console.error('Error fetching business from API:', apiError);
          setLoading(false);
          Alert.alert(
            'Business Profile Required',
            'Please complete your business profile to manage services.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Go to Profile',
                onPress: () => router.push('/(bsn)/(tabs)/profile')
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error fetching business ID:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load business information');
    }
  };

  const fetchServices = useCallback(async (page = 1, category = selectedCategory, isRefresh = false, isLoadMore = false) => {
    if (!businessId) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params = {
        businessId,
        page,
        limit: pagination.limit,
      };

      if (category && category !== 'all') {
        params.category = category;
      }

      if (searchText.trim()) {
        params.search = searchText.trim();
      }

      const response = await apiClient.get('/services', { params });

      if (response.data.success) {
        const newServices = response.data.data || [];

        if (isLoadMore && page > 1) {
          setServices(prev => [...prev, ...newServices]);
        } else {
          setServices(newServices);
        }

        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load services');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [businessId, selectedCategory, searchText, pagination.limit]);

  const handleRefresh = () => {
    fetchServices(1, selectedCategory, true);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && pagination.page < pagination.pages) {
      const nextPage = pagination.page + 1;
      fetchServices(nextPage, selectedCategory, false, true);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setShowCategoryDropdown(false);
  };

  const getSelectedCategoryData = () => {
    return categories.find(c => c.value === selectedCategory);
  };

  const handleSearch = () => {
    fetchServices(1, selectedCategory);
  };

  const handleAddService = async (serviceData, serviceId = null) => {
    try {
      if (serviceId) {
        // Update existing service
        await apiClient.put(`/services/${serviceId}`, serviceData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        Alert.alert('Success', 'Service updated successfully');
      } else {
        // Create new service
        await apiClient.post('/services', serviceData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        Alert.alert('Success', 'Service created successfully');
      }

      setShowAddModal(false);
      fetchServices(1, selectedCategory);
    } catch (error) {
      console.error('Error saving service:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save service');
      throw error; // Re-throw to let modal handle it
    }
  };

  const handleViewService = (service) => {
    router.push({
      pathname: '/my-services/ServiceDetails',
      params: { serviceId: service._id }
    });
  };

  const toggleAvailability = async (service) => {
    try {
      const formData = new FormData();
      formData.append('isActive', (!service.isActive).toString());

      await apiClient.put(`/services/${service._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update local state
      setServices(services.map(s =>
        s._id === service._id ? { ...s, isActive: !s.isActive } : s
      ));
    } catch (error) {
      console.error('Error toggling availability:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update service availability');
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
  };

  const formatPrice = (price) => {
    if (!price || !price.amount) return 'N/A';
    return `${price.currency || 'PHP'} ${price.amount.toFixed(2)}`;
  };

  const getCategoryIcon = (category) => {
    const cat = categories.find(c => c.value === category?.toLowerCase());
    return cat?.icon || 'star-outline';
  };

  const getCategoryColor = (category) => {
    const colors = {
      veterinary: '#4CAF50',
      grooming: '#2196F3',
      boarding: '#FF9B79',
      daycare: '#FFD700',
      training: '#9C27B0',
      emergency: '#FF6B6B',
      consultation: '#00BCD4',
      other: '#607D8B',
    };
    return colors[category?.toLowerCase()] || '#1C86FF';
  };

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText}>My Services</Text>
    </View>
  );

  const renderCategoryDropdown = () => (
    <Modal
      visible={showCategoryDropdown}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowCategoryDropdown(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setShowCategoryDropdown(false)}
      >
        <View style={styles.dropdownModal}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle}>Filter by Category</Text>
            <TouchableOpacity onPress={() => setShowCategoryDropdown(false)}>
              <Ionicons name="close" size={moderateScale(24)} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.dropdownList}>
            {categories.map((item) => (
              <Pressable
                key={item.value}
                style={({ pressed }) => [
                  styles.dropdownItem,
                  selectedCategory === item.value && styles.dropdownItemSelected,
                  pressed && styles.dropdownItemPressed,
                ]}
                onPress={() => handleCategoryChange(item.value)}
              >
                <View style={[
                  styles.categoryIconContainer,
                  { backgroundColor: getCategoryColor(item.value) }
                ]}>
                  <Ionicons
                    name={item.icon}
                    size={moderateScale(20)}
                    color="#fff"
                  />
                </View>
                <Text style={[
                  styles.dropdownItemText,
                  selectedCategory === item.value && styles.dropdownItemTextSelected
                ]}>
                  {item.label}
                </Text>
                {selectedCategory === item.value && (
                  <Ionicons name="checkmark-circle" size={moderateScale(22)} color="#1C86FF" />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );

  const renderServiceItem = ({ item }) => (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => handleViewService(item)}
      activeOpacity={0.7}
    >
      <View style={styles.serviceHeader}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.serviceImage}
          />
        ) : (
          <View style={[styles.serviceIconContainer, { backgroundColor: getCategoryColor(item.category) }]}>
            <Ionicons name={getCategoryIcon(item.category)} size={moderateScale(24)} color="#fff" />
          </View>
        )}

        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.serviceCategory}>{item.category}</Text>
          <View style={styles.serviceDetails}>
            <Text style={styles.servicePrice}>{formatPrice(item.price)}</Text>
            <Text style={styles.serviceDuration}> • {item.duration} min</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.availabilityToggle,
            item.isActive ? styles.availableToggle : styles.unavailableToggle
          ]}
          onPress={(e) => {
            e.stopPropagation();
            toggleAvailability(item);
          }}
        >
          <Text style={styles.toggleText}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </TouchableOpacity>
      </View>

      {item.description && (
        <Text style={styles.serviceDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
    </TouchableOpacity>
  );

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

  const renderEmptyState = () => {
    let message = 'Start adding services for your business';

    if (searchText) {
      message = 'No services match your search';
    } else if (selectedCategory !== 'all') {
      message = `No ${selectedCategory} services yet`;
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="briefcase-outline" size={moderateScale(80)} color="#ccc" />
        <Text style={styles.emptyTitle}>No Services Found</Text>
        <Text style={styles.emptySubtitle}>{message}</Text>
        <TouchableOpacity
          style={styles.emptyAddButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add-circle" size={moderateScale(24)} color="#1C86FF" />
          <Text style={styles.emptyAddButtonText}>Add Your First Service</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
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
        <MyServicesListSkeleton />
      </SafeAreaView>
    );
  }

  // Show message if no business profile
  if (!businessId) {
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
        <View style={styles.emptyContainer}>
          <Ionicons name="business-outline" size={moderateScale(80)} color="#ccc" />
          <Text style={styles.emptyTitle}>Business Profile Required</Text>
          <Text style={styles.emptySubtitle}>
            Please complete your business profile to start managing your services
          </Text>
          <TouchableOpacity
            style={styles.emptyAddButton}
            onPress={() => router.push('/(bsn)/(tabs)/profile')}
          >
            <Ionicons name="storefront" size={moderateScale(24)} color="#1C86FF" />
            <Text style={styles.emptyAddButtonText}>Go to Business Profile</Text>
          </TouchableOpacity>
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
      <Header
        backgroundColor="#1C86FF"
        titleColor="#fff"
        customTitle={renderTitle()}
        showBack={true}
        onBackPress={handleBackPress}
      />

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{pagination.total || 0}</Text>
          <Text style={styles.statLabel}>Total Services</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{services.filter(s => s.isActive).length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>

      {/* Search Bar and Filter */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={moderateScale(20)} color="#C7C7CC" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
            placeholderTextColor="#C7C7CC"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchText !== '' && (
            <TouchableOpacity onPress={() => {
              setSearchText('');
              fetchServices(1, selectedCategory);
            }}>
              <Ionicons name="close-circle" size={moderateScale(20)} color="#C7C7CC" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Button */}
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedCategory !== 'all' && styles.filterButtonActive
          ]}
          onPress={() => setShowCategoryDropdown(true)}
        >
          <Ionicons
            name="filter"
            size={moderateScale(20)}
            color={selectedCategory !== 'all' ? '#fff' : '#1C86FF'}
          />
          {selectedCategory !== 'all' && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>1</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active Filter Tag */}
      {selectedCategory !== 'all' && (
        <View style={styles.activeFilterContainer}>
          <View style={styles.activeFilterTag}>
            <Ionicons
              name={getSelectedCategoryData()?.icon || 'pricetag'}
              size={moderateScale(14)}
              color="#1C86FF"
            />
            <Text style={styles.activeFilterText}>
              {getSelectedCategoryData()?.label || selectedCategory}
            </Text>
            <TouchableOpacity
              onPress={() => handleCategoryChange('all')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={moderateScale(16)} color="#1C86FF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Category Dropdown Modal */}
      {renderCategoryDropdown()}

      {/* Services List */}
      <FlatList
        data={services}
        renderItem={renderServiceItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          services.length === 0 && styles.emptyListContent
        ]}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderLoadMoreButton}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#1C86FF']}
            tintColor="#1C86FF"
          />
        }
      />

      {/* Floating Add Button */}
      {services.length > 0 && (
        <TouchableOpacity
          style={styles.floatingAddButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={moderateScale(32)} color="#fff" />
        </TouchableOpacity>
      )}

      <AddServiceModal
        visible={showAddModal}
        onClose={handleCloseModal}
        onAddService={handleAddService}
        editingService={null}
        businessId={businessId}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  statsContainer: {
    flexDirection: 'row',
    gap: moderateScale(12),
    marginHorizontal: wp(5),
    marginTop: moderateScale(15),
    marginBottom: moderateScale(15),
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: scaleFontSize(28),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(4),
  },
  statLabel: {
    fontSize: scaleFontSize(12),
    color: '#666',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp(5),
    marginBottom: moderateScale(12),
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
    fontSize: scaleFontSize(14),
    paddingVertical: moderateScale(10),
    color: '#333',
  },
  filterButton: {
    width: hp(6),
    height: hp(6),
    borderRadius: moderateScale(10),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1C86FF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#1C86FF',
  },
  filterBadge: {
    position: 'absolute',
    top: moderateScale(-4),
    right: moderateScale(-4),
    backgroundColor: '#FF6B6B',
    borderRadius: moderateScale(10),
    width: moderateScale(18),
    height: moderateScale(18),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  filterBadgeText: {
    fontSize: scaleFontSize(10),
    color: '#fff',
    fontWeight: 'bold',
  },
  activeFilterContainer: {
    marginHorizontal: wp(5),
    marginBottom: moderateScale(12),
  },
  activeFilterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E3F2FD',
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    gap: moderateScale(6),
  },
  activeFilterText: {
    fontSize: scaleFontSize(13),
    color: '#1C86FF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(5),
  },
  dropdownModal: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    width: '100%',
    maxWidth: moderateScale(400),
    maxHeight: hp(70),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#1C86FF',
  },
  dropdownList: {
    maxHeight: hp(50),
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: moderateScale(12),
  },
  dropdownItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  dropdownItemPressed: {
    backgroundColor: '#F5F5F5',
  },
  categoryIconContainer: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownItemText: {
    flex: 1,
    fontSize: scaleFontSize(15),
    color: '#333',
    fontWeight: '500',
  },
  dropdownItemTextSelected: {
    color: '#1C86FF',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: wp(5),
    paddingBottom: moderateScale(100),
  },
  emptyListContent: {
    flexGrow: 1,
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    marginBottom: moderateScale(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  serviceImage: {
    width: moderateScale(55),
    height: moderateScale(55),
    borderRadius: moderateScale(10),
    marginRight: moderateScale(12),
  },
  serviceIconContainer: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(10),
  },
  serviceInfo: {
    flex: 1,
    marginRight: moderateScale(8),
  },
  serviceName: {
    fontSize: scaleFontSize(15),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: moderateScale(4),
  },
  serviceCategory: {
    fontSize: scaleFontSize(13),
    color: '#666',
    marginBottom: moderateScale(4),
    textTransform: 'capitalize',
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#1C86FF',
  },
  serviceDuration: {
    fontSize: scaleFontSize(12),
    color: '#999',
  },
  availabilityToggle: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(12),
    alignSelf: 'flex-start',
  },
  availableToggle: {
    backgroundColor: '#4CAF50',
  },
  unavailableToggle: {
    backgroundColor: '#FF6B6B',
  },
  toggleText: {
    fontSize: scaleFontSize(10),
    color: '#fff',
    fontWeight: '600',
  },
  serviceDescription: {
    fontSize: scaleFontSize(13),
    color: '#666',
    marginTop: moderateScale(12),
    lineHeight: scaleFontSize(19),
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
    paddingVertical: moderateScale(80),
  },
  emptyTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: '600',
    color: '#666',
    marginTop: moderateScale(20),
  },
  emptySubtitle: {
    fontSize: scaleFontSize(14),
    color: '#999',
    textAlign: 'center',
    marginTop: moderateScale(8),
    marginBottom: moderateScale(20),
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(12),
    borderWidth: 2,
    borderColor: '#1C86FF',
    backgroundColor: '#fff',
  },
  emptyAddButtonText: {
    fontSize: scaleFontSize(14),
    color: '#1C86FF',
    fontWeight: '600',
  },
  floatingAddButton: {
    position: 'absolute',
    right: wp(5),
    bottom: hp(3),
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    backgroundColor: '#1C86FF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#1C86FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
