import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ImageBackground,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '@components/Header';
import BookingConfirmationModal from '../home/BookingConfirmationModal';
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import { fetchServiceById } from '@services/api';
import { getBusinessOwner, getOrCreateConversation } from '@services/api/messageApiService';
import { ensureFirebaseAuth } from '@utils/firebaseAuthPersistence';

export default function ServiceDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [service, setService] = useState(null);
  const [businessData, setBusinessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState(false);

  // Fetch service data from API
  useEffect(() => {
    const loadServiceData = async () => {
      if (!params.id) {
        setError('Service ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchServiceById(params.id);
        setService(data.service);
        setBusinessData(data.businessData);

        // Debug: Log business data structure
        console.log('Business Data:', JSON.stringify(data.businessData, null, 2));
        console.log('Address:', data.businessData?.address);
        console.log('Coordinates:', data.businessData?.address?.coordinates);

        setError(null);
      } catch (err) {
        console.error('Error loading service:', err);
        setError(err.message || 'Failed to load service details');
      } finally {
        setLoading(false);
      }
    };

    loadServiceData();
  }, [params.id]);

  // Format price
  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    return `PHP ${price.amount?.toLocaleString() || 0}.00`;
  };

  // Format duration - returns object with value and unit separated
  const formatDuration = (duration) => {
    if (!duration) return { value: 'N/A', unit: '' };
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    if (hours > 0 && minutes > 0) {
      return { value: `${hours}h ${minutes}`, unit: 'mins' };
    }
    if (hours > 0) {
      return { value: hours, unit: 'hours' };
    }
    return { value: duration, unit: 'mins' };
  };

  // Format duration as string (for booking data)
  const formatDurationString = (duration) => {
    const formatted = formatDuration(duration);
    return formatted.unit ? `${formatted.value} ${formatted.unit}` : formatted.value;
  };

  // Get category color
  const getCategoryColor = (category) => {
    const colors = {
      veterinary: '#FF6B6B',
      grooming: '#FF9B79',
      accommodation: '#4ECDC4',
      transport: '#FFE66D',
      'pet-supplies': '#95E1D3',
    };
    return colors[category] || '#1C86FF';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Format business hours
  const formatBusinessHours = () => {
    if (!businessData?.businessHours || typeof businessData.businessHours !== 'object') {
      return null;
    }

    const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const hours = businessData.businessHours;

    const formatTime = (time) => {
      if (!time) return '';
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    return daysOrder.map(day => {
      const dayHours = hours[day];
      if (!dayHours) return null;

      const dayName = day.charAt(0).toUpperCase() + day.slice(1, 3);

      // Check if the day is closed using isOpen property
      if (dayHours.isOpen === false || !dayHours.open || !dayHours.close) {
        return { day: dayName, hours: 'Closed', closed: true };
      }

      return {
        day: dayName,
        hours: `${formatTime(dayHours.open)} - ${formatTime(dayHours.close)}`,
        closed: false
      };
    }).filter(Boolean);
  };

  // Create booking data for confirmation modal
  const getBookingData = () => {
    if (!service) return null;

    let businessIdValue = null;
    if (typeof service.businessId === 'object' && service.businessId?._id) {
      businessIdValue = service.businessId._id;
    } else if (typeof service.businessId === 'string') {
      businessIdValue = service.businessId;
    }

    return {
      service: {
        id: service._id,
        businessId: businessIdValue,
        name: service.name,
        type: service.category,
        category: service.category,
        imageUrl: service.imageUrl,
        price: formatPrice(service.price),
        duration: formatDurationString(service.duration),
      },
      business: businessData ? {
        id: businessData._id || businessData.id,
        name: businessData.name,
        address: businessData.address,
        contactNumber: businessData.contactNumber,
      } : null,
      availability: service.availability,
      requirements: service.requirements,
      pet: {
        name: 'Your Pet',
        type: 'Pet',
      },
      transportation: {
        label: 'To be selected',
      },
      payment: {
        name: 'To be selected',
      },
      date: new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
    };
  };

  const handleBooking = () => {
    setShowBookingModal(true);
  };

  const handleConfirmBooking = (bookingResult) => {
    setShowBookingModal(false);
    router.push({
      pathname: 'home/service-scheduled',
      params: {
        serviceName: bookingResult.service?.name || service.name,
        serviceCategory: bookingResult.service?.type || service.category,
        bookingId: bookingResult.booking?._id,
        status: bookingResult.booking?.status,
        petName: bookingResult.pet?.name || 'Your Pet',
        petSpecies: bookingResult.pet?.species,
        petBreed: bookingResult.pet?.breed,
        date: bookingResult.date,
        time: bookingResult.time,
        paymentMethod: bookingResult.paymentMethod,
        totalAmount: bookingResult.booking?.totalAmount?.amount,
        currency: bookingResult.booking?.totalAmount?.currency,
        notes: bookingResult.notes || '',
        specialRequests: bookingResult.specialRequests || '',
      },
    });
  };

  const handleCancelBooking = () => {
    setShowBookingModal(false);
  };

  // Handle message button - navigate to messages/chat
  const handleMessage = async () => {
    if (!businessData || !businessData._id) {
      Alert.alert('Error', 'Business information not available');
      return;
    }

    if (loadingMessage) return;

    try {
      setLoadingMessage(true);

      // Step 1: Ensure Firebase authentication is established FIRST
      console.log('Ensuring Firebase authentication...');
      const isFirebaseAuth = await ensureFirebaseAuth();

      if (!isFirebaseAuth) {
        throw new Error('Failed to authenticate with messaging service');
      }

      console.log('Firebase authentication successful');

      // Step 2: Get business owner ID
      console.log('Getting business owner for business:', businessData._id);
      const ownerData = await getBusinessOwner(businessData._id);

      if (!ownerData || !ownerData.ownerId) {
        throw new Error('Could not find business owner');
      }

      console.log('Business owner found:', ownerData.ownerId);

      // Step 3: Get or create conversation with business owner
      const conversationData = await getOrCreateConversation(ownerData.ownerId);

      if (!conversationData || !conversationData.conversationId) {
        throw new Error('Could not create conversation');
      }

      console.log('Conversation ready:', conversationData.conversationId);

      // Step 4: Navigate to chat screen
      router.push({
        pathname: '/(user)/(tabs)/messages/chat',
        params: {
          conversationId: conversationData.conversationId,
          receiverId: ownerData.ownerId,
          receiverName: ownerData.ownerName || businessData.name || 'Business Owner',
          receiverImage: ownerData.ownerImage || businessData.images?.logo || '',
        },
      });
    } catch (error) {
      console.error('Error starting conversation:', error);

      let errorMessage = 'Could not start conversation. Please try again later.';

      if (error.message.includes('authenticate')) {
        errorMessage = 'Failed to connect to messaging service. Please check your connection and try again.';
      }

      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    } finally {
      setLoadingMessage(false);
    }
  };

  // Handle business provider card press - navigate to business details
  const handleBusinessPress = () => {
    if (!businessData || !businessData._id) {
      Alert.alert('Error', 'Business information not available');
      return;
    }

    // Navigate to business details page
    router.push({
      pathname: '/home/business-details',
      params: { id: businessData._id },
    });
  };

  // Handle see on maps button
  const handleSeeOnMaps = () => {
    // Debug: Log what we're checking
    console.log('=== See on Maps Debug ===');
    console.log('businessData.address.coordinates:', businessData?.address?.coordinates);

    // Try different possible coordinate formats
    let latitude, longitude;

    // Check for GeoJSON Point format: { type: "Point", coordinates: [longitude, latitude] }
    if (businessData?.address?.coordinates?.type === 'Point' &&
        Array.isArray(businessData.address.coordinates.coordinates) &&
        businessData.address.coordinates.coordinates.length === 2) {
      // GeoJSON format uses [longitude, latitude] order
      longitude = businessData.address.coordinates.coordinates[0];
      latitude = businessData.address.coordinates.coordinates[1];
      console.log('Found GeoJSON coordinates:', { latitude, longitude });
    }
    // Check if coordinates are in latitude/longitude properties
    else if (businessData?.address?.coordinates?.latitude && businessData?.address?.coordinates?.longitude) {
      latitude = businessData.address.coordinates.latitude;
      longitude = businessData.address.coordinates.longitude;
      console.log('Found lat/lng properties:', { latitude, longitude });
    }
    // Check if coordinates are directly under businessData
    else if (businessData?.coordinates?.latitude && businessData?.coordinates?.longitude) {
      latitude = businessData.coordinates.latitude;
      longitude = businessData.coordinates.longitude;
      console.log('Found coordinates on businessData:', { latitude, longitude });
    }
    // Check if latitude/longitude are directly on businessData
    else if (businessData?.latitude && businessData?.longitude) {
      latitude = businessData.latitude;
      longitude = businessData.longitude;
      console.log('Found lat/lng on businessData:', { latitude, longitude });
    }

    if (!latitude || !longitude) {
      console.log('No coordinates found!');
      Alert.alert(
        'Location Unavailable',
        'No coordinates available for this business location.'
      );
      return;
    }

    console.log('Navigating to map with:', { latitude, longitude });

    // Navigate to business map screen
    router.push({
      pathname: '/home/business-map',
      params: {
        latitude: latitude,
        longitude: longitude,
        businessName: businessData.name || 'Business Location',
      },
    });
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ImageBackground
          source={require("@assets/images/PetTapp pattern.png")}
          style={styles.backgroundimg}
          imageStyle={styles.backgroundImageStyle}
          resizeMode="repeat"
        />
        <Header title="Service Details" showBack={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1C86FF" />
          <Text style={styles.loadingText}>Loading service details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !service) {
    return (
      <SafeAreaView style={styles.container}>
        <ImageBackground
          source={require("@assets/images/PetTapp pattern.png")}
          style={styles.backgroundimg}
          imageStyle={styles.backgroundImageStyle}
          resizeMode="repeat"
        />
        <Header title="Service Details" showBack={true} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={moderateScale(64)} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>{error || 'Service not found'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
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

      {/* Header */}
      <Header
        title={service.name}
        showBack={true}
        titleStyle={styles.headerTitleStyle}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Image with Rounded Edges */}
        <View style={styles.heroImageContainer}>
          {service.imageUrl ? (
            <Image
              source={{ uri: service.imageUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.heroImagePlaceholder}>
              <Ionicons name="image" size={moderateScale(60)} color="#ccc" />
            </View>
          )}
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Tags */}
          <View style={styles.tagsRow}>
            <View style={[styles.tag, { backgroundColor: getCategoryColor(service.category) }]}>
              <Ionicons name="pricetag" size={moderateScale(14)} color="#fff" />
              <Text style={styles.tagText}>
                {service.category.charAt(0).toUpperCase() + service.category.slice(1)}
              </Text>
            </View>
            <View style={styles.activeTag}>
              <Ionicons name="checkmark-circle" size={moderateScale(14)} color="#fff" />
              <Text style={styles.activeTagText}>Active</Text>
            </View>
          </View>

          {/* Description Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>
              {service.description || 'No description available'}
            </Text>
          </View>

          {/* Requirements Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle-outline" size={moderateScale(20)} color="#333" />
              <Text style={styles.sectionTitle}>Requirements</Text>
            </View>

            {/* Accepted Pet Types */}
            {service.requirements?.petTypes && service.requirements.petTypes.length > 0 && (
              <View style={styles.requirementGroup}>
                <View style={styles.requirementHeader}>
                  <Ionicons name="paw-outline" size={moderateScale(16)} color="#666" />
                  <Text style={styles.requirementLabel}>Accepted Pet Types</Text>
                </View>
                <View style={styles.petTypesContainer}>
                  {service.requirements.petTypes.map((petType, index) => (
                    <View key={index} style={styles.petTypeBadge}>
                      <Text style={styles.petTypeText}>
                        {petType.charAt(0).toUpperCase() + petType.slice(1)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Age Restrictions */}
            {service.requirements?.ageRestrictions && (
              <View style={styles.requirementGroup}>
                <Text style={styles.requirementLabel}>Age Restrictions</Text>
                <Text style={styles.requirementValue}>
                  Min: {service.requirements.ageRestrictions.minAge || 0} years | Max: {service.requirements.ageRestrictions.maxAge || 30} years
                </Text>
              </View>
            )}

            {/* Health Requirements */}
            {service.requirements?.healthRequirements && service.requirements.healthRequirements.length > 0 && (
              <View style={styles.requirementGroup}>
                <Text style={styles.requirementLabel}>Health Requirements</Text>
                {service.requirements.healthRequirements.map((req, index) => (
                  <View key={index} style={styles.bulletPoint}>
                    <Text style={styles.bulletText}>•</Text>
                    <Text style={styles.bulletContent}>{req}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Special Notes */}
            {service.requirements?.specialNotes && (
              <View style={styles.requirementGroup}>
                <Text style={styles.requirementLabel}>Special Notes</Text>
                <Text style={styles.requirementValue}>{service.requirements.specialNotes}</Text>
              </View>
            )}
          </View>

                    {/* Location and Contact Section */}
          {(businessData?.address || businessData?.addressString || businessData?.contactNumber) && (
            <View style={styles.section}>
              <View style={styles.locationContactRow}>
                {/* Location */}
                {(businessData?.address || businessData?.addressString) && (
                  <View style={styles.locationContainer}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="location-outline" size={moderateScale(20)} color="#FF9B79" />
                      <Text style={styles.sectionTitle}>Location</Text>
                    </View>
                    {/* See on Maps Button */}
                    <TouchableOpacity style={styles.mapButton} onPress={handleSeeOnMaps}>
                      <Ionicons name="map" size={moderateScale(18)} color="#1C86FF" />
                      <Text style={styles.mapButtonText}>See Maps</Text>
                      <Ionicons name="chevron-forward" size={moderateScale(16)} color="#1C86FF" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Contact */}
                {businessData?.contactNumber && (
                  <View style={styles.contactContainer}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="call-outline" size={moderateScale(20)} color="#4CAF50" />
                      <Text style={styles.sectionTitle}>Contact</Text>
                    </View>
                    <Text style={styles.contactText}>{businessData.contactNumber}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Price and Duration - Inline Design */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price and Duration</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="cash-outline" size={moderateScale(24)} color="#4CAF50" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoValue}>{formatPrice(service.price)}</Text>
                </View>
              </View>

              <View style={styles.infoDivider} />

              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={moderateScale(24)} color="#1C86FF" />
                <View style={styles.infoTextContainer}>
                  <View style={styles.durationContainer}>
                    <Text style={styles.durationValue}>{formatDuration(service.duration).value}</Text>
                    <Text style={styles.durationUnit}>{formatDuration(service.duration).unit}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>


          {/* Availability Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={moderateScale(20)} color="#1C86FF" />
              <Text style={styles.sectionTitle}>Availability</Text>
            </View>
            {formatBusinessHours() ? (
              <View style={styles.businessHoursContainer}>
                {formatBusinessHours().map((daySchedule, index) => (
                  <View key={index} style={styles.businessHoursRow}>
                    <Text style={styles.businessHoursDay}>{daySchedule.day}</Text>
                    <Text style={[
                      styles.businessHoursTime,
                      daySchedule.closed && styles.businessHoursClosed
                    ]}>
                      {daySchedule.hours}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <>
                <Text style={styles.availabilityText}>Not specified</Text>
                <Text style={styles.availabilityNote}>
                  Service availability follows business operating hours
                </Text>
              </>
            )}
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: hp(6) }} />
        </View>
      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity
          style={[styles.floatingBusinessButton, loadingMessage && styles.floatingBusinessButtonDisabled]}
          onPress={handleBusinessPress}
          disabled={loadingMessage}
        >
          {businessData.images?.logo || businessData.logo ? (
            <Image source={{ uri: businessData.images?.logo || businessData.logo }} style={styles.floatingBusinessLogo} />
          ) : (
            <Ionicons name="business-outline" size={moderateScale(22)} color="#1C86FF" />
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.floatingBookButton} onPress={handleBooking}>
          <Ionicons name="calendar" size={moderateScale(20)} color="#fff" />
          <Text style={styles.floatingBookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>

      {/* Booking Confirmation Modal */}
      <BookingConfirmationModal
        visible={showBookingModal}
        onClose={handleCancelBooking}
        onConfirm={handleConfirmBooking}
        bookingData={getBookingData()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  backgroundimg: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.5 }],
  },
  backgroundImageStyle: {
    opacity: 0.08,
  },
  headerTitleStyle: {
    fontSize: scaleFontSize(20),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: moderateScale(16),
    fontSize: scaleFontSize(16),
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  errorTitle: {
    fontSize: scaleFontSize(24),
    fontWeight: 'bold',
    color: '#333',
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  errorText: {
    fontSize: scaleFontSize(16),
    color: '#666',
    textAlign: 'center',
    marginBottom: moderateScale(24),
  },
  retryButton: {
    backgroundColor: '#1C86FF',
    paddingHorizontal: moderateScale(32),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(12),
  },
  retryButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  heroImageContainer: {
    paddingHorizontal: wp(4),
    paddingTop: moderateScale(10),
  },
  heroImage: {
    width: '100%',
    height: hp(25),
    backgroundColor: '#f0f0f0',
    borderRadius: moderateScale(20),
    overflow: 'hidden',
  },
  heroImagePlaceholder: {
    width: '100%',
    height: hp(25),
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: moderateScale(20),
  },
  contentContainer: {
    backgroundColor: '#fff',
    marginHorizontal: wp(4),
    marginTop: moderateScale(15),
    marginBottom: moderateScale(10),
    borderRadius: moderateScale(20),
    paddingHorizontal: wp(5),
    paddingTop: moderateScale(20),
    paddingBottom: moderateScale(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
    marginBottom: moderateScale(16),
    flexWrap: 'wrap',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(7),
    borderRadius: moderateScale(20),
    gap: moderateScale(4),
  },
  tagText: {
    fontSize: scaleFontSize(12),
    fontWeight: '700',
    textTransform: 'capitalize',
    color: '#fff',
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(7),
    borderRadius: moderateScale(20),
    gap: moderateScale(4),
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  activeTagText: {
    color: '#fff',
    fontSize: scaleFontSize(12),
    fontWeight: '700',
  },
  section: {
    marginBottom: moderateScale(20),
    paddingBottom: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginBottom: moderateScale(12),
  },
  sectionTitle: {
    fontSize: scaleFontSize(17),
    fontWeight: 'bold',
    color: '#1C86FF',
  },
  descriptionText: {
    fontSize: scaleFontSize(14),
    color: '#555',
    lineHeight: moderateScale(22),
    marginTop: moderateScale(10),
  },
  businessProviderSection: {
    marginBottom: moderateScale(20),
    paddingBottom: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  businessProviderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginBottom: moderateScale(12),
  },
  businessProviderTitle: {
    fontSize: scaleFontSize(17),
    fontWeight: 'bold',
    color: '#1C86FF',
  },
  businessProviderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E8EAED',
    gap: moderateScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  businessLogo: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(10),
    backgroundColor: '#fff',
  },
  businessLogoPlaceholder: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(10),
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessProviderInfo: {
    flex: 1,
  },
  businessProviderName: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: moderateScale(4),
  },
  businessProviderType: {
    fontSize: scaleFontSize(13),
    color: '#666',
    textTransform: 'capitalize',
    marginBottom: moderateScale(4),
  },
  businessRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
  },
  businessRatingText: {
    fontSize: scaleFontSize(12),
    color: '#666',
  },
  // New Inline Info Row Design
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(20),
    paddingHorizontal: moderateScale(12),
    marginTop: moderateScale(10),
    marginBottom: moderateScale(10),
    borderWidth: 1,
    borderColor: '#E8EAED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  infoTextContainer: {
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  infoLabel: {
    fontSize: scaleFontSize(11),
    color: '#999',
    fontWeight: '600',
    marginBottom: moderateScale(3),
  },
  infoValue: {
    fontSize: scaleFontSize(13),
    fontWeight: 'bold',
    color: '#333',
    flexWrap: 'wrap',
  },
  durationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationValue: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  durationUnit: {
    fontSize: scaleFontSize(11),
    color: '#666',
    marginTop: moderateScale(2),
    textAlign: 'center',
  },
  infoDivider: {
    width: 1.5,
    height: moderateScale(45),
    backgroundColor: '#D0D0D0',
    marginHorizontal: moderateScale(4),
  },
  availabilityText: {
    fontSize: scaleFontSize(14),
    color: '#666',
    marginBottom: moderateScale(6),
  },
  availabilityNote: {
    fontSize: scaleFontSize(12),
    color: '#999',
    fontStyle: 'italic',
  },
  businessHoursContainer: {
    marginTop: moderateScale(8),
  },
  businessHoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    backgroundColor: '#F8F9FA',
    marginBottom: moderateScale(6),
    borderRadius: moderateScale(8),
  },
  businessHoursDay: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#333',
  },
  businessHoursTime: {
    fontSize: scaleFontSize(13),
    color: '#1C86FF',
    fontWeight: '500',
  },
  businessHoursClosed: {
    color: '#999',
    fontStyle: 'italic',
  },
  locationContactRow: {
    flexDirection: 'row',
    gap: moderateScale(12),
    alignItems: 'flex-start',
  },
  locationContainer: {
    flex: 1,
  },
  contactContainer: {
    flex: 1,
  },
  locationText: {
    fontSize: scaleFontSize(14),
    color: '#555',
    lineHeight: moderateScale(22),
    marginBottom: moderateScale(12),
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(4),
    borderRadius: moderateScale(5),
    borderWidth: 1,
    borderColor: '#1C86FF',
    gap: moderateScale(4),
  },
  mapButtonText: {
    color: '#1C86FF',
    fontSize: scaleFontSize(14),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  contactText: {
    fontSize: scaleFontSize(14),
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'center',
  },
  requirementGroup: {
    marginBottom: moderateScale(14),
  },
  requirementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    marginBottom: moderateScale(10),
  },
  requirementLabel: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(10),
  },
  requirementValue: {
    fontSize: scaleFontSize(14),
    color: '#555',
    lineHeight: moderateScale(22),
  },
  petTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  petTypeBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#1C86FF',
  },
  petTypeText: {
    fontSize: scaleFontSize(13),
    color: '#1C86FF',
    fontWeight: '600',
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: moderateScale(6),
  },
  bulletText: {
    fontSize: scaleFontSize(14),
    color: '#333',
    marginRight: moderateScale(8),
  },
  bulletContent: {
    flex: 1,
    fontSize: scaleFontSize(14),
    color: '#666',
    lineHeight: moderateScale(20),
  },
  timestampsContainer: {
    marginTop: moderateScale(8),
    paddingTop: moderateScale(16),
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginBottom: moderateScale(10),
  },
  timestampText: {
    fontSize: scaleFontSize(11),
    color: '#999',
    marginBottom: moderateScale(4),
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(14),
    paddingBottom: moderateScale(22),
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 15,
    flexDirection: 'row',
    gap: moderateScale(10),
  },
  floatingBusinessButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(14),
    borderWidth: 2,
    borderColor: '#1C86FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingBusinessButtonDisabled: {
    opacity: 0.6,
  },
  floatingBusinessLogo: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
  },
  floatingBookButton: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C86FF',
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(14),
    gap: moderateScale(10),
    shadowColor: '#1C86FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingBookButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(17),
    fontWeight: 'bold',
  },
});
