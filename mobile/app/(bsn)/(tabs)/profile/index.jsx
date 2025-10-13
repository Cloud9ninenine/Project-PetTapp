import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from "@config/api";

export default function BusinessProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState(null);
  const [businessData, setBusinessData] = useState(null);
  const [operatingHoursModal, setOperatingHoursModal] = useState(false);
  const [operatingHours, setOperatingHours] = useState({
    monday: { open: true, start: '8:00 AM', end: '6:00 PM' },
    tuesday: { open: true, start: '8:00 AM', end: '6:00 PM' },
    wednesday: { open: true, start: '8:00 AM', end: '6:00 PM' },
    thursday: { open: true, start: '8:00 AM', end: '6:00 PM' },
    friday: { open: true, start: '8:00 AM', end: '6:00 PM' },
    saturday: { open: true, start: '8:00 AM', end: '6:00 PM' },
    sunday: { open: false, start: '8:00 AM', end: '6:00 PM' },
  });
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBusinessData();
  }, []);

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

        // Load business hours if available
        if (business.businessHours) {
          const hours = {};
          Object.keys(operatingHours).forEach((day) => {
            if (business.businessHours[day]) {
              hours[day] = {
                open: business.businessHours[day].isOpen || false,
                start: business.businessHours[day].open || '8:00 AM',
                end: business.businessHours[day].close || '6:00 PM',
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
      <Text style={styles.titleText}>Business Profile</Text>
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
      other: 'Other',
    };
    return typeLabels[type] || type;
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
      title: 'Operating Hours',
      icon: 'time',
      color: '#4CAF50',
      action: 'modal',
    },
    {
      id: '2',
      title: 'Credentials',
      icon: 'ribbon',
      color: '#FF9B79',
      action: 'credentials',
    },
    {
      id: '3',
      title: 'Verification Document',
      icon: 'document-text',
      color: '#9C27B0',
      action: 'verification',
    },
    {
      id: '4',
      title: 'Payment QR Code',
      icon: 'qr-code',
      color: '#2196F3',
      route: '/(bsn)/(tabs)/profile/payment-gateways',
    },
  ];

  const toggleDayOpen = (day) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], open: !prev[day].open }
    }));
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

  const handleShortcutPress = (action, route) => {
    if (action === 'modal') {
      setOperatingHoursModal(true);
    } else if (action === 'credentials') {
      // Show credentials info
      if (!businessData?.credentials) {
        Alert.alert('No Credentials', 'Please update your business information to add credentials.');
        return;
      }

      const { licenseNumber, certifications, insuranceInfo } = businessData.credentials;
      const credInfo = [
        licenseNumber && `License: ${licenseNumber}`,
        certifications?.length > 0 && `Certifications: ${certifications.join(', ')}`,
        insuranceInfo && `Insurance: ${insuranceInfo}`,
      ].filter(Boolean).join('\n\n');

      Alert.alert('Credentials', credInfo || 'No credentials information available.');
    } else if (action === 'verification') {
      // Show verification document info
      if (!businessData?.verificationDocument) {
        Alert.alert('No Verification Document', 'Please upload your verification document in Business Information.');
        return;
      }
      Alert.alert('Verification Document', 'Document uploaded and pending review.');
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
          showBack={false}
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
          showBack={false}
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
        showBack={false}
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
          <View style={styles.profileHeader}>
            <View style={styles.profilePicContainer}>
              {businessData.logo ? (
                <Image
                  source={{ uri: businessData.logo }}
                  style={styles.profilePic}
                />
              ) : (
                <View style={styles.profilePicPlaceholder}>
                  <Ionicons name="storefront" size={moderateScale(40)} color="#1C86FF" />
                </View>
              )}
              {businessData.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#4CAF50" />
                </View>
              )}
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.businessName} numberOfLines={2}>
                {businessData.businessName || 'Business Name'}
              </Text>
              <Text style={styles.businessType}>
                {getBusinessTypeLabel(businessData.businessType)}
              </Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={moderateScale(16)} color="#FFD700" />
                <Text style={styles.ratingText}>
                  {businessData.ratings?.averageRating || 0} ({businessData.ratings?.totalReviews || 0} reviews)
                </Text>
              </View>
            </View>

            <Ionicons name="create-outline" size={moderateScale(24)} color="#1C86FF" />
          </View>

          {/* Description */}
          {businessData.description && (
            <Text style={styles.description} numberOfLines={3}>
              {businessData.description}
            </Text>
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
                      await apiClient.post('/auth/logout');
                      router.replace('/(auth)/login');
                    } catch (error) {
                      console.error('Logout error:', error);
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
                <View key={day} style={styles.dayRow}>
                  <View style={styles.dayInfo}>
                    <Text style={styles.dayName}>
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </Text>
                    {operatingHours[day].open && (
                      <Text style={styles.dayTime}>
                        {operatingHours[day].start} - {operatingHours[day].end}
                      </Text>
                    )}
                    {!operatingHours[day].open && (
                      <Text style={styles.dayClosed}>Closed</Text>
                    )}
                  </View>
                  <Switch
                    value={operatingHours[day].open}
                    onValueChange={() => toggleDayOpen(day)}
                    trackColor={{ false: '#ccc', true: '#1C86FF' }}
                    thumbColor="#fff"
                  />
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
    paddingBottom: moderateScale(100),
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
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(15),
  },
  profilePicContainer: {
    position: 'relative',
    marginRight: moderateScale(15),
  },
  profilePic: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    borderWidth: 2,
    borderColor: '#1C86FF',
  },
  profilePicPlaceholder: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
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
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(4),
  },
  businessType: {
    fontSize: scaleFontSize(13),
    color: '#666',
    marginBottom: moderateScale(6),
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
  },
  ratingText: {
    fontSize: scaleFontSize(12),
    color: '#333',
    fontWeight: '500',
  },
  description: {
    fontSize: scaleFontSize(14),
    color: '#666',
    lineHeight: scaleFontSize(20),
    marginBottom: moderateScale(15),
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
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(4),
  },
  dayTime: {
    fontSize: scaleFontSize(13),
    color: '#666',
  },
  dayClosed: {
    fontSize: scaleFontSize(13),
    color: '#999',
    fontStyle: 'italic',
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
});
