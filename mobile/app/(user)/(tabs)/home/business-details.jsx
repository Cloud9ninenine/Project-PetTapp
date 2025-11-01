import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ImageBackground,
  Alert,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from '@config/api';
import Header from '@components/Header';
import { isBusinessOpen } from "@utils/businessHelpers";
import { getBusinessOwner, getOrCreateConversation } from '@services/api/messageApiService';
import { ensureFirebaseAuth } from '@utils/firebaseAuthPersistence';
import { getConversationDetails } from '@utils/messageService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function BusinessDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [businessData, setBusinessData] = useState(null);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');
  const [loadingMessage, setLoadingMessage] = useState(false);

  // Fetch business data from API
  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        setIsLoading(true);
        const businessId = params.id;

        if (!businessId) {
          Alert.alert('Error', 'Business ID not provided');
          router.back();
          return;
        }

        // Fetch business details
        const businessResponse = await apiClient.get(`/businesses/${businessId}`);

        if (businessResponse.status === 200 && businessResponse.data.success) {
          const data = businessResponse.data.data;
          console.log('=== Business Data Structure ===');
          console.log('Has images object:', !!data.images);
          console.log('images.logo:', data.images?.logo);
          console.log('Direct logo field:', data.logo);
          console.log('Full images object:', JSON.stringify(data.images, null, 2));
          setBusinessData(data);

          // Fetch services for this business
          try {
            const servicesResponse = await apiClient.get(`/services/business/${businessId}`);

            if (servicesResponse.status === 200 && servicesResponse.data.success) {
              setServices(servicesResponse.data.data || []);
            }
          } catch (servicesError) {
            console.warn('Could not fetch services:', servicesError);
          }
        }
      } catch (error) {
        console.error('Error fetching business:', error);

        if (error.response) {
          const status = error.response.status;
          const errorMessage = error.response.data?.message || 'Unknown error occurred';

          if (status === 401) {
            Alert.alert('Authentication Error', 'Please log in again.');
            router.replace('/(auth)/login');
          } else if (status === 404) {
            Alert.alert('Error', 'Business not found.', [
              { text: 'OK', onPress: () => router.back() }
            ]);
          } else {
            Alert.alert('Error', `Failed to load business information: ${errorMessage}`);
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

    fetchBusinessData();
  }, [params.id]);

  // Debug: Log business data when it changes
  useEffect(() => {
    if (businessData) {
      console.log('Business Data:', {
        hasLocation: !!businessData.location,
        hasCoordinates: !!businessData.location?.coordinates,
        hasLatLong: !!(businessData.latitude && businessData.longitude),
        locationData: businessData.location,
        latitude: businessData.latitude,
        longitude: businessData.longitude
      });
    }
  }, [businessData]);

  const renderStars = (rating) => {
    const stars = [];
    const safeRating = rating && !isNaN(rating) ? rating : 0;
    const fullStars = Math.floor(safeRating);
    const hasHalfStar = safeRating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={moderateScale(14)} color="#FF9B79" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Ionicons key={i} name="star-half" size={moderateScale(14)} color="#FF9B79" />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={moderateScale(14)} color="#FF9B79" />);
      }
    }
    return stars;
  };

  const formatBusinessHours = (day) => {
    if (!businessData?.businessHours || !businessData.businessHours[day.toLowerCase()]) {
      return 'Closed';
    }

    const hours = businessData.businessHours[day.toLowerCase()];
    if (!hours.isOpen) {
      return 'Closed';
    }

    return `${hours.open} - ${hours.close}`;
  };

  const handleServicePress = (service) => {
    router.push({
      pathname: '/(user)/(tabs)/home/service-details',
      params: { id: service._id }
    });
  };

  const handleViewOnMap = () => {
    // Check multiple possible location field structures
    let latitude = null;
    let longitude = null;

    // Primary: Check for address.coordinates.latitude/longitude (as per backend schema)
    if (businessData?.address?.coordinates?.latitude && businessData?.address?.coordinates?.longitude) {
      latitude = businessData.address.coordinates.latitude;
      longitude = businessData.address.coordinates.longitude;
    }
    // Check for location.coordinates [longitude, latitude] format (GeoJSON)
    else if (businessData?.location?.coordinates && Array.isArray(businessData.location.coordinates)) {
      [longitude, latitude] = businessData.location.coordinates;
    }
    // Check for separate latitude/longitude fields
    else if (businessData?.latitude && businessData?.longitude) {
      latitude = businessData.latitude;
      longitude = businessData.longitude;
    }
    // Check for nested location fields
    else if (businessData?.location?.latitude && businessData?.location?.longitude) {
      latitude = businessData.location.latitude;
      longitude = businessData.location.longitude;
    }

    if (latitude && longitude) {
      console.log('Navigating to map with:', { latitude, longitude });
      router.push({
        pathname: '/(user)/(tabs)/home/business-map',
        params: {
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          businessName: businessData.businessName || 'Business Location'
        }
      });
    } else {
      console.log('Business data structure:', {
        hasAddress: !!businessData?.address,
        hasAddressCoordinates: !!businessData?.address?.coordinates,
        addressCoordinates: businessData?.address?.coordinates,
        location: businessData?.location
      });
      Alert.alert('Location Not Available', 'This business has not set their location coordinates.');
    }
  };

  const handleMessage = async () => {
    if (!businessData || !businessData._id) {
      Alert.alert('Error', 'Business information not available');
      return;
    }

    if (loadingMessage) return;

    try {
      setLoadingMessage(true);

      // Step 1: Ensure Firebase authentication is established FIRST
      console.log('🔐 Ensuring Firebase authentication...');
      const isFirebaseAuth = await ensureFirebaseAuth();

      if (!isFirebaseAuth) {
        throw new Error('Failed to authenticate with messaging service');
      }

      console.log('✅ Firebase authentication successful');

      // Step 2: Get business owner ID
      console.log('👤 Getting business owner for business:', businessData._id);
      const ownerData = await getBusinessOwner(businessData._id);

      if (!ownerData || !ownerData.ownerId) {
        throw new Error('Could not find business owner');
      }

      console.log('✅ Business owner found:', ownerData.ownerId);

      // Step 3: Get or create conversation with business owner
      console.log('💬 Getting or creating conversation...');
      const conversationData = await getOrCreateConversation(ownerData.ownerId);

      if (!conversationData || !conversationData.conversationId) {
        throw new Error('Could not create conversation - no conversation ID returned');
      }

      console.log('✅ Conversation ready:', conversationData.conversationId);

      // Step 4: Fetch participant details from Firestore (matches web version approach)
      console.log('📋 Fetching participant details from Firestore...');
      const conversationDetails = await getConversationDetails(conversationData.conversationId);

      if (!conversationDetails) {
        throw new Error('Could not fetch conversation details from Firestore');
      }

      // Get current user ID to identify the other participant
      const currentUserId = await AsyncStorage.getItem('userId');
      const currentFirebaseUid = `pettapp_${currentUserId}`;

      // Find the other participant (not current user)
      const otherParticipantUid = conversationDetails.participants?.find(
        uid => uid !== currentFirebaseUid
      );

      if (!otherParticipantUid) {
        throw new Error('Could not find other participant in conversation');
      }

      // Get participant details from conversation's participantDetails field
      const otherParticipantDetails = conversationDetails.participantDetails?.[otherParticipantUid];

      console.log('✅ Participant details loaded:', {
        participantUid: otherParticipantUid,
        fullName: otherParticipantDetails?.fullName,
        role: otherParticipantDetails?.role
      });

      // Step 5: Navigate to chat screen with participant details from Firestore
      console.log('🚀 Navigating to chat...');
      router.push({
        pathname: '/(user)/(tabs)/messages/chat',
        params: {
          conversationId: conversationData.conversationId,
          receiverId: otherParticipantDetails?.userId || ownerData.ownerId,
          receiverName: otherParticipantDetails?.fullName || 'Business Owner',
          receiverImage: otherParticipantDetails?.profileImage || '',
        },
      });
    } catch (error) {
      console.error('❌ Error starting conversation:', error);
      console.error('Error stack:', error.stack);

      // Provide user-friendly error messages based on the error
      let errorMessage = 'Could not start conversation. Please try again.';
      let errorTitle = 'Error';

      if (error.message.includes('authenticate')) {
        errorTitle = 'Authentication Error';
        errorMessage = 'Failed to connect to messaging service. Please check your connection and try again.';
      } else if (error.message.includes('business owner')) {
        errorTitle = 'Business Not Available';
        errorMessage = 'Could not find the business owner. They may have removed their account.';
      } else if (error.message.includes('conversation details') || error.message.includes('participant')) {
        errorTitle = 'Connection Issue';
        errorMessage = 'Could not load conversation details. Please wait a moment and try again.';
      } else if (error.message.includes('not available in Firestore')) {
        errorTitle = 'Connection Issue';
        errorMessage = 'The messaging service is taking longer than expected. Please wait a moment and try again.';
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        errorTitle = 'Network Error';
        errorMessage = 'Please check your internet connection and try again.';
      } else if (error.response?.status === 400 && error.response?.data?.message?.includes('different roles')) {
        errorTitle = 'Cannot Message';
        errorMessage = 'You cannot message other pet owners. You can only message businesses.';
      } else if (error.code === 'permission-denied') {
        errorTitle = 'Permission Error';
        errorMessage = 'Unable to access conversation. Please try again or contact support.';
      }

      Alert.alert(errorTitle, errorMessage, [{ text: 'OK' }]);
    } finally {
      setLoadingMessage(false);
    }
  };

  const renderServiceItem = ({ item }) => (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => handleServicePress(item)}
      activeOpacity={0.7}
    >
      {/* Service Image */}
      <View style={styles.serviceImageContainer}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.serviceImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.serviceImagePlaceholder}>
            <Ionicons name="briefcase-outline" size={moderateScale(24)} color="#FF9B79" />
          </View>
        )}
      </View>

      {/* Service Info */}
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName} numberOfLines={1}>
          {item?.name || 'Unnamed Service'}
        </Text>
        {item.category && typeof item.category === 'string' && (
          <Text style={styles.serviceCategory} numberOfLines={1}>
            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
          </Text>
        )}
        {item.description && (
          <Text style={styles.serviceDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.servicePriceRow}>
          <Text style={styles.servicePrice}>
            ₱{typeof item.price === 'object' ? (item.price?.amount || 0) : (item.price || 0)}
          </Text>
          {item.duration && (
            <Text style={styles.serviceDuration}>
              <Ionicons name="time-outline" size={moderateScale(12)} color="#666" />
              {' '}{item.duration} min
            </Text>
          )}
        </View>
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={moderateScale(20)} color="#ccc" />
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    if (!businessData) return null;

    if (activeTab === 'about') {
      return (
        <View style={styles.tabContent}>
          {/* Description */}
          {businessData.description && (
            <>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.description}>{businessData.description}</Text>
            </>
          )}

          {/* Contact Information */}
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoCard}>
            {businessData.contactInfo?.phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call" size={moderateScale(20)} color="#1C86FF" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{businessData.contactInfo.phone}</Text>
                </View>
              </View>
            )}
            {businessData.contactInfo?.email && (
              <View style={styles.infoRow}>
                <Ionicons name="mail" size={moderateScale(20)} color="#FF9B79" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{businessData.contactInfo.email}</Text>
                </View>
              </View>
            )}
            {businessData.contactInfo?.website && (
              <View style={styles.infoRow}>
                <Ionicons name="globe" size={moderateScale(20)} color="#4CAF50" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Website</Text>
                  <Text style={styles.infoValue}>{businessData.contactInfo.website}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Address */}
          {businessData.address && (
            <>
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.addressCard}>
                <Ionicons name="location" size={moderateScale(24)} color="#1C86FF" />
                <View style={styles.addressTextContainer}>
                  {(businessData.address.street || businessData.address.city) && (
                    <Text style={styles.addressText}>
                      {[businessData.address.street, businessData.address.city].filter(Boolean).join(', ')}
                    </Text>
                  )}
                  {(businessData.address.state || businessData.address.zipCode) && (
                    <Text style={styles.addressText}>
                      {[businessData.address.state, businessData.address.zipCode].filter(Boolean).join(' ')}
                    </Text>
                  )}
                  {businessData.address.country && (
                    <Text style={styles.addressText}>{businessData.address.country}</Text>
                  )}
                </View>
              </View>

              {/* See it on map button - always show if address exists */}
              <TouchableOpacity style={styles.mapButton} onPress={handleViewOnMap}>
                <Ionicons name="map" size={moderateScale(20)} color="#fff" />
                <Text style={styles.mapButtonText}>See it on map</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Business Hours */}
          {businessData.businessHours && (
            <>
              <Text style={styles.sectionTitle}>Business Hours</Text>
              <View style={styles.hoursCard}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <View key={day} style={styles.hourRow}>
                    <Text style={styles.dayText}>{day}</Text>
                    <Text style={styles.hourText}>{formatBusinessHours(day)}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Credentials */}
          {businessData.credentials && (
            <>
              <Text style={styles.sectionTitle}>Credentials & Certifications</Text>
              <View style={styles.credentialsCard}>
                {businessData.credentials.licenseNumber && (
                  <View style={styles.credentialItem}>
                    <Text style={styles.credentialLabel}>License Number</Text>
                    <Text style={styles.credentialValue}>{businessData.credentials.licenseNumber}</Text>
                  </View>
                )}
                {businessData.credentials.certifications && businessData.credentials.certifications.length > 0 && (
                  <View style={styles.credentialItem}>
                    <Text style={styles.credentialLabel}>Certifications</Text>
                    {businessData.credentials.certifications.map((cert, index) => (
                      <View key={index} style={styles.bulletPoint}>
                        <View style={styles.bullet} />
                        <Text style={styles.bulletText}>{cert}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {businessData.credentials.insuranceInfo && (
                  <View style={styles.credentialItem}>
                    <Text style={styles.credentialLabel}>Insurance Information</Text>
                    <Text style={styles.credentialValue}>{businessData.credentials.insuranceInfo}</Text>
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
          <Text style={styles.sectionTitle}>Services ({services.length})</Text>
          {services.length > 0 ? (
            <FlatList
              data={services}
              renderItem={renderServiceItem}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
              contentContainerStyle={styles.servicesList}
            />
          ) : (
            <View style={styles.noServicesContainer}>
              <Ionicons name="briefcase-outline" size={moderateScale(40)} color="#ccc" />
              <Text style={styles.noServicesText}>No services available</Text>
            </View>
          )}
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
          <Text style={styles.loadingText}>Loading business details...</Text>
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
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={moderateScale(60)} color="#FF6B6B" />
          <Text style={styles.errorText}>Business not found</Text>
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

      <Header title="Business Details" showBack={true} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Business Header Card */}
        <View style={styles.businessHeaderCard}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            {businessData.images?.logo || businessData.logo ? (
              <Image
                source={{ uri: businessData.images?.logo || businessData.logo }}
                style={styles.logo}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Ionicons name="business" size={moderateScale(40)} color="#1C86FF" />
              </View>
            )}
          </View>

          {/* Business Info */}
          <View style={styles.businessHeaderInfo}>
            <Text style={styles.businessName}>{businessData?.businessName || 'Business Name'}</Text>

            {/* Business Type Categories */}
            {businessData.businessType && (
              <View style={styles.businessTypesContainer}>
                {(Array.isArray(businessData.businessType) ? businessData.businessType : [businessData.businessType]).map((type, index) => (
                  typeof type === 'string' && (
                    <View key={index} style={styles.businessTypeBadge}>
                      <Ionicons name="pricetag" size={moderateScale(12)} color="#FF9B79" />
                      <Text style={styles.businessTypeText}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </View>
                  )
                ))}
              </View>
            )}

            {/* Ratings */}
            {businessData.ratings && (
              <View style={styles.ratingContainer}>
                <View style={styles.starsContainer}>
                  {renderStars(businessData.ratings.averageRating || 0)}
                </View>
                <Text style={styles.ratingText}>
                  {businessData.ratings.averageRating?.toFixed(1) || '0.0'} ({businessData.ratings.totalReviews || 0} reviews)
                </Text>
              </View>
            )}

            {/* Verification Badge and Business Status on same line */}
            <View style={styles.badgesRow}>
              {businessData.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={moderateScale(16)} color="#4CAF50" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}

              {businessData.businessHours && (() => {
                const { isOpen, status } = isBusinessOpen(businessData.businessHours);
                return (
                  <View style={[styles.statusBadge, isOpen ? styles.statusOpen : styles.statusClosed]}>
                    <View style={[styles.statusDot, isOpen ? styles.dotOpen : styles.dotClosed]} />
                    <Text style={styles.statusText}>{status}</Text>
                  </View>
                );
              })()}
            </View>

            {/* Chat Button */}
            <TouchableOpacity
              style={[styles.chatButton, loadingMessage && styles.chatButtonDisabled]}
              onPress={handleMessage}
              disabled={loadingMessage}
            >
              {loadingMessage ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="chatbubbles-outline" size={moderateScale(20)} color="#fff" />
                  <Text style={styles.chatButtonText}>Send a message</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'about' && styles.activeTab]}
            onPress={() => setActiveTab('about')}
          >
            <Ionicons
              name="information-circle"
              size={moderateScale(18)}
              color={activeTab === 'about' ? '#fff' : '#666'}
            />
            <Text style={[styles.tabText, activeTab === 'about' && styles.activeTabText]}>
              About
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'services' && styles.activeTab]}
            onPress={() => setActiveTab('services')}
          >
            <Ionicons
              name="briefcase"
              size={moderateScale(18)}
              color={activeTab === 'services' ? '#fff' : '#666'}
            />
            <Text style={[styles.tabText, activeTab === 'services' && styles.activeTabText]}>
              Services
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {renderTabContent()}

        {/* Bottom Spacing */}
        <View style={{ height: hp(6) }} />
      </ScrollView>
      </KeyboardAvoidingView>
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
  businessHeaderCard: {
    backgroundColor: '#fff',
    marginHorizontal: wp(5),
    marginTop: moderateScale(15),
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: moderateScale(15),
  },
  logo: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    borderWidth: 3,
    borderColor: '#E3F2FD',
  },
  logoPlaceholder: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1C86FF',
  },
  businessHeaderInfo: {
    alignItems: 'center',
    width: '100%',
  },
  businessName: {
    fontSize: scaleFontSize(24),
    fontWeight: 'bold',
    color: '#1C86FF',
    textAlign: 'center',
    marginBottom: moderateScale(8),
    fontFamily: 'SFProBold',
  },
  businessTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: moderateScale(6),
    marginBottom: moderateScale(10),
  },
  businessTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(12),
    gap: moderateScale(4),
  },
  businessTypeText: {
    fontSize: scaleFontSize(12),
    fontWeight: '600',
    color: '#FF9B79',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(8),
    gap: moderateScale(8),
  },
  starsContainer: {
    flexDirection: 'row',
    gap: moderateScale(2),
  },
  ratingText: {
    fontSize: scaleFontSize(13),
    color: '#666',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    marginTop: moderateScale(8),
    flexWrap: 'wrap',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(8),
    gap: moderateScale(4),
  },
  verifiedText: {
    fontSize: scaleFontSize(12),
    color: '#4CAF50',
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(12),
    gap: moderateScale(6),
  },
  statusOpen: {
    backgroundColor: '#E8F5E9',
  },
  statusClosed: {
    backgroundColor: '#FFEBEE',
  },
  statusDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
  },
  dotOpen: {
    backgroundColor: '#4CAF50',
  },
  dotClosed: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: scaleFontSize(13),
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: wp(5),
    marginTop: moderateScale(15),
    gap: moderateScale(10),
  },
  tab: {
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
  activeTab: {
    backgroundColor: '#1C86FF',
    borderColor: '#1C86FF',
  },
  tabText: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  tabContent: {
    backgroundColor: '#fff',
    marginHorizontal: wp(5),
    marginTop: moderateScale(15),
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
    marginTop: moderateScale(10),
    marginBottom: moderateScale(15),
    fontFamily: 'SFProBold',
  },
  description: {
    fontSize: scaleFontSize(14),
    color: '#666',
    lineHeight: moderateScale(22),
    marginBottom: moderateScale(15),
  },
  infoCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    marginBottom: moderateScale(15),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: moderateScale(15),
    gap: moderateScale(12),
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: scaleFontSize(12),
    color: '#999',
    marginBottom: moderateScale(4),
  },
  infoValue: {
    fontSize: scaleFontSize(14),
    color: '#333',
    fontWeight: '500',
  },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    marginBottom: moderateScale(15),
    gap: moderateScale(12),
  },
  addressTextContainer: {
    flex: 1,
  },
  addressText: {
    fontSize: scaleFontSize(14),
    color: '#333',
    lineHeight: moderateScale(20),
  },
  hoursCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    marginBottom: moderateScale(15),
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(8),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dayText: {
    fontSize: scaleFontSize(14),
    color: '#333',
    fontWeight: '500',
  },
  hourText: {
    fontSize: scaleFontSize(14),
    color: '#666',
  },
  credentialsCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    marginBottom: moderateScale(15),
  },
  credentialItem: {
    marginBottom: moderateScale(15),
  },
  credentialLabel: {
    fontSize: scaleFontSize(13),
    color: '#999',
    marginBottom: moderateScale(8),
  },
  credentialValue: {
    fontSize: scaleFontSize(14),
    color: '#333',
    fontWeight: '500',
    lineHeight: moderateScale(20),
    flexWrap: 'wrap',
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: moderateScale(6),
    paddingLeft: moderateScale(8),
  },
  bullet: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: '#1C86FF',
    marginRight: moderateScale(10),
    marginTop: moderateScale(6),
  },
  bulletText: {
    flex: 1,
    fontSize: scaleFontSize(14),
    color: '#666',
    lineHeight: moderateScale(20),
  },
  servicesList: {
    gap: moderateScale(12),
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  serviceImageContainer: {
    marginRight: moderateScale(12),
  },
  serviceImage: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(10),
  },
  serviceImagePlaceholder: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(10),
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
    marginRight: moderateScale(10),
  },
  serviceName: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(4),
  },
  serviceCategory: {
    fontSize: scaleFontSize(12),
    color: '#1C86FF',
    marginBottom: moderateScale(6),
  },
  serviceDescription: {
    fontSize: scaleFontSize(13),
    color: '#666',
    lineHeight: moderateScale(18),
    marginBottom: moderateScale(8),
  },
  servicePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  servicePrice: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  serviceDuration: {
    fontSize: scaleFontSize(12),
    color: '#666',
  },
  noServicesContainer: {
    alignItems: 'center',
    paddingVertical: moderateScale(40),
  },
  noServicesText: {
    fontSize: scaleFontSize(16),
    color: '#999',
    marginTop: moderateScale(12),
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
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C86FF',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(10),
    marginTop: moderateScale(10),
    gap: moderateScale(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  mapButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(15),
    fontWeight: '600',
    fontFamily: 'SFProSB',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C86FF',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(10),
    marginTop: moderateScale(15),
    gap: moderateScale(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    width: '100%',
  },
  chatButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(15),
    fontWeight: '600',
    fontFamily: 'SFProSB',
  },
  chatButtonDisabled: {
    opacity: 0.7,
  },
});
