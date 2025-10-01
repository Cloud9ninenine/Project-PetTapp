import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BookingConfirmationModal from '../home/BookingConfirmationModal';
import { wp, moderateScale, scaleFontSize } from '@utils/responsive';

const { width } = Dimensions.get('window');

export default function ServiceDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('details');
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Get image based on service name or ID
  const getServiceImage = () => {
    const serviceName = params.name;
    if (serviceName === 'Animed Veterinary Clinic') {
      return require('@assets/images/serviceimages/17.png');
    } else if (serviceName === 'Vetfusion Animal Clinic') {
      return require('@assets/images/serviceimages/19.png');
    } else {
      return require('@assets/images/serviceimages/18.png'); // Default for PetCo
    }
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

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={moderateScale(16)} color="#FFD700" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Ionicons key={i} name="star-half" size={moderateScale(16)} color="#FFD700" />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={moderateScale(16)} color="#E0E0E0" />);
      }
    }
    return stars;
  };

  const handleBooking = () => {
    setShowBookingModal(true);
  };

  const handleConfirmBooking = () => {
    setShowBookingModal(false);
    // Here you would typically handle the actual booking logic
    // For now, we'll just close the modal
    alert('Booking confirmed!');
  };

  const handleCancelBooking = () => {
    setShowBookingModal(false);
  };

  const renderTabContent = () => {
    if (activeTab === 'details') {
      return (
        <View style={styles.tabContent}>
          <Text style={styles.sectionTitle}>Service Details</Text>
          <Text style={styles.description}>{serviceData.fullDescription}</Text>
        </View>
      );
    } else {
      return (
        <View style={styles.tabContent}>
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{serviceData.name}</Text>
        <TouchableOpacity style={styles.favoriteButton}>
          <Text style={styles.favoriteIcon}>♡</Text>
        </TouchableOpacity>
      </View>

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
              Details
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

        {/* Service Info */}
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{serviceData.name}</Text>
          <Text style={styles.serviceCategory}>{serviceData.category}</Text>
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {renderStars(serviceData.rating)}
            </View>
            <Text style={styles.ratingText}>({serviceData.rating})</Text>
          </View>
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
        <TouchableOpacity style={styles.chatButton}>
          <Text style={styles.chatButtonText}>Chat</Text>
        </TouchableOpacity>
      </View>

      {/* Booking Confirmation Modal */}
      <BookingConfirmationModal
        visible={showBookingModal}
        onClose={handleCancelBooking}
        onConfirm={handleConfirmBooking}
        serviceName={serviceData.name}
        serviceCategory={serviceData.category}
        servicePrice={serviceData.price}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  header: {
    backgroundColor: '#1C86FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(15),
    paddingTop: moderateScale(20),
  },
  backButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#fff',
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  favoriteButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    color: '#fff',
    fontSize: scaleFontSize(20),
  },
  scrollView: {
    flex: 1,
  },
  serviceImage: {
    width: '100%',
    height: moderateScale(250),
    resizeMode: 'cover',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: wp(5),
    marginTop: moderateScale(-20),
    borderRadius: moderateScale(8),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: moderateScale(2) },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(4),
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
  serviceInfo: {
    backgroundColor: '#fff',
    margin: wp(5),
    padding: moderateScale(20),
    borderRadius: moderateScale(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: moderateScale(2) },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(4),
  },
  serviceName: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(5),
  },
  serviceCategory: {
    fontSize: scaleFontSize(14),
    color: '#FF9B79',
    marginBottom: moderateScale(10),
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
    color: '#666',
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
    shadowOffset: { width: 0, height: moderateScale(2) },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(4),
  },
  sectionTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: moderateScale(15),
  },
  description: {
    fontSize: scaleFontSize(14),
    color: '#666',
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
    shadowOffset: { width: 0, height: moderateScale(-2) },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(4),
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
    borderRadius: moderateScale(25),
    marginRight: moderateScale(10),
  },
  bookButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
  chatButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1C86FF',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(25),
  },
  chatButtonText: {
    color: '#1C86FF',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
});