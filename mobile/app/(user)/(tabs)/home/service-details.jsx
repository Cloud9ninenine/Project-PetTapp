import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ImageBackground,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BookingConfirmationModal from '../home/BookingConfirmationModal';
import Header from '@components/Header';
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from '@config/api';
import { isBusinessOpen } from "@utils/businessHelpers";


export default function ServiceDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('details');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [serviceData, setServiceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [businessData, setBusinessData] = useState(null);

  // Fetch service data from API
  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        setIsLoading(true);
        const serviceId = params.id;

        if (!serviceId) {
          Alert.alert('Error', 'Service ID not provided');
          router.back();
          return;
        }

        const response = await apiClient.get(`/services/${serviceId}`);

        if (response.status === 200 && response.data.success) {
          const service = response.data.data;
          console.log('Service data received:', {
            id: service._id,
            businessId: service.businessId,
            businessIdType: typeof service.businessId
          });
          setServiceData(service);

          // Business data is already populated in the service response
          // Check if businessId is populated (object) or just an ID (string)
          if (service.businessId && typeof service.businessId === 'object') {
            // Business data is already populated from the API
            const businessInfo = service.businessId;
            setBusinessData({
              _id: businessInfo._id,
              name: businessInfo.businessName,
              address: businessInfo.address?.street || businessInfo.address?.fullAddress || 'No address available',
              contactNumber: businessInfo.contactInfo?.phone || businessInfo.contactInfo?.phoneNumber || 'No contact available',
              businessType: businessInfo.businessType,
              ratings: businessInfo.ratings,
              businessHours: businessInfo.businessHours,
              isActive: businessInfo.isActive,
              isVerified: businessInfo.isVerified
            });
          } else if (service.businessId && typeof service.businessId === 'string') {
            // If only ID is returned, fetch full business data
            try {
              const businessResponse = await apiClient.get(`/businesses/${service.businessId}`);
              if (businessResponse.status === 200 && businessResponse.data.success) {
                setBusinessData(businessResponse.data.data);
              }
            } catch (businessError) {
              console.warn('Could not fetch business data:', businessError);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching service:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          serviceId: params.id
        });
        
        if (error.response) {
          const status = error.response.status;
          const errorMessage = error.response.data?.message || 'Unknown error occurred';
          
          if (status === 401) {
            Alert.alert('Authentication Error', 'Please log in again.');
            router.replace('/(auth)/login');
          } else if (status === 404) {
            Alert.alert('Error', 'Service not found.', [
              { text: 'OK', onPress: () => router.back() }
            ]);
          } else if (status === 400) {
            Alert.alert('Error', `Invalid request: ${errorMessage}`, [
              { text: 'OK', onPress: () => router.back() }
            ]);
          } else {
            Alert.alert('Error', `Failed to load service information: ${errorMessage}`);
          }
        } else if (error.request) {
          Alert.alert('Network Error', 'Please check your connection and try again.');
        } else {
          Alert.alert('Error', `Something went wrong: ${error.message}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceData();
  }, [params.id]);

  // Get service image - use API imageUrl or fallback to category-based images
  const getServiceImage = () => {
    // Priority 1: Use imageUrl from API response if available
    if (serviceData?.imageUrl && typeof serviceData.imageUrl === 'string') {
      return { uri: serviceData.imageUrl };
    }

    // Priority 2: Fallback to category-based images
    const category = serviceData?.category || params.serviceType;
    const serviceName = serviceData?.name || params.name;

    // Veterinary services
    if (category === 'veterinary') {
      if (serviceName === 'Animed Veterinary Clinic') {
        return require('@assets/images/serviceimages/17.png');
      } else if (serviceName === 'Vetfusion Animal Clinic') {
        return require('@assets/images/serviceimages/19.png');
      } else {
        return require('@assets/images/serviceimages/18.png');
      }
    }

    // Grooming services
    if (category === 'grooming') {
      return require('@assets/images/serviceimages/21.png');
    }

    // Boarding services
    if (category === 'boarding' || category === 'daycare') {
      if (serviceName === 'PetCity Daycare') {
        return require('@assets/images/serviceimages/16.png');
      }
      return require('@assets/images/serviceimages/22.png');
    }

    // Training services
    if (category === 'training') {
      return require('@assets/images/serviceimages/17.png');
    }

    // Emergency services
    if (category === 'emergency') {
      return require('@assets/images/serviceimages/19.png');
    }

    // Consultation services
    if (category === 'consultation') {
      return require('@assets/images/serviceimages/18.png');
    }

    // Default fallback
    return require('@assets/images/serviceimages/18.png');
  };

  // Format price for display
  const formatPrice = (priceObj) => {
    try {
      if (!priceObj) return 'Price not available';
      
      if (typeof priceObj === 'string') {
        return priceObj;
      }
      
      if (typeof priceObj === 'number') {
        return `₱${priceObj.toLocaleString()}`;
      }
      
      if (typeof priceObj === 'object') {
        const { amount, currency = 'PHP' } = priceObj;
        const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
        return `₱${numericAmount.toLocaleString()}`;
      }
      
      return 'Price not available';
    } catch (error) {
      console.warn('Error formatting price:', error);
      return 'Price not available';
    }
  };

  // Format duration for display
  const formatDuration = (duration) => {
    try {
      if (!duration) return 'Duration not specified';
      
      if (typeof duration === 'string') {
        return duration;
      }
      
      const numericDuration = typeof duration === 'number' ? duration : parseFloat(duration) || 0;
      
      if (numericDuration < 60) {
        return `${Math.round(numericDuration)} minutes`;
      }
      
      const hours = Math.floor(numericDuration / 60);
      const minutes = Math.round(numericDuration % 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    } catch (error) {
      console.warn('Error formatting duration:', error);
      return 'Duration not specified';
    }
  };

  // Format availability for display
  const formatAvailability = (availability) => {
    if (!availability) return 'Not specified';

    try {
      if (typeof availability === 'string') {
        return availability;
      }

      if (typeof availability === 'object') {
        // Handle different availability object structures
        if (availability.days && availability.timeSlots) {
          const days = Array.isArray(availability.days)
            ? availability.days.map(day =>
                typeof day === 'string' ? day.charAt(0).toUpperCase() + day.slice(1) : String(day)
              ).join(', ')
            : String(availability.days);

          const timeSlots = Array.isArray(availability.timeSlots)
            ? availability.timeSlots.map(slot => {
                if (typeof slot === 'object' && slot.start && slot.end) {
                  return `${slot.start} - ${slot.end}`;
                }
                return String(slot);
              }).join(', ')
            : String(availability.timeSlots);

          return `${days}\n${timeSlots}`;
        }

        // If it's an object but not the expected structure, stringify it safely
        return JSON.stringify(availability, null, 2);
      }

      return String(availability);
    } catch (error) {
      console.warn('Error formatting availability:', error);
      return 'Not available';
    }
  };

  // Format availability for quick info card (abbreviated)
  const formatAvailabilityShort = (availability) => {
    if (!availability) return 'N/A';

    try {
      if (typeof availability === 'string') {
        return availability.length > 15 ? availability.substring(0, 12) + '...' : availability;
      }

      if (typeof availability === 'object') {
        if (availability.days && Array.isArray(availability.days)) {
          const dayAbbreviations = {
            'monday': 'Mon',
            'tuesday': 'Tue',
            'wednesday': 'Wed',
            'thursday': 'Thu',
            'friday': 'Fri',
            'saturday': 'Sat',
            'sunday': 'Sun'
          };

          const abbrevDays = availability.days.map(day => {
            const dayLower = String(day).toLowerCase();
            return dayAbbreviations[dayLower] || day.substring(0, 3);
          });

          // Show count if more than 3 days
          if (abbrevDays.length > 3) {
            return `${abbrevDays.length} days/week`;
          } else if (abbrevDays.length === 7) {
            return 'Daily';
          } else {
            return abbrevDays.join(', ');
          }
        }
      }

      return 'See details';
    } catch (error) {
      return 'N/A';
    }
  };

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText} numberOfLines={1}>
        {serviceData?.name || 'Loading...'}
      </Text>
    </View>
  );

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={moderateScale(16)} color="#ff9b79" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Ionicons key={i} name="star-half" size={moderateScale(16)} color="#ff9b79" />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={moderateScale(16)} color="#ff9b79" />);
      }
    }
    return stars;
  };

  // Create booking data for confirmation modal
  const getBookingData = () => {
    if (!serviceData) return null;

    // Extract businessId - handle both populated (object) and unpopulated (string) cases
    let businessIdValue = null;
    if (typeof serviceData.businessId === 'object' && serviceData.businessId?._id) {
      businessIdValue = serviceData.businessId._id;
    } else if (typeof serviceData.businessId === 'string') {
      businessIdValue = serviceData.businessId;
    }

    return {
      service: {
        id: serviceData._id,
        businessId: businessIdValue,
        name: serviceData.name,
        type: serviceData.category,
        category: serviceData.category,
        imageUrl: serviceData.imageUrl,
        price: formatPrice(serviceData.price),
        duration: formatDuration(serviceData.duration),
      },
      business: businessData ? {
        id: businessData._id || businessData.id,
        name: businessData.name,
        address: businessData.address,
        contactNumber: businessData.contactNumber,
      } : null,
      availability: serviceData.availability,
      requirements: serviceData.requirements,
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
    // Navigate to service-scheduled page with booking result
    router.push({
      pathname: 'home/service-scheduled',
      params: {
        // Service information
        serviceName: bookingResult.service?.name || serviceData.name,
        serviceCategory: bookingResult.service?.type || serviceData.category,

        // Booking information
        bookingId: bookingResult.booking?._id,
        status: bookingResult.booking?.status,

        // Pet information
        petName: bookingResult.pet?.name || 'Your Pet',
        petSpecies: bookingResult.pet?.species,
        petBreed: bookingResult.pet?.breed,

        // Date and time
        date: bookingResult.date,
        time: bookingResult.time,

        // Payment and additional info
        paymentMethod: bookingResult.paymentMethod,
        totalAmount: bookingResult.booking?.totalAmount?.amount,
        currency: bookingResult.booking?.totalAmount?.currency,

        // Optional fields
        notes: bookingResult.notes || '',
        specialRequests: bookingResult.specialRequests || '',
      },
    });
  };

  const handleCancelBooking = () => {
    setShowBookingModal(false);
  };

  const renderTabContent = () => {
    if (!serviceData) {
      return (
        <View style={styles.tabContent}>
          <ActivityIndicator size="large" color="#1C86FF" />
          <Text style={styles.loadingText}>Loading service details...</Text>
        </View>
      );
    }

    if (activeTab === 'details') {
      return (
        <View style={styles.tabContent}>
          {/* Business Information */}
          {businessData && (
            <>
              <Text style={styles.sectionTitle}>Business Information</Text>
              <View style={styles.businessInfoCard}>
                <View style={styles.businessInfoRow}>
                  <Ionicons name="business" size={moderateScale(20)} color="#1C86FF" />
                  <View style={styles.businessInfoTextContainer}>
                    <Text style={styles.businessInfoLabel}>Provider</Text>
                    <Text style={styles.businessName}>{String(businessData.name || 'Business Name')}</Text>
                  </View>
                </View>
                {businessData.address && (
                  <View style={styles.businessInfoRow}>
                    <Ionicons name="location" size={moderateScale(20)} color="#FF9B79" />
                    <View style={styles.businessInfoTextContainer}>
                      <Text style={styles.businessInfoLabel}>Address</Text>
                      <Text style={styles.businessAddress}>{String(businessData.address)}</Text>
                    </View>
                  </View>
                )}
                {businessData.contactNumber && (
                  <View style={styles.businessInfoRow}>
                    <Ionicons name="call" size={moderateScale(20)} color="#4CAF50" />
                    <View style={styles.businessInfoTextContainer}>
                      <Text style={styles.businessInfoLabel}>Contact</Text>
                      <Text style={styles.businessContact}>{String(businessData.contactNumber)}</Text>
                    </View>
                  </View>
                )}
              </View>
            </>
          )}

          {/* Availability & Time Slots */}
          {serviceData.availability && (
            <>
              <Text style={styles.sectionTitle}>Availability & Time Slots</Text>
              <View style={styles.availabilitySection}>
                {serviceData.availability.days && Array.isArray(serviceData.availability.days) && (
                  <View style={styles.availabilityItem}>
                    <Ionicons name="calendar" size={moderateScale(18)} color="#1C86FF" />
                    <View style={styles.availabilityTextContainer}>
                      <Text style={styles.availabilityLabel}>Available Days</Text>
                      <View style={styles.daysContainer}>
                        {serviceData.availability.days.map((day, index) => (
                          <View key={index} style={styles.dayChip}>
                            <Text style={styles.dayChipText}>
                              {String(day).charAt(0).toUpperCase() + String(day).slice(1)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                )}
                {serviceData.availability.timeSlots && Array.isArray(serviceData.availability.timeSlots) && (
                  <View style={styles.availabilityItem}>
                    <Ionicons name="time" size={moderateScale(18)} color="#FF9B79" />
                    <View style={styles.availabilityTextContainer}>
                      <Text style={styles.availabilityLabel}>Time Slots</Text>
                      <View style={styles.timeSlotsContainer}>
                        {serviceData.availability.timeSlots.map((slot, index) => (
                          <View key={index} style={styles.timeSlotChip}>
                            <Text style={styles.timeSlotText}>
                              {typeof slot === 'object' && slot.start && slot.end
                                ? `${slot.start} - ${slot.end}`
                                : String(slot)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </>
          )}

          {/* Requirements */}
          {serviceData.requirements && (
            <>
              <Text style={styles.sectionTitle}>Service Requirements</Text>
              <View style={styles.requirementsSection}>
                {serviceData.requirements.petTypes && Array.isArray(serviceData.requirements.petTypes) && (
                  <View style={styles.requirementItem}>
                    <Text style={styles.requirementLabel}>Pet Types</Text>
                    {serviceData.requirements.petTypes.map((type, index) => (
                      <View key={index} style={styles.bulletPoint}>
                        <View style={styles.bullet} />
                        <Text style={styles.bulletText}>
                          {String(type).charAt(0).toUpperCase() + String(type).slice(1)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                {serviceData.requirements.healthRequirements && Array.isArray(serviceData.requirements.healthRequirements) && (
                  <View style={styles.requirementItem}>
                    <Text style={styles.requirementLabel}>Health Requirements</Text>
                    {serviceData.requirements.healthRequirements.map((req, index) => (
                      <View key={index} style={styles.bulletPoint}>
                        <View style={styles.bullet} />
                        <Text style={styles.bulletText}>{String(req)}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {serviceData.requirements.specialNotes && (
                  <View style={styles.requirementItem}>
                    <Text style={styles.requirementLabel}>Special Notes</Text>
                    <Text style={styles.requirementValue}>{String(serviceData.requirements.specialNotes)}</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      );
    } else {
      return (
        <View style={styles.tabContent}>
          {/* Reviews Section - Placeholder for future implementation */}
          <Text style={styles.sectionTitle}>Reviews</Text>
          <View style={styles.noReviewsContainer}>
            <Ionicons name="star-outline" size={moderateScale(40)} color="#ccc" />
            <Text style={styles.noReviewsText}>No reviews yet</Text>
            <Text style={styles.noReviewsSubtext}>Be the first to review this service</Text>
          </View>
        </View>
      );
    }
  };

  if (isLoading) {
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

  if (!serviceData) {
    return (
      <SafeAreaView style={styles.container}>
        <ImageBackground
          source={require("@assets/images/PetTapp pattern.png")}
          style={styles.backgroundimg}
          imageStyle={styles.backgroundImageStyle}
          resizeMode="repeat"
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={moderateScale(60)} color="#FF6B6B" />
          <Text style={styles.errorText}>Service not found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Image Section with Overlay */}
        <View style={styles.heroSection}>
          <Image source={getServiceImage()} style={styles.heroImage} />

          {/* Overlay Gradient Effect */}
          <View style={styles.imageOverlay} />

          {/* Back and Favorite Buttons on Image */}
          <View style={styles.topButtonsContainer}>
            <TouchableOpacity style={styles.circularButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={moderateScale(24)} color="#1C86FF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circularButton} onPress={() => setIsFavorite(!isFavorite)}>
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={moderateScale(24)}
                color={isFavorite ? "#FF9B79" : "#1C86FF"}
              />
            </TouchableOpacity>
          </View>

          {/* Service Title Card Overlapping Image */}
          <View style={styles.titleCard}>
            <View style={styles.titleRow}>
              <Text style={styles.serviceTitleText} numberOfLines={2}>
                {serviceData?.name || 'Loading...'}
              </Text>
              <View style={styles.categoryBadge}>
                <Ionicons name="pricetag" size={moderateScale(14)} color="#FF9B79" />
                <Text style={styles.categoryBadgeText}>
                  {serviceData?.category?.charAt(0).toUpperCase() + serviceData?.category?.slice(1)}
                </Text>
              </View>
            </View>
            {serviceData?.description && (
              <Text style={styles.descriptionPreview} numberOfLines={3}>
                {String(serviceData.description)}
              </Text>
            )}
          </View>
        </View>

        {/* Quick Info Cards */}
        <View style={styles.quickInfoContainer}>
          <View style={styles.quickInfoCard}>
            <View style={styles.iconCircle}>
              <Ionicons name="time-outline" size={moderateScale(20)} color="#1C86FF" />
            </View>
            <Text style={styles.quickInfoLabel}>Duration</Text>
            <Text style={styles.quickInfoValue}>{formatDuration(serviceData?.duration)}</Text>
          </View>

          <View style={styles.quickInfoCard}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar-outline" size={moderateScale(20)} color="#FF9B79" />
            </View>
            <Text style={styles.quickInfoLabel}>Available</Text>
            <Text style={styles.quickInfoValue} numberOfLines={2}>
              {formatAvailabilityShort(serviceData?.availability)}
            </Text>
          </View>

          <View style={styles.quickInfoCard}>
            <View style={styles.iconCircle}>
              <Ionicons name="cash-outline" size={moderateScale(20)} color="#4CAF50" />
            </View>
            <Text style={styles.quickInfoLabel}>Price</Text>
            <Text style={styles.quickInfoValue}>{formatPrice(serviceData?.price)}</Text>
          </View>
        </View>

        {/* Tab Navigation with Pills Design */}
        <View style={styles.tabPillsContainer}>
          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'details' && styles.activeTabPill]}
            onPress={() => setActiveTab('details')}
          >
            <Ionicons
              name="information-circle"
              size={moderateScale(18)}
              color={activeTab === 'details' ? '#fff' : '#666'}
            />
            <Text style={[styles.tabPillText, activeTab === 'details' && styles.activeTabPillText]}>
              Details
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'reviews' && styles.activeTabPill]}
            onPress={() => setActiveTab('reviews')}
          >
            <Ionicons
              name="star"
              size={moderateScale(18)}
              color={activeTab === 'reviews' ? '#fff' : '#666'}
            />
            <Text style={[styles.tabPillText, activeTab === 'reviews' && styles.activeTabPillText]}>
              Reviews
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {renderTabContent()}

        {/* Bottom Spacing for Fixed Button */}
        <View style={{ height: hp(10) }} />
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating Book Button */}
      <View style={styles.floatingButtonContainer}>
        <View style={styles.priceTagContainer}>
          <Text style={styles.priceTagLabel}>Starting from</Text>
          <Text style={styles.priceTagValue}>{formatPrice(serviceData?.price)}</Text>
        </View>
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

  backgroundImageStyle: { opacity: 0.08 },

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
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  topButtonsContainer: {
    position: 'absolute',
    top: moderateScale(10),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
  },
  circularButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(12),
  },
  serviceTitleText: {
    flex: 1,
    fontSize: scaleFontSize(22),
    fontFamily: 'SFProBold',
    color: '#1C86FF',
    marginRight: moderateScale(12),
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
  descriptionPreview: {
    fontSize: scaleFontSize(13),
    color: '#666',
    lineHeight: moderateScale(19),
  },

  // Quick Info Cards
  quickInfoContainer: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    marginTop: moderateScale(45),
    marginBottom: moderateScale(20),
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

  // Tab Pills Design
  tabPillsContainer: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    marginBottom: moderateScale(16),
    gap: moderateScale(12),
  },
  tabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(25),
    backgroundColor: '#fff',
    gap: moderateScale(6),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activeTabPill: {
    backgroundColor: '#1C86FF',
    borderColor: '#1C86FF',
  },
  tabPillText: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#666',
  },
  activeTabPillText: {
    color: '#fff',
  },
  serviceCategory: {
    fontSize: scaleFontSize(30),
    color: '#FF9B79',
    fontFamily:"SFProBold",
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(1),
  },
  ratingText: {
    fontSize: scaleFontSize(14),
    color: '#1C86FF',
    marginLeft: moderateScale(8),
    fontWeight: '500',
  },
  tabContent: {
    backgroundColor: '#fff',
    margin: wp(5),
    marginTop: 0,
    padding: moderateScale(20),
    borderRadius: moderateScale(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#333',
    marginTop: moderateScale(15),
    marginBottom: moderateScale(10),
  },
  description: {
    fontSize: scaleFontSize(14),
    color: 'black',
    lineHeight: moderateScale(20),
  },
  reviewCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: moderateScale(15),
    marginBottom: moderateScale(15),
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(5),
  },
  reviewUser: {
    fontSize: scaleFontSize(14),
    fontWeight: 'bold',
    color: '#333',
  },
  reviewDate: {
    fontSize: scaleFontSize(12),
    color: '#999',
  },
  reviewRating: {
    flexDirection: 'row',
    marginBottom: moderateScale(8),
  },
  reviewComment: {
    fontSize: scaleFontSize(14),
    color: '#666',
    lineHeight: moderateScale(18),
  },
  // Floating Button Container
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(12),
    paddingBottom: moderateScale(16),
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    gap: moderateScale(12),
  },
  priceTagContainer: {
    flex: 1,
  },
  priceTagLabel: {
    fontSize: scaleFontSize(11),
    color: '#999',
    marginBottom: moderateScale(2),
  },
  priceTagValue: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#1C86FF',
  },
  floatingBookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C86FF',
    paddingHorizontal: moderateScale(28),
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(25),
    gap: moderateScale(8),
    shadowColor: '#1C86FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingBookButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
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
  retryButton: {
    backgroundColor: '#1C86FF',
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(8),
  },
  retryButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    marginTop: moderateScale(16),
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(8),
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  infoLabel: {
    fontSize: scaleFontSize(14),
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: scaleFontSize(14),
    color: '#333',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: moderateScale(16),
  },
  businessInfoCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E3F2FD',
    marginTop: moderateScale(8),
    overflow: 'hidden',
  },
  businessInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: moderateScale(12),
  },
  businessInfoTextContainer: {
    flex: 1,
  },
  businessInfoLabel: {
    fontSize: scaleFontSize(11),
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: moderateScale(4),
  },
  businessName: {
    fontSize: scaleFontSize(16),
    color: '#333',
    fontWeight: 'bold',
  },
  businessAddress: {
    fontSize: scaleFontSize(14),
    color: '#666',
    lineHeight: moderateScale(20),
  },
  businessContact: {
    fontSize: scaleFontSize(14),
    color: '#4CAF50',
    fontWeight: '600',
  },

  // Availability Section
  availabilitySection: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E3F2FD',
    marginTop: moderateScale(8),
    padding: moderateScale(16),
  },
  availabilityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: moderateScale(16),
    gap: moderateScale(12),
  },
  availabilityTextContainer: {
    flex: 1,
  },
  availabilityLabel: {
    fontSize: scaleFontSize(13),
    color: '#333',
    fontWeight: '600',
    marginBottom: moderateScale(8),
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  dayChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: '#1C86FF',
  },
  dayChipText: {
    fontSize: scaleFontSize(12),
    color: '#1C86FF',
    fontWeight: '600',
  },
  timeSlotsContainer: {
    gap: moderateScale(8),
  },
  timeSlotChip: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#FF9B79',
    alignSelf: 'flex-start',
  },
  timeSlotText: {
    fontSize: scaleFontSize(13),
    color: '#FF9B79',
    fontWeight: '600',
  },
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
  noReviewsContainer: {
    alignItems: 'center',
    paddingVertical: moderateScale(40),
  },
  noReviewsText: {
    fontSize: scaleFontSize(18),
    color: '#666',
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  noReviewsSubtext: {
    fontSize: scaleFontSize(14),
    color: '#999',
    textAlign: 'center',
  },
});