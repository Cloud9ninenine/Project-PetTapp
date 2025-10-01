import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ImageBackground,
  useWindowDimensions,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BookingConfirmationModal from '../home/BookingConfirmationModal';
import Header from '@components/Header';
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';


export default function ServiceDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('details');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Get image based on service type and name
  const getServiceImage = () => {
    const serviceType = params.serviceType;
    const serviceName = params.name;

    // Veterinary services
    if (serviceType === 'veterinary' || !serviceType) {
      if (serviceName === 'Animed Veterinary Clinic') {
        return require('@assets/images/serviceimages/17.png');
      } else if (serviceName === 'Vetfusion Animal Clinic') {
        return require('@assets/images/serviceimages/19.png');
      } else {
        return require('@assets/images/serviceimages/18.png');
      }
    }

    // Grooming services
    if (serviceType === 'grooming') {
      return require('@assets/images/serviceimages/21.png');
    }

    // Boarding services
    if (serviceType === 'boarding') {
      if (serviceName === 'PetCity Daycare') {
        return require('@assets/images/serviceimages/16.png');
      }
      return require('@assets/images/serviceimages/22.png');
    }

    // Delivery services
    if (serviceType === 'delivery') {
      return require('@assets/images/serviceimages/23.png');
    }

    // Default fallback
    return require('@assets/images/serviceimages/18.png');
  };

  // Mock data - in a real app, you'd fetch this based on the service ID
  const serviceData = {
    id: params.id || 1,
    name: params.name || 'PetCo Clinic',
    category: params.category || 'Veterinary Service',
    price: params.price || '₱XXX,XXX',
    rating: parseFloat(params.rating) || 4.9,
    image: getServiceImage(),
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    fullDescription: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    reviews: [
      {
        id: 1,
        user: 'John Doe',
        rating: 5,
        comment: 'Excellent service! My pet was well taken care of.',
        date: '2 days ago'
      },
      {
        id: 2,
        user: 'Jane Smith',
        rating: 4,
        comment: 'Good experience overall. Professional staff.',
        date: '1 week ago'
      }
    ]
  };

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText} numberOfLines={1}>
        {serviceData.name}
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

  // Create mock booking data for confirmation modal
  const mockBookingData = {
    service: {
      name: serviceData.name,
      type: serviceData.category,
    },
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
    if (activeTab === 'details') {
      return (
        <View style={styles.tabContent}>
          {/* Petshop Info */}
          <Text style={styles.serviceCategory}>{serviceData.category}</Text>
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {renderStars(serviceData.rating)}
            </View>
            <Text style={styles.ratingText}>({serviceData.rating})</Text>
          </View>

          {/* Service Details */}
          <Text style={styles.sectionTitle}>Service Details</Text>
          <Text style={styles.description}>{serviceData.fullDescription}</Text>
        </View>
      );
    } else {
      return (
        <View style={styles.tabContent}>
          {/* Petshop Info */}
          <Text style={styles.serviceCategory}>{serviceData.category}</Text>
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {renderStars(serviceData.rating)}
            </View>
            <Text style={styles.ratingText}>({serviceData.rating})</Text>
          </View>

          {/* Reviews */}
          <Text style={styles.sectionTitle}>Reviews</Text>
          {serviceData.reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewUser}>{review.user}</Text>
                <Text style={styles.reviewDate}>{review.date}</Text>
              </View>
              <View style={styles.reviewRating}>
                {renderStars(review.rating)}
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
            </View>
          ))}
        </View>
      );
    }
  };

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
      />
      <ScrollView style={styles.scrollView}>
        {/* Service Image */}
        <Image source={serviceData.image} style={styles.serviceImage} />
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
          <Text style={styles.priceText}>{serviceData.price}</Text>
        </View>
        <TouchableOpacity style={styles.bookButton} onPress={handleBooking}>
          <Text style={styles.bookButtonText}>Book</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => router.push({
            pathname: `/(user)/(tabs)/messages/${serviceData.id}`,
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
        bookingData={mockBookingData}
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
});