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
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BookingConfirmationModal from '../home/BookingConfirmationModal';
import Header from '@components/Header';
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from '@config/api';


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
          
          // Fetch business data if available
          if (service.businessId) {
            try {
              // Handle case where businessId might be an object or string
              const businessId = typeof service.businessId === 'object' 
                ? service.businessId._id || service.businessId.id 
                : service.businessId;
              
              if (businessId) {
                const businessResponse = await apiClient.get(`/businesses/${businessId}`);
                if (businessResponse.status === 200 && businessResponse.data.success) {
                  setBusinessData(businessResponse.data.data);
                }
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
    // If service has an imageUrl from API, use it
    if (serviceData?.imageUrl) {
      return { uri: serviceData.imageUrl };
    }

    // Fallback to category-based images
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
    if (!availability) return 'Availability not specified';
    
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
      return 'Availability information unavailable';
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
    
    return {
    service: {
        id: serviceData._id,
      name: serviceData.name,
      type: serviceData.category,
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

  const handleConfirmBooking = () => {
    setShowBookingModal(false);
    // Navigate to service-scheduled page
    router.push({
      pathname: 'home/service-scheduled',
      params: {
        serviceName: serviceData.name,
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
        petName: 'Your Pet', // Default since no pet selection in service-details
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
          {/* Service Category */}
          <Text style={styles.serviceCategory}>
            {serviceData.category?.charAt(0).toUpperCase() + serviceData.category?.slice(1)} Service
          </Text>

          {/* Service Details */}
          <Text style={styles.sectionTitle}>Service Details</Text>
          <Text style={styles.description}>{String(serviceData.description || 'No description available')}</Text>

          {/* Service Information */}
          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>{formatDuration(serviceData.duration)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Price</Text>
              <Text style={styles.infoValue}>{formatPrice(serviceData.price)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Availability</Text>
              <Text style={styles.infoValue}>{formatAvailability(serviceData.availability)}</Text>
            </View>
          </View>

          {/* Business Information */}
          {businessData && (
            <>
              <Text style={styles.sectionTitle}>Business Information</Text>
              <View style={styles.businessInfo}>
                <Text style={styles.businessName}>{String(businessData.name || 'Business Name')}</Text>
                {businessData.address && (
                  <Text style={styles.businessAddress}>{String(businessData.address)}</Text>
                )}
                {businessData.contactNumber && (
                  <Text style={styles.businessContact}>{String(businessData.contactNumber)}</Text>
                )}
              </View>
            </>
          )}

          {/* Requirements */}
          {serviceData.requirements && (
            <>
              <Text style={styles.sectionTitle}>Requirements</Text>
              <View style={styles.requirementsSection}>
                {serviceData.requirements.petTypes && Array.isArray(serviceData.requirements.petTypes) && (
                  <View style={styles.requirementItem}>
                    <Text style={styles.requirementLabel}>Pet Types</Text>
                    <Text style={styles.requirementValue}>
                      {serviceData.requirements.petTypes.map(type => {
                        const stringType = String(type);
                        return stringType.charAt(0).toUpperCase() + stringType.slice(1);
                      }).join(', ')}
                    </Text>
                  </View>
                )}
                {serviceData.requirements.healthRequirements && Array.isArray(serviceData.requirements.healthRequirements) && (
                  <View style={styles.requirementItem}>
                    <Text style={styles.requirementLabel}>Health Requirements</Text>
                    <Text style={styles.requirementValue}>
                      {serviceData.requirements.healthRequirements.map(req => String(req)).join(', ')}
                    </Text>
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
          <Text style={styles.serviceCategory}>
            {serviceData.category?.charAt(0).toUpperCase() + serviceData.category?.slice(1)} Service
          </Text>

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
        <Header
          backgroundColor="#1C86FF"
          titleColor="#fff"
          customTitle={renderTitle()}
          showBack={true}
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
        <Header
          backgroundColor="#1C86FF"
          titleColor="#fff"
          customTitle={renderTitle()}
          showBack={true}
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
      {/* Header */}
      <Header
        backgroundColor="#1C86FF"
        titleColor="#fff"
        customTitle={renderTitle()}
        rightComponent={
          <TouchableOpacity onPress={() => setIsFavorite(!isFavorite)}>
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={moderateScale(28)}
              color="#fff"
            />
          </TouchableOpacity>
        }
        showBack={true}
      />
      <ScrollView style={styles.scrollView}>
        {/* Service Image */}
        <Image source={getServiceImage()} style={styles.serviceImage} />
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'details' && styles.activeTab]}
            onPress={() => setActiveTab('details')}
          >
            <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>
              Info
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
            onPress={() => setActiveTab('reviews')}
          >
            <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
              Reviews
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {renderTabContent()}
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>{formatPrice(serviceData.price)}</Text>
        </View>
        <TouchableOpacity style={styles.bookButton} onPress={handleBooking}>
          <Text style={styles.bookButtonText}>Book</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => router.push({
            pathname: `/(user)/(tabs)/messages/${serviceData._id}`,
            params: {
              serviceName: serviceData.name,
              fromService: 'true',
            }
          })}
        >
          <Text style={styles.chatButtonText}>Chat</Text>
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
    backgroundColor: '#f0f0f0',
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
    fontFamily: "SFProBold",
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  scrollView: {
    flex: 1,
  },
  serviceImage: {
    width: "90%",
    height: hp(35),
    resizeMode: 'cover',
    marginHorizontal: wp(5),
    marginTop: moderateScale(10),
    marginBottom: moderateScale(15),
    borderRadius: moderateScale(12),
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: wp(5),
    marginBottom: moderateScale(10),
    borderRadius: moderateScale(8),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: moderateScale(15),
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  activeTab: {
    backgroundColor: '#1C86FF',
  },
  tabText: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
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
  bottomActions: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(15),
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    borderTopLeftRadius: moderateScale(12),
    borderTopRightRadius: moderateScale(12),
  },
  priceContainer: {
    flex: 1,
  },
  priceText: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#1C86FF',
  },
  bookButton: {
    backgroundColor: '#1C86FF',
    paddingHorizontal: moderateScale(30),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(8),
    marginRight: moderateScale(10),
  },
  bookButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
  chatButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1C86FF',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(8),
  },
  chatButtonText: {
    color: '#1C86FF',
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
  businessInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    marginTop: moderateScale(16),
  },
  businessName: {
    fontSize: scaleFontSize(16),
    color: '#333',
    fontWeight: 'bold',
    marginBottom: moderateScale(8),
  },
  businessAddress: {
    fontSize: scaleFontSize(14),
    color: '#666',
    marginBottom: moderateScale(4),
  },
  businessContact: {
    fontSize: scaleFontSize(14),
    color: '#1C86FF',
    fontWeight: '500',
  },
  requirementsSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    marginTop: moderateScale(16),
  },
  requirementItem: {
    marginBottom: moderateScale(12),
  },
  requirementLabel: {
    fontSize: scaleFontSize(14),
    color: '#666',
    fontWeight: '500',
    marginBottom: moderateScale(4),
  },
  requirementValue: {
    fontSize: scaleFontSize(14),
    color: '#333',
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