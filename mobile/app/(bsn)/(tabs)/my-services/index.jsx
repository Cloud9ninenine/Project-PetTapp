import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  Alert,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from "@components/Header";
import AddServiceModal from './AddServiceModal';
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from '@config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MyServicesScreen() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [businessId, setBusinessId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Category filters matching backend enum
  const categoryFilters = [
    { value: 'all', label: 'All', icon: 'list-outline' },
    { value: 'veterinary', label: 'Veterinary', icon: 'medical-outline' },
    { value: 'grooming', label: 'Grooming', icon: 'cut-outline' },
    { value: 'boarding', label: 'Boarding', icon: 'home-outline' },
    { value: 'daycare', label: 'Daycare', icon: 'sunny-outline' },
    { value: 'training', label: 'Training', icon: 'school-outline' },
    { value: 'emergency', label: 'Emergency', icon: 'alert-circle-outline' },
    { value: 'consultation', label: 'Consultation', icon: 'chatbubbles-outline' },
    { value: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
  ];

  useEffect(() => {
    fetchBusinessId();
  }, []);

  useEffect(() => {
    if (businessId) {
      fetchServices(1, selectedCategory);
    }
  }, [businessId, selectedCategory]);

  const fetchBusinessId = async () => {
    try {
      const storedBusinessId = await AsyncStorage.getItem('businessId');
      if (storedBusinessId) {
        setBusinessId(storedBusinessId);
      } else {
        Alert.alert('Error', 'Business ID not found. Please complete your business profile.');
      }
    } catch (error) {
      console.error('Error fetching business ID:', error);
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
  };

  const handleSearch = () => {
    fetchServices(1, selectedCategory);
  };

  const handleAddService = async (serviceData) => {
    try {
      if (editingService) {
        // Update existing service
        await apiClient.put(`/services/${editingService._id}`, serviceData, {
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
      setEditingService(null);
      fetchServices(1, selectedCategory);
    } catch (error) {
      console.error('Error saving service:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save service');
      throw error; // Re-throw to let modal handle it
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setShowAddModal(true);
  };

  const handleDeleteService = (service) => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${service.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/services/${service._id}`);
              Alert.alert('Success', 'Service deleted successfully');
              fetchServices(1, selectedCategory);
            } catch (error) {
              console.error('Error deleting service:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete service');
            }
          },
        },
      ]
    );
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
    setEditingService(null);
  };

  const formatPrice = (price) => {
    if (!price || !price.amount) return 'N/A';
    return `${price.currency || 'PHP'} ${price.amount.toFixed(2)}`;
  };

  const getCategoryIcon = (category) => {
    const cat = categoryFilters.find(c => c.value === category?.toLowerCase());
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

  const renderCategoryFilter = () => (
    <View style={styles.filterContainer}>
      <FlatList
        horizontal
        data={categoryFilters}
        keyExtractor={(item) => item.value}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedCategory === item.value && styles.filterChipActive
            ]}
            onPress={() => handleCategoryChange(item.value)}
          >
            <Ionicons
              name={item.icon}
              size={moderateScale(16)}
              color={selectedCategory === item.value ? '#fff' : '#1C86FF'}
              style={styles.filterChipIcon}
            />
            <Text style={[
              styles.filterChipText,
              selectedCategory === item.value && styles.filterChipTextActive
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.filterList}
      />
    </View>
  );

  const renderServiceItem = ({ item }) => (
    <View style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.serviceImage}
          />
        ) : (
          <View style={[styles.serviceIconContainer, { backgroundColor: getCategoryColor(item.category) }]}>
            <Ionicons name={getCategoryIcon(item.category)} size={moderateScale(28)} color="#fff" />
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

        <View style={styles.serviceActions}>
          <TouchableOpacity
            style={[
              styles.availabilityToggle,
              item.isActive ? styles.availableToggle : styles.unavailableToggle
            ]}
            onPress={() => toggleAvailability(item)}
          >
            <Text style={styles.toggleText}>
              {item.isActive ? 'Active' : 'Inactive'}
            </Text>
          </TouchableOpacity>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditService(item)}
            >
              <Ionicons name="create-outline" size={moderateScale(20)} color="#1C86FF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteService(item)}
            >
              <Ionicons name="trash-outline" size={moderateScale(20)} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {item.description && (
        <Text style={styles.serviceDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
    </View>
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
          showBack={false}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1C86FF" />
          <Text style={styles.loadingText}>Loading services...</Text>
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
        showBack={false}
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

      {/* Search Bar */}
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

      {/* Category Filter */}
      {renderCategoryFilter()}

      {/* Services List */}
      <FlatList
        data={services}
        renderItem={renderServiceItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
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
        editingService={editingService}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp(5),
    marginBottom: moderateScale(12),
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
  filterContainer: {
    marginBottom: moderateScale(15),
    paddingLeft: wp(5),
  },
  filterList: {
    paddingRight: wp(5),
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
  listContent: {
    paddingHorizontal: wp(5),
    paddingBottom: moderateScale(100),
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
    width: moderateScale(55),
    height: moderateScale(55),
    borderRadius: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: scaleFontSize(16),
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
  serviceActions: {
    alignItems: 'flex-end',
    gap: moderateScale(8),
  },
  availabilityToggle: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(12),
  },
  availableToggle: {
    backgroundColor: '#4CAF50',
  },
  unavailableToggle: {
    backgroundColor: '#FF6B6B',
  },
  toggleText: {
    fontSize: scaleFontSize(11),
    color: '#fff',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },
  editButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceDescription: {
    fontSize: scaleFontSize(13),
    color: '#666',
    marginTop: moderateScale(10),
    lineHeight: scaleFontSize(18),
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
