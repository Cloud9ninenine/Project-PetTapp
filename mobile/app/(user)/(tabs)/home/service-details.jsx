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
  Linking,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

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
        console.log('=== Service Details - Business Data ===');
        console.log('Has images object:', !!data.businessData?.images);
        console.log('images.logo:', data.businessData?.images?.logo);
        console.log('Direct logo field:', data.businessData?.logo);
        console.log('Full businessData:', JSON.stringify(data.businessData, null, 2));

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

  // Handle email press
  const handleEmailPress = (email) => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`).catch((err) => {
      console.error('Error opening email:', err);
      Alert.alert('Error', 'Could not open email client');
    });
  };

  // Handle website press
  const handleWebsitePress = (website) => {
    if (!website) return;
    // Ensure the URL has a protocol
    let url = website;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    Linking.openURL(url).catch((err) => {
      console.error('Error opening website:', err);
      Alert.alert('Error', 'Could not open website');
    });
  };

  // Handle phone press
  const handlePhonePress = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch((err) => {
      console.error('Error opening phone:', err);
      Alert.alert('Error', 'Could not open phone dialer');
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
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={moderateScale(64)} color="#FF6B6B" />
          <Text style={styles.errorText}>{error || 'Service not found'}</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const serviceImage = service.imageUrl || null;

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("@assets/images/PetTapp pattern.png")}
        style={styles.backgroundimg}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="repeat"
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: hp(12) }}
      >
        {/* Hero Image Section with Overlay */}
        <View style={styles.heroSection}>
          {serviceImage ? (
            <Image source={{ uri: serviceImage }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImagePlaceholder, { backgroundColor: getCategoryColor(service.category) }]}>
              <Ionicons name="image" size={moderateScale(80)} color="rgba(255, 255, 255, 0.3)" />
            </View>
          )}

          {/* Overlay Gradient Effect */}
          <View style={styles.imageOverlay} />

          {/* Edge Fade Effects */}
          <LinearGradient
            colors={['#f5f7fa', 'transparent']}
            style={styles.topEdgeFade}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['transparent', '#f5f7fa']}
            style={styles.bottomEdgeFade}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['#f5f7fa', 'transparent', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.leftEdgeFade}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['transparent', 'transparent', '#f5f7fa']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.rightEdgeFade}
            pointerEvents="none"
          />

          {/* Back Button on Image */}
          <View style={styles.topButtonsContainer}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="arrow-back" size={moderateScale(28)} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Service Title Card Overlapping Image */}
          <View style={styles.titleCard}>
            {/* Business Logo */}
            {(businessData?.images?.logo || businessData?.logo) ? (
              <Image
                source={{ uri: businessData.images?.logo || businessData.logo }}
                style={styles.businessLogoInCard}
              />
            ) : (
              <View style={styles.businessLogoPlaceholder}>
                <Ionicons name="business" size={moderateScale(24)} color="#1C86FF" />
              </View>
            )}

            <Text style={styles.serviceTitleText} numberOfLines={2}>
              {service.name}
            </Text>
            <View style={styles.badgesRow}>
              <View style={styles.categoryBadge}>
                <Ionicons name="pricetag" size={moderateScale(14)} color="#FF9B79" />
                <Text style={styles.categoryBadgeText}>
                  {service.category.charAt(0).toUpperCase() + service.category.slice(1)}
                </Text>
              </View>
              <View style={styles.activeTag}>
                <Ionicons name="checkmark-circle" size={moderateScale(14)} color="#fff" />
                <Text style={styles.activeTagText}>Active</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Description Section */}
        {service.description && (
          <View style={styles.descriptionCard}>
            <View style={styles.descriptionHeader}>
              <Ionicons name="document-text-outline" size={moderateScale(20)} color="#1C86FF" />
              <Text style={styles.descriptionCardTitle}>Description</Text>
            </View>
            <Text
              style={styles.descriptionCardText}
              numberOfLines={isDescriptionExpanded ? undefined : 4}
            >
              {service.description}
            </Text>
            {service.description.length > 150 && (
              <TouchableOpacity
                style={styles.readMoreButton}
                onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              >
                <Text style={styles.readMoreText}>
                  {isDescriptionExpanded ? 'Show less' : 'Read more'}
                </Text>
                <Ionicons
                  name={isDescriptionExpanded ? 'chevron-up' : 'chevron-down'}
                  size={moderateScale(16)}
                  color="#1C86FF"
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Quick Info Cards */}
        <View style={styles.quickInfoContainer}>
          <View style={styles.quickInfoCard}>
            <View style={styles.iconCircle}>
              <Ionicons name="time-outline" size={moderateScale(20)} color="#1C86FF" />
            </View>
            <Text style={styles.quickInfoLabel}>Duration</Text>
            <Text style={styles.quickInfoValue}>{formatDurationString(service.duration)}</Text>
          </View>

          <View style={styles.quickInfoCard}>
            <View style={styles.iconCircle}>
              <Ionicons name="cash-outline" size={moderateScale(20)} color="#4CAF50" />
            </View>
            <Text style={styles.quickInfoLabel}>Price</Text>
            <Text style={styles.quickInfoValue}>{formatPrice(service.price)}</Text>
          </View>
        </View>

        {/* Rating Section */}
        {businessData?.ratings && (
          <View style={styles.ratingContainer}>
            <View style={styles.ratingHeader}>
              <Ionicons name="star" size={moderateScale(24)} color="#FFD700" />
              <Text style={styles.ratingTitle}>Service Rating</Text>
            </View>
            <View style={styles.ratingContent}>
              <Text style={styles.ratingScore}>
                {businessData.ratings.averageRating ? businessData.ratings.averageRating.toFixed(1) : '0.0'}
              </Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const rating = businessData.ratings.averageRating || 0;
                  const isFilled = star <= Math.floor(rating);
                  const isHalf = !isFilled && star <= Math.ceil(rating) && rating % 1 >= 0.5;

                  return (
                    <Ionicons
                      key={star}
                      name={isFilled ? 'star' : isHalf ? 'star-half' : 'star-outline'}
                      size={moderateScale(16)}
                      color="#FFD700"
                    />
                  );
                })}
              </View>
              <Text style={styles.ratingCount}>
                ({businessData.ratings.totalReviews || 0} {businessData.ratings.totalReviews === 1 ? 'review' : 'reviews'})
              </Text>
            </View>
          </View>
        )}

        {/* Content Container */}
        <View style={styles.contentContainer}>

          {/* Requirements Section */}
          {service.requirements && (
            <>
              <Text style={styles.sectionTitle}>Service Requirements</Text>
              <View style={styles.requirementsSection}>

                {/* Accepted Pet Types */}
                {service.requirements.petTypes && service.requirements.petTypes.length > 0 && (
                  <View style={styles.requirementItem}>
                    <Text style={styles.requirementLabel}>Pet Types</Text>
                    <View style={styles.petTypesChipsContainer}>
                      {service.requirements.petTypes.map((type, index) => (
                        <View key={index} style={styles.petTypeChip}>
                          <Text style={styles.petTypeChipText}>
                            {type === 'guinea-pig' ? 'Guinea Pig' : type.charAt(0).toUpperCase() + type.slice(1)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Age Restrictions */}
                {service.requirements.ageRestrictions && (service.requirements.ageRestrictions.minAge || service.requirements.ageRestrictions.maxAge) && (
                  <View style={styles.requirementItem}>
                    <Text style={styles.requirementLabel}>Age Restrictions</Text>
                    {service.requirements.ageRestrictions.minAge !== undefined && (
                      <View style={styles.bulletPoint}>
                        <View style={styles.bullet} />
                        <Text style={styles.bulletText}>
                          Minimum Age: {service.requirements.ageRestrictions.minAge} {service.requirements.ageRestrictions.minAge === 1 ? 'year' : 'years'}
                        </Text>
                      </View>
                    )}
                    {service.requirements.ageRestrictions.maxAge !== undefined && (
                      <View style={styles.bulletPoint}>
                        <View style={styles.bullet} />
                        <Text style={styles.bulletText}>
                          Maximum Age: {service.requirements.ageRestrictions.maxAge} {service.requirements.ageRestrictions.maxAge === 1 ? 'year' : 'years'}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Health Requirements */}
                {service.requirements.healthRequirements && service.requirements.healthRequirements.length > 0 && (
                  <View style={styles.requirementItem}>
                    <Text style={styles.requirementLabel}>Health Requirements</Text>
                    {service.requirements.healthRequirements.map((req, index) => (
                      <View key={index} style={styles.bulletPoint}>
                        <View style={styles.bullet} />
                        <Text style={styles.bulletText}>{req}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Special Notes */}
                {service.requirements.specialNotes && (
                  <View style={styles.requirementItem}>
                    <Text style={styles.requirementLabel}>Special Notes</Text>
                    <Text style={styles.requirementValue}>{service.requirements.specialNotes}</Text>
                  </View>
                )}
              </View>
            </>
          )}

          {/* Availability Section */}
          {formatBusinessHours() && (
            <>
              <Text style={styles.sectionTitle}>Availability & Business Hours</Text>
              <View style={styles.availabilitySection}>
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
            </>
          )}

          {/* Location and Contact Section */}
          {(businessData?.address || businessData?.addressString || businessData?.contactNumber || businessData?.contactInfo?.phone || businessData?.contactInfo?.email || businessData?.contactInfo?.website) && (
            <>
              <Text style={styles.sectionTitle}>Location & Contact</Text>
              <View style={styles.locationContactSection}>
                {/* Contact Number */}
                {(businessData?.contactNumber || businessData?.contactInfo?.phone) && (
                  <View style={styles.locationContactItem}>
                    <Ionicons name="call-outline" size={moderateScale(18)} color="#4CAF50" />
                    <View style={styles.locationContactTextContainer}>
                      <Text style={styles.locationContactLabel}>Contact</Text>
                      <TouchableOpacity onPress={() => handlePhonePress(businessData.contactNumber || businessData.contactInfo?.phone)}>
                        <Text style={styles.contactText}>
                          {businessData.contactNumber || businessData.contactInfo?.phone}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Email */}
                {businessData?.contactInfo?.email && (
                  <View style={styles.locationContactItem}>
                    <Ionicons name="mail-outline" size={moderateScale(18)} color="#1C86FF" />
                    <View style={styles.locationContactTextContainer}>
                      <Text style={styles.locationContactLabel}>Email</Text>
                      <TouchableOpacity onPress={() => handleEmailPress(businessData.contactInfo.email)}>
                        <Text style={styles.contactText}>{businessData.contactInfo.email}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Website */}
                {businessData?.contactInfo?.website && (
                  <View style={styles.locationContactItem}>
                    <Ionicons name="globe-outline" size={moderateScale(18)} color="#9C27B0" />
                    <View style={styles.locationContactTextContainer}>
                      <Text style={styles.locationContactLabel}>Website</Text>
                      <TouchableOpacity onPress={() => handleWebsitePress(businessData.contactInfo.website)}>
                        <Text style={styles.contactText} numberOfLines={1}>
                          {businessData.contactInfo.website}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Location */}
                {(businessData?.address || businessData?.addressString) && (
                  <View style={styles.locationContactItem}>
                    <Ionicons name="location-outline" size={moderateScale(18)} color="#FF9B79" />
                    <View style={styles.locationContactTextContainer}>
                      <Text style={styles.locationContactLabel}>Location</Text>
                      <TouchableOpacity style={styles.mapButton} onPress={handleSeeOnMaps}>
                        <Ionicons name="map" size={moderateScale(16)} color="#1C86FF" />
                        <Text style={styles.mapButtonText}>View on Maps</Text>
                        <Ionicons name="chevron-forward" size={moderateScale(14)} color="#1C86FF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </>
          )}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(60),
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
    paddingHorizontal: wp(8),
  },
  errorText: {
    fontSize: scaleFontSize(18),
    color: '#333',
    marginTop: moderateScale(16),
    marginBottom: moderateScale(24),
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },

  // Hero Section Styles
  heroSection: {
    position: 'relative',
    width: '100%',
    height: hp(40),
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  bottomEdgeFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: moderateScale(40),
  },
  topButtonsContainer: {
    position: 'absolute',
    top: moderateScale(50),
    left: wp(5),
    zIndex: 10,
  },
  circularButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleCard: {
    position: 'absolute',
    bottom: moderateScale(-30),
    left: wp(5),
    right: wp(5),
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    alignItems: 'center',
  },
  businessLogoInCard: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    marginBottom: moderateScale(12),
    borderWidth: 2,
    borderColor: '#E8EAED',
  },
  businessLogoPlaceholder: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(12),
    borderWidth: 2,
    borderColor: '#E8EAED',
  },
  serviceTitleText: {
    fontSize: scaleFontSize(22),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(12),
    textAlign: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    marginBottom: moderateScale(12),
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(12),
    gap: moderateScale(4),
  },
  categoryBadgeText: {
    fontSize: scaleFontSize(12),
    fontWeight: '600',
    color: '#FF9B79',
  },

  // Description Card (below title card)
  descriptionCard: {
    backgroundColor: '#fff',
    marginHorizontal: wp(5),
    marginTop: moderateScale(45),
    marginBottom: moderateScale(10),
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginBottom: moderateScale(12),
  },
  descriptionCardTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    color: '#333',
  },
  descriptionCardText: {
    fontSize: scaleFontSize(14),
    color: '#666',
    lineHeight: moderateScale(20),
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: moderateScale(8),
    paddingVertical: moderateScale(4),
    gap: moderateScale(4),
  },
  readMoreText: {
    fontSize: scaleFontSize(14),
    color: '#1C86FF',
    fontWeight: '600',
  },

  // Quick Info Cards
  quickInfoContainer: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    marginBottom: moderateScale(10),
    gap: moderateScale(10),
  },
  quickInfoCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  iconCircle: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  quickInfoLabel: {
    fontSize: scaleFontSize(11),
    color: '#999',
    marginBottom: moderateScale(4),
  },
  quickInfoValue: {
    fontSize: scaleFontSize(13),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },

  // Rating Section
  ratingContainer: {
    backgroundColor: '#fff',
    marginHorizontal: wp(5),
    marginBottom: moderateScale(10),
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    marginBottom: moderateScale(12),
  },
  ratingTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    color: '#333',
  },
  ratingContent: {
    alignItems: 'center',
  },
  ratingScore: {
    fontSize: scaleFontSize(32),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: moderateScale(4),
  },
  starsContainer: {
    flexDirection: 'row',
    gap: moderateScale(2),
    marginBottom: moderateScale(4),
  },
  ratingCount: {
    fontSize: scaleFontSize(12),
    color: '#666',
  },

  // Content Container
  contentContainer: {
    backgroundColor: '#fff',
    margin: wp(5),
    marginTop: moderateScale(10),
    padding: moderateScale(20),
    borderRadius: moderateScale(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(12),
    gap: moderateScale(4),
  },
  activeTagText: {
    color: '#fff',
    fontSize: scaleFontSize(12),
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#333',
    marginTop: moderateScale(15),
    marginBottom: moderateScale(10),
  },

  // Requirements Section
  requirementsSection: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E3F2FD',
    padding: moderateScale(16),
    marginTop: moderateScale(8),
  },
  requirementItem: {
    marginBottom: moderateScale(16),
  },
  requirementLabel: {
    fontSize: scaleFontSize(14),
    color: '#333',
    fontWeight: '600',
    marginBottom: moderateScale(12),
  },
  requirementValue: {
    fontSize: scaleFontSize(14),
    color: '#666',
    lineHeight: moderateScale(20),
    marginTop: moderateScale(8),
  },
  petTypesChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  petTypeChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#1C86FF',
  },
  petTypeChipText: {
    fontSize: scaleFontSize(13),
    color: '#1C86FF',
    fontWeight: '600',
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: moderateScale(8),
    paddingLeft: moderateScale(8),
  },
  bullet: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: '#1C86FF',
    marginRight: moderateScale(12),
    marginTop: moderateScale(6),
  },
  bulletText: {
    flex: 1,
    fontSize: scaleFontSize(14),
    color: '#666',
    lineHeight: moderateScale(20),
  },

  // Location & Contact Section
  locationContactSection: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E3F2FD',
    marginTop: moderateScale(8),
    padding: moderateScale(16),
  },
  locationContactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: moderateScale(16),
    gap: moderateScale(12),
  },
  locationContactTextContainer: {
    flex: 1,
  },
  locationContactLabel: {
    fontSize: scaleFontSize(13),
    color: '#333',
    fontWeight: '600',
    marginBottom: moderateScale(8),
  },
  contactText: {
    fontSize: scaleFontSize(14),
    color: '#4CAF50',
    fontWeight: '600',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#E3F2FD',
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#1C86FF',
    gap: moderateScale(6),
    alignSelf: 'flex-start',
  },
  mapButtonText: {
    color: '#1C86FF',
    fontSize: scaleFontSize(13),
    fontWeight: '600',
  },

  // Availability Section
  availabilitySection: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E3F2FD',
    padding: moderateScale(16),
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
