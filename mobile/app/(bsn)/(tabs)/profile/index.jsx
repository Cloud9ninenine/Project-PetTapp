import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Alert,
  Modal,
  Switch,
  ActivityIndicator,
  RefreshControl,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from "@config/api";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { performCompleteLogout } from '@utils/logoutHelper';

export default function BusinessProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState(null);

  const handleBackPress = () => {
    router.push('/(bsn)/(tabs)/home');
  };
  const [businessData, setBusinessData] = useState(null);
  const [operatingHoursModal, setOperatingHoursModal] = useState(false);
  const [operatingHours, setOperatingHours] = useState({
    monday: { open: true, start: '09:00', end: '17:00' },
    tuesday: { open: true, start: '09:00', end: '17:00' },
    wednesday: { open: true, start: '09:00', end: '17:00' },
    thursday: { open: true, start: '09:00', end: '17:00' },
    friday: { open: true, start: '09:00', end: '17:00' },
    saturday: { open: true, start: '09:00', end: '17:00' },
    sunday: { open: false, start: '09:00', end: '17:00' },
  });
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentTimePicker, setCurrentTimePicker] = useState(null); // { day: 'monday', field: 'start' }
  const [editingDay, setEditingDay] = useState(null);
  const [showDayTimeModal, setShowDayTimeModal] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  useEffect(() => {
    fetchBusinessData();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchBusinessData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBusinessData();
    setRefreshing(false);
  };

  const fetchBusinessData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/businesses');

      if (response.data && response.data.data && response.data.data.length > 0) {
        const business = response.data.data[0];
        setBusinessId(business._id);
        setBusinessData(business);

        // Store businessId in AsyncStorage for other screens
        await AsyncStorage.setItem('businessId', business._id);

        // Load business hours if available
        if (business.businessHours) {
          const hours = {};
          Object.keys(operatingHours).forEach((day) => {
            if (business.businessHours[day]) {
              hours[day] = {
                open: business.businessHours[day].isOpen || false,
                start: business.businessHours[day].open || '09:00',
                end: business.businessHours[day].close || '17:00',
              };
            } else {
              hours[day] = operatingHours[day];
            }
          });
          setOperatingHours(hours);
        }
      }
    } catch (error) {
      console.error('Error fetching business data:', error);
      Alert.alert('Error', 'Failed to load business information');
    } finally {
      setLoading(false);
    }
  };

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText} numberOfLines={1}>Business Profile</Text>
    </View>
  );

  const getBusinessTypeLabel = (type) => {
    const typeLabels = {
      veterinary: 'Veterinary Services',
      grooming: 'Pet Grooming',
      boarding: 'Pet Boarding',
      daycare: 'Pet Daycare',
      training: 'Pet Training',
      'pet-shop': 'Pet Shop',
      accommodation: 'Accommodation',
      other: 'Other',
    };
    // If not in predefined labels, capitalize first letter
    return typeLabels[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getBusinessTypeStyle = (type) => {
    const typeStyles = {
      veterinary: { bg: '#E3F2FD', icon: '#1976D2' },      // Blue
      grooming: { bg: '#FCE4EC', icon: '#C2185B' },         // Pink
      boarding: { bg: '#F3E5F5', icon: '#7B1FA2' },         // Purple
      daycare: { bg: '#FFF3E0', icon: '#F57C00' },          // Orange
      training: { bg: '#E8F5E9', icon: '#388E3C' },         // Green
      'pet-shop': { bg: '#FFF9C4', icon: '#F9A825' },       // Yellow
      accommodation: { bg: '#E0F2F1', icon: '#00897B' },    // Teal
      other: { bg: '#ECEFF1', icon: '#546E7A' },            // Blue Grey
    };
    return typeStyles[type] || { bg: '#E3F2FD', icon: '#1976D2' };
  };

  const openMap = () => {
    if (!businessData?.address) return;

    const { latitude, longitude } = businessData.address.coordinates || {};

    if (latitude && longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Unable to open maps');
      });
    }
  };

  const shortcutOptions = [
    {
      id: '1',
      title: 'Analytics',
      icon: 'stats-chart',
      color: '#9C27B0',
      route: '/(bsn)/(tabs)/analytics',
    },
    {
      id: '2',
      title: 'Revenue',
      icon: 'cash',
      color: '#4CAF50',
      route: '/(bsn)/(tabs)/revenue',
    },
    {
      id: '3',
      title: 'Ratings & Reviews',
      icon: 'star',
      color: '#FFD700',
      route: '/(bsn)/(tabs)/profile/rating-review',
    },
    {
      id: '4',
      title: 'Operating Hours',
      icon: 'time',
      color: '#FF9800',
      action: 'modal',
    },
    {
      id: '5',
      title: 'Credentials',
      icon: 'ribbon',
      color: '#FF9B79',
      route: '/(bsn)/(tabs)/profile/credentials',
    },
    {
      id: '6',
      title: 'Verification Document',
      icon: 'document-text',
      color: '#673AB7',
      route: '/(bsn)/(tabs)/profile/verification-documents',
    },
    {
      id: '7',
      title: 'Payment QR Code',
      icon: 'qr-code',
      color: '#2196F3',
      route: '/(bsn)/(tabs)/profile/payment-gateways',
    },
    {
      id: '8',
      title: 'Settings',
      icon: 'settings',
      color: '#607D8B',
      route: '/(bsn)/(tabs)/profile/settings',
    },
  ];

  const toggleDayOpen = (day) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], open: !prev[day].open }
    }));
  };

  const openDayTimeEdit = (day) => {
    if (operatingHours[day].open) {
      setEditingDay(day);
      setShowDayTimeModal(true);
    }
  };

  const openTimePicker = (field) => {
    setCurrentTimePicker({ day: editingDay, field });
    setShowTimePicker(true);
  };

  const handleTimeChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    if (event.type === 'set' && selectedDate && currentTimePicker) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;

      setOperatingHours(prev => ({
        ...prev,
        [currentTimePicker.day]: {
          ...prev[currentTimePicker.day],
          [currentTimePicker.field]: timeString
        }
      }));

      if (Platform.OS === 'ios') {
        setShowTimePicker(false);
        setCurrentTimePicker(null);
      } else {
        setCurrentTimePicker(null);
      }
    } else if (event.type === 'dismissed') {
      setShowTimePicker(false);
      setCurrentTimePicker(null);
    }
  };

  const closeDayTimeModal = () => {
    setShowDayTimeModal(false);
    setEditingDay(null);
  };

  const getTimeForPicker = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    return date;
  };

  const saveOperatingHours = async () => {
    if (!businessId) {
      Alert.alert('Error', 'Business information not found. Please complete your business profile first.');
      return;
    }

    try {
      setSavingHours(true);

      // Transform operating hours to API format
      const businessHours = {};
      Object.keys(operatingHours).forEach((day) => {
        businessHours[day] = {
          open: operatingHours[day].start,
          close: operatingHours[day].end,
          isOpen: operatingHours[day].open,
        };
      });

      // Create FormData for the update
      const formData = new FormData();
      formData.append('businessHours', JSON.stringify(businessHours));

      await apiClient.put(`/businesses/${businessId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setOperatingHoursModal(false);
      Alert.alert('Success', 'Operating hours updated successfully!');
      fetchBusinessData(); // Refresh data
    } catch (error) {
      console.error('Error saving operating hours:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save operating hours');
    } finally {
      setSavingHours(false);
    }
  };

  const handleShortcutPress = async (action, route) => {
    if (action === 'modal') {
      // Refresh data before opening modal to ensure we have latest operating hours
      await fetchBusinessData();
      setOperatingHoursModal(true);
    } else if (route) {
      router.push(route);
    }
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1C86FF" />
          <Text style={styles.loadingText}>Loading business profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!businessData) {
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
          <Text style={styles.emptyText}>No business profile found</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/(bsn)/(tabs)/profile/business-info')}
          >
            <Text style={styles.createButtonText}>Create Business Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const fullAddress = businessData.address
    ? `${businessData.address.street}, ${businessData.address.city}, ${businessData.address.state}, ${businessData.address.zipCode}`
    : '';

  const hasCoordinates = businessData.address?.coordinates?.latitude && businessData.address?.coordinates?.longitude;

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

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1C86FF']}
            tintColor="#1C86FF"
          />
        }
      >
        {/* Business Profile Card */}
        <TouchableOpacity
          style={styles.businessCard}
          onPress={() => router.push('/(bsn)/(tabs)/profile/business-info')}
          activeOpacity={0.7}
        >
          {/* Edit Icon - Top Right */}
          <View style={styles.editIconContainer}>
            <Ionicons name="create-outline" size={moderateScale(24)} color="#1C86FF" />
          </View>

          {/* Logo - Centered at Top */}
          <View style={styles.profileHeader}>
            <View style={styles.profilePicContainer}>
              {(businessData.images?.logo || businessData.logo) ? (
                <Image
                  source={{ uri: businessData.images?.logo || businessData.logo }}
                  style={styles.profilePic}
                />
              ) : (
                <View style={styles.profilePicPlaceholder}>
                  <Ionicons name="storefront" size={moderateScale(45)} color="#1C86FF" />
                </View>
              )}
              {businessData.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#4CAF50" />
                </View>
              )}
            </View>
          </View>

          {/* Business Name - Centered Below Logo */}
          <Text style={styles.businessName} numberOfLines={2}>
            {businessData.businessName || 'Business Name'}
          </Text>

          {/* Status Tags - Bento Style Layout */}
          <View style={styles.tagsContainer}>
            {/* Service Type Tags - Handle multiple business types */}
            {(() => {
              // Handle businessType as array, comma-separated string, or single value
              let businessTypes = [];
              if (Array.isArray(businessData.businessType)) {
                businessTypes = businessData.businessType;
              } else if (typeof businessData.businessType === 'string') {
                businessTypes = businessData.businessType.includes(',')
                  ? businessData.businessType.split(',').map(type => type.trim())
                  : [businessData.businessType];
              }

              return businessTypes.map((type, index) => {
                const typeStyle = getBusinessTypeStyle(type);
                return (
                  <View
                    key={`business-type-${index}`}
                    style={[styles.tag, { backgroundColor: typeStyle.bg }]}
                  >
                    <Ionicons name="pricetag" size={moderateScale(14)} color={typeStyle.icon} />
                    <Text style={styles.tagText}>
                      {getBusinessTypeLabel(type)}
                    </Text>
                  </View>
                );
              });
            })()}

            {/* Verified Tag */}
            {businessData.isVerified && (
              <View style={[styles.tag, styles.verifiedTag]}>
                <Ionicons name="checkmark-circle" size={moderateScale(14)} color="#4CAF50" />
                <Text style={styles.tagText}>Verified</Text>
              </View>
            )}

            {/* Active Tag */}
            <View style={[styles.tag, businessData.isActive ? styles.activeTag : styles.inactiveTag]}>
              <View style={[styles.statusDot, businessData.isActive ? styles.activeDot : styles.inactiveDot]} />
              <Text style={styles.tagText}>
                {businessData.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          {/* Description */}
          {businessData.description && (
            <View style={styles.descriptionContainer}>
              <Text
                style={styles.description}
                numberOfLines={descriptionExpanded ? undefined : 3}
              >
                {businessData.description}
              </Text>
              {businessData.description.length > 100 && (
                <TouchableOpacity
                  style={styles.seeMoreButton}
                  onPress={() => setDescriptionExpanded(!descriptionExpanded)}
                >
                  <Text style={styles.seeMoreText}>
                    {descriptionExpanded ? 'See less' : 'See more'}
                  </Text>
                  <Ionicons
                    name={descriptionExpanded ? 'chevron-up' : 'chevron-down'}
                    size={moderateScale(16)}
                    color="#1C86FF"
                  />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Contact Details */}
          <View style={styles.contactDetails}>
            {businessData.contactInfo?.email && (
              <View style={styles.contactRow}>
                <Ionicons name="mail" size={moderateScale(16)} color="#1C86FF" />
                <Text style={styles.contactText}>{businessData.contactInfo.email}</Text>
              </View>
            )}
            {businessData.contactInfo?.phone && (
              <View style={styles.contactRow}>
                <Ionicons name="call" size={moderateScale(16)} color="#1C86FF" />
                <Text style={styles.contactText}>{businessData.contactInfo.phone}</Text>
              </View>
            )}
            {businessData.contactInfo?.website && (
              <View style={styles.contactRow}>
                <Ionicons name="globe" size={moderateScale(16)} color="#1C86FF" />
                <Text style={styles.contactText} numberOfLines={1}>
                  {businessData.contactInfo.website}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Location Section */}
        <TouchableOpacity
          style={styles.section}
          onPress={() => router.push('/(bsn)/(tabs)/profile/business-location')}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationActions}>
              {hasCoordinates && (
                <TouchableOpacity onPress={(e) => {
                  e.stopPropagation();
                  openMap();
                }}>
                  <Ionicons name="navigate" size={moderateScale(22)} color="#1C86FF" />
                </TouchableOpacity>
              )}
              <Ionicons name="chevron-forward" size={moderateScale(20)} color="#999" />
            </View>
          </View>

          {hasCoordinates ? (
            <View style={styles.mapPlaceholder}>
              <Ionicons name="map" size={moderateScale(60)} color="#1C86FF" />
              <Text style={styles.mapText}>View on Map</Text>
              <Text style={styles.addressText}>{fullAddress}</Text>
            </View>
          ) : (
            <View style={styles.addressContainer}>
              <Ionicons name="location" size={moderateScale(20)} color="#1C86FF" />
              <Text style={styles.addressText}>{fullAddress || 'No address provided'}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Shortcuts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          {shortcutOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.shortcutCard}
              onPress={() => handleShortcutPress(option.action, option.route)}
            >
              <View style={[styles.shortcutIconContainer, { backgroundColor: option.color }]}>
                <Ionicons name={option.icon} size={moderateScale(22)} color="#fff" />
              </View>
              <Text style={styles.shortcutTitle}>{option.title}</Text>
              <Ionicons name="chevron-forward" size={moderateScale(20)} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            Alert.alert(
              'Logout',
              'Are you sure you want to logout?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Logout',
                  style: 'destructive',
                  onPress: async () => {
                    setIsLoggingOut(true);
                    try {
                      // Call backend logout API
                      try {
                        await apiClient.post('/auth/logout');
                      } catch (apiError) {
                        console.error('Backend logout error:', apiError);
                        // Continue with local cleanup even if backend fails
                      }

                      // Clear all local data (AsyncStorage, Firebase auth, notifications, etc.)
                      console.log('Performing complete local logout...');
                      await performCompleteLogout();

                      // Navigate to login screen
                      router.replace('/(auth)/login');
                    } catch (error) {
                      console.error('Logout error:', error);
                      // Force navigate to login even if there's an error
                      router.replace('/(auth)/login');
                    } finally {
                      setIsLoggingOut(false);
                    }
                  },
                },
              ]
            );
          }}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator color="#FF6B6B" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={moderateScale(22)} color="#FF6B6B" />
              <Text style={styles.logoutText}>Logout</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Operating Hours Modal */}
      <Modal
        visible={operatingHoursModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOperatingHoursModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Operating Hours</Text>
              <TouchableOpacity onPress={() => setOperatingHoursModal(false)}>
                <Ionicons name="close" size={moderateScale(28)} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {Object.keys(operatingHours).map((day) => (
                <View key={day} style={styles.dayContainer}>
                  <View style={styles.dayRowContent}>
                    <View style={styles.dayLeftSection}>
                      <Text style={styles.dayName}>
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </Text>
                      <Switch
                        value={operatingHours[day].open}
                        onValueChange={() => toggleDayOpen(day)}
                        trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                        thumbColor={operatingHours[day].open ? '#1C86FF' : '#f4f3f4'}
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.timeDisplayContainer}
                      onPress={() => openDayTimeEdit(day)}
                      disabled={!operatingHours[day].open}
                    >
                      <View style={[
                        styles.timeDisplay,
                        !operatingHours[day].open && styles.timeDisplayDisabled
                      ]}>
                        <Ionicons
                          name="time-outline"
                          size={moderateScale(16)}
                          color={operatingHours[day].open ? "#1C86FF" : "#999"}
                        />
                        <Text style={[
                          styles.timeText,
                          !operatingHours[day].open && styles.timeTextDisabled
                        ]}>
                          {operatingHours[day].start} - {operatingHours[day].end}
                        </Text>
                        {operatingHours[day].open && (
                          <Ionicons name="pencil" size={moderateScale(14)} color="#1C86FF" />
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveButton, savingHours && styles.saveButtonDisabled]}
              onPress={saveOperatingHours}
              disabled={savingHours}
            >
              {savingHours ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Day Time Edit Modal */}
      <Modal
        visible={showDayTimeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeDayTimeModal}
      >
        <View style={styles.timeModalOverlay}>
          <View style={styles.timeModalContent}>
            {/* Header */}
            <View style={styles.timeModalHeader}>
              <View style={styles.timeModalTitleRow}>
                <Ionicons name="time-outline" size={moderateScale(24)} color="#1C86FF" />
                <Text style={styles.timeModalTitle}>
                  Set Hours for {editingDay && editingDay.charAt(0).toUpperCase() + editingDay.slice(1)}
                </Text>
              </View>
              <TouchableOpacity onPress={closeDayTimeModal}>
                <Ionicons name="close" size={moderateScale(24)} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Time Pickers */}
            <View style={styles.timeModalBody}>
              {/* Opening Time */}
              <View style={styles.timePickerGroup}>
                <Text style={styles.timePickerLabel}>Opening Time</Text>
                <TouchableOpacity
                  style={styles.timePickerButton}
                  onPress={() => openTimePicker('start')}
                >
                  <Ionicons name="time-outline" size={moderateScale(20)} color="#1C86FF" />
                  <Text style={styles.timePickerButtonText}>
                    {editingDay && operatingHours[editingDay].start}
                  </Text>
                  <Ionicons name="chevron-down" size={moderateScale(20)} color="#1C86FF" />
                </TouchableOpacity>
              </View>

              {/* Closing Time */}
              <View style={styles.timePickerGroup}>
                <Text style={styles.timePickerLabel}>Closing Time</Text>
                <TouchableOpacity
                  style={styles.timePickerButton}
                  onPress={() => openTimePicker('end')}
                >
                  <Ionicons name="time-outline" size={moderateScale(20)} color="#1C86FF" />
                  <Text style={styles.timePickerButtonText}>
                    {editingDay && operatingHours[editingDay].end}
                  </Text>
                  <Ionicons name="chevron-down" size={moderateScale(20)} color="#1C86FF" />
                </TouchableOpacity>
              </View>

              {/* Info Box */}
              <View style={styles.timeInfoBox}>
                <Ionicons name="information-circle-outline" size={moderateScale(18)} color="#1C86FF" />
                <Text style={styles.timeInfoText}>
                  Set the operating hours for this day. Times are displayed in 24-hour format.
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.timeModalActions}>
              <TouchableOpacity
                style={styles.timeCancelButton}
                onPress={closeDayTimeModal}
              >
                <Text style={styles.timeCancelButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Time Picker */}
      {showTimePicker && currentTimePicker && (
        Platform.OS === 'ios' ? (
          <Modal
            visible={showTimePicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => {
              setShowTimePicker(false);
              setCurrentTimePicker(null);
            }}
          >
            <View style={styles.timePickerModalOverlay}>
              <View style={styles.timePickerModalContent}>
                <View style={styles.timePickerHeader}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowTimePicker(false);
                      setCurrentTimePicker(null);
                    }}
                  >
                    <Text style={styles.timePickerDoneButton}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={getTimeForPicker(operatingHours[currentTimePicker.day][currentTimePicker.field])}
                  mode="time"
                  is24Hour={true}
                  display="spinner"
                  onChange={handleTimeChange}
                  style={styles.timePicker}
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={getTimeForPicker(operatingHours[currentTimePicker.day][currentTimePicker.field])}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={handleTimeChange}
          />
        )
      )}
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
  content: {
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(20),
    paddingBottom: moderateScale(40),
  },
  businessCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    marginBottom: moderateScale(20),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  editIconContainer: {
    position: 'absolute',
    top: moderateScale(20),
    right: moderateScale(20),
    zIndex: 10,
  },
  profileHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(12),
  },
  profilePicContainer: {
    position: 'relative',
  },
  profilePic: {
    width: moderateScale(90),
    height: moderateScale(90),
    borderRadius: moderateScale(45),
    borderWidth: 3,
    borderColor: '#1C86FF',
  },
  profilePicPlaceholder: {
    width: moderateScale(90),
    height: moderateScale(90),
    borderRadius: moderateScale(45),
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1C86FF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(2),
  },
  profileInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: scaleFontSize(22),
    fontWeight: 'bold',
    color: '#1C86FF',
    textAlign: 'center',
    marginBottom: moderateScale(4),
    paddingHorizontal: moderateScale(10),
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
    marginTop: moderateScale(12),
    marginBottom: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(16),
    gap: moderateScale(5),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  serviceTag: {
    backgroundColor: '#E3F2FD',
  },
  verifiedTag: {
    backgroundColor: '#E8F5E9',
  },
  activeTag: {
    backgroundColor: '#E8F5E9',
  },
  inactiveTag: {
    backgroundColor: '#FFEBEE',
  },
  tagText: {
    fontSize: scaleFontSize(12),
    color: '#333',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  statusDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
  },
  activeDot: {
    backgroundColor: '#4CAF50',
  },
  inactiveDot: {
    backgroundColor: '#F44336',
  },
  descriptionContainer: {
    marginBottom: moderateScale(15),
  },
  description: {
    fontSize: scaleFontSize(14),
    color: '#666',
    lineHeight: scaleFontSize(20),
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: moderateScale(8),
    paddingVertical: moderateScale(6),
    gap: moderateScale(4),
  },
  seeMoreText: {
    fontSize: scaleFontSize(13),
    color: '#1C86FF',
    fontWeight: '600',
  },
  contactDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: moderateScale(15),
    gap: moderateScale(8),
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
  },
  contactText: {
    flex: 1,
    fontSize: scaleFontSize(13),
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    marginBottom: moderateScale(15),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(15),
  },
  locationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
  },
  sectionTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#1C86FF',
  },
  mapPlaceholder: {
    backgroundColor: '#E3F2FD',
    borderRadius: moderateScale(12),
    padding: moderateScale(30),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1C86FF',
    borderStyle: 'dashed',
  },
  mapText: {
    fontSize: scaleFontSize(14),
    color: '#1C86FF',
    fontWeight: '600',
    marginTop: moderateScale(10),
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: moderateScale(10),
    padding: moderateScale(10),
  },
  addressText: {
    flex: 1,
    fontSize: scaleFontSize(13),
    color: '#333',
    lineHeight: scaleFontSize(18),
  },
  shortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  shortcutIconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  shortcutTitle: {
    flex: 1,
    fontSize: scaleFontSize(15),
    color: '#333',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    paddingVertical: hp(1.8),
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    borderWidth: 2,
    borderColor: '#FF6B6B',
    marginTop: moderateScale(10),
  },
  logoutText: {
    color: '#FF6B6B',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    maxHeight: '80%',
    paddingBottom: moderateScale(20),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(20),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#1C86FF',
  },
  modalBody: {
    padding: moderateScale(20),
  },
  dayContainer: {
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(4),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dayRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    flex: 1,
  },
  dayName: {
    fontSize: scaleFontSize(15),
    fontWeight: '600',
    color: '#333',
    width: moderateScale(85),
  },
  timeDisplayContainer: {
    flex: 1,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: moderateScale(8),
  },
  timeDisplayDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E8E8E8',
  },
  timeText: {
    fontSize: scaleFontSize(14),
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  timeTextDisabled: {
    color: '#999',
  },
  saveButton: {
    backgroundColor: '#1C86FF',
    marginHorizontal: moderateScale(20),
    marginTop: moderateScale(10),
    paddingVertical: moderateScale(15),
    borderRadius: moderateScale(12),
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
  saveButtonDisabled: {
    opacity: 0.6,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(10),
  },
  emptyText: {
    fontSize: scaleFontSize(18),
    fontWeight: '600',
    color: '#666',
    marginTop: moderateScale(20),
    marginBottom: moderateScale(30),
  },
  createButton: {
    backgroundColor: '#1C86FF',
    paddingHorizontal: moderateScale(30),
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(12),
  },
  createButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
  timePickerModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  timePickerModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    paddingBottom: moderateScale(20),
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timePickerDoneButton: {
    fontSize: scaleFontSize(16),
    color: '#1C86FF',
    fontWeight: '600',
  },
  timePicker: {
    width: '100%',
    height: moderateScale(200),
  },
  // Day Time Edit Modal Styles
  timeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  timeModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    maxHeight: '70%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  timeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(24),
    paddingTop: moderateScale(24),
    paddingBottom: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timeModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    flex: 1,
  },
  timeModalTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  timeModalBody: {
    padding: moderateScale(24),
  },
  timePickerGroup: {
    marginBottom: moderateScale(20),
  },
  timePickerLabel: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(10),
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(16),
    borderWidth: 2,
    borderColor: '#1C86FF',
    gap: moderateScale(12),
  },
  timePickerButtonText: {
    fontSize: scaleFontSize(18),
    fontWeight: '600',
    color: '#1C86FF',
    flex: 1,
  },
  timeInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    padding: moderateScale(14),
    borderRadius: moderateScale(12),
    gap: moderateScale(10),
    marginTop: moderateScale(10),
  },
  timeInfoText: {
    fontSize: scaleFontSize(13),
    color: '#1C86FF',
    flex: 1,
    lineHeight: scaleFontSize(18),
  },
  timeModalActions: {
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(20),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  timeCancelButton: {
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(12),
    backgroundColor: '#1C86FF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#1C86FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  timeCancelButtonText: {
    fontSize: scaleFontSize(15),
    fontWeight: '600',
    color: '#fff',
  },
});
