import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ImageBackground,
  Image,
  ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '@components/Header';
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from '@config/api';
import { AlertModalWithButton } from '@components/modals/SharedModals';

export default function ReviewServiceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [booking, setBooking] = useState(null);
  const [serviceImage, setServiceImage] = useState(null);
  const [businessLogo, setBusinessLogo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);

  // State for custom alert modal
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: 'success', // 'success', 'error', 'info'
    title: '',
    message: '',
    onConfirm: null,
  });

  // Fetch booking details
  useEffect(() => {
    fetchBookingDetails();
  }, [params.bookingId]);

  // Show custom alert
  const showAlert = (type, title, message, onConfirm = null) => {
    setAlertConfig({ type, title, message, onConfirm });
    setShowAlertModal(true);
  };

  const fetchBookingDetails = async () => {
    try {
      setIsLoading(true);
      const bookingId = params.bookingId;

      if (!bookingId) {
        showAlert('error', 'Error', 'Booking ID not provided', () => {
          router.back();
        });
        return;
      }

      // Fetch booking data
      const response = await apiClient.get(`/bookings/${bookingId}`);

      if (response.data.success) {
        const bookingData = response.data.data;
        setBooking(bookingData);

        // Check if user has already submitted a review
        if (bookingData.rating && bookingData.rating.score) {
          setHasSubmittedReview(true);
          setRating(bookingData.rating.score);
          setReviewText(bookingData.rating.review || '');
        }

        // Fetch service image and business logo separately
        if (bookingData.serviceId?._id) {
          await fetchServiceImage(bookingData.serviceId._id);
        }
        if (bookingData.businessId?._id) {
          await fetchBusinessLogo(bookingData.businessId._id);
        }
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load booking details';
      showAlert('error', 'Error', errorMessage, () => {
        router.back();
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchServiceImage = async (serviceId) => {
    try {
      const response = await apiClient.get(`/services/${serviceId}`);
      if (response.data.success && response.data.data) {
        const imageUrl = response.data.data.imageUrl;
        setServiceImage(imageUrl);
      }
    } catch (error) {
      console.error('Error fetching service image:', error);
      setServiceImage(null);
    }
  };

  const fetchBusinessLogo = async (businessId) => {
    try {
      const response = await apiClient.get(`/businesses/${businessId}`);
      if (response.data.success && response.data.data) {
        const logoUrl = response.data.data.images?.logo || response.data.data.logo;
        setBusinessLogo(logoUrl);
      }
    } catch (error) {
      console.error('Error fetching business logo:', error);
      setBusinessLogo(null);
    }
  };

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText} numberOfLines={1}>
        Rate Service
      </Text>
    </View>
  );

  const handleStarPress = (selectedRating) => {
    // Don't allow changing rating if already submitted
    if (hasSubmittedReview) {
      return;
    }
    setRating(selectedRating);
  };

  const handleSubmit = async () => {
    // Prevent duplicate submissions
    if (hasSubmittedReview) {
      showAlert('info', 'Already Submitted', 'You have already submitted a review for this booking.');
      return;
    }

    if (rating === 0) {
      showAlert('error', 'Rating Required', 'Please select a rating before submitting.');
      return;
    }

    if (!reviewText.trim()) {
      showAlert('error', 'Review Required', 'Please write a review before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await apiClient.patch(`/bookings/${params.bookingId}/rating`, {
        score: rating,
        review: reviewText.trim(),
      });

      if (response.data.success) {
        // Mark as submitted to prevent duplicate submissions
        setHasSubmittedReview(true);

        // Update local booking state with the new rating
        setBooking(prevBooking => ({
          ...prevBooking,
          rating: {
            score: rating,
            review: reviewText.trim(),
            reviewDate: new Date().toISOString(),
          }
        }));

        showAlert('success', 'Review Submitted', 'Thank you for your feedback!', () => {
          // Navigate back after a short delay to allow user to see the success message
          setTimeout(() => {
            router.back();
          }, 500);
        });
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit review';
      showAlert('error', 'Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          backgroundColor="#1C86FF"
          titleColor="#fff"
          customTitle={renderTitle()}
          showBack={true}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1C86FF" />
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state - no booking data
  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          backgroundColor="#1C86FF"
          titleColor="#fff"
          customTitle={renderTitle()}
          showBack={true}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={moderateScale(60)} color="#FF6B6B" />
          <Text style={styles.errorText}>Booking not found</Text>
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
        source={require('@assets/images/PetTapp pattern.png')}
        style={styles.backgroundimg}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="repeat"
      />
      {/* Header */}
      <Header
        backgroundColor="#1C86FF"
        titleColor="#fff"
        customTitle={renderTitle()}
        showBack={true}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero Image Section */}
        <View style={styles.heroSection}>
          {serviceImage ? (
            <Image source={{ uri: serviceImage }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroImagePlaceholder}>
              <Ionicons name="image" size={moderateScale(80)} color="rgba(255, 255, 255, 0.3)" />
            </View>
          )}

          {/* Overlay Gradient Effect */}
          <View style={styles.imageOverlay} />

          {/* Edge Fade Effects */}
          <LinearGradient
            colors={['#FFFFFF', 'transparent']}
            style={styles.topEdgeFade}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['transparent', '#FFFFFF']}
            style={styles.bottomEdgeFade}
            pointerEvents="none"
          />

          {/* Service Title Card Overlapping Image */}
          <View style={styles.titleCard}>
            {/* Business Logo */}
            {businessLogo ? (
              <Image
                source={{ uri: businessLogo }}
                style={styles.businessLogoInCard}
              />
            ) : (
              <View style={styles.businessLogoPlaceholder}>
                <Ionicons name="business" size={moderateScale(24)} color="#1C86FF" />
              </View>
            )}

            <Text style={styles.businessNameText} numberOfLines={1}>
              {booking.businessId?.businessName || 'Business Name'}
            </Text>
            <Text style={styles.serviceNameText} numberOfLines={2}>
              {booking.serviceId?.name || 'Service'}
            </Text>
          </View>
        </View>

        {/* Rating Section */}
        <View style={styles.ratingSection}>
          {hasSubmittedReview && (
            <View style={styles.submittedBadge}>
              <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#4CAF50" />
              <Text style={styles.submittedBadgeText}>Review Submitted</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>How was your experience?</Text>
          <Text style={styles.sectionSubtitle}>
            {hasSubmittedReview ? 'Your rating' : 'Tap to rate'}
          </Text>

          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => handleStarPress(star)}
                style={styles.starButton}
                disabled={hasSubmittedReview}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={moderateScale(45)}
                  color={star <= rating ? (hasSubmittedReview ? '#4CAF50' : '#ff9b79') : '#E0E0E0'}
                />
              </TouchableOpacity>
            ))}
          </View>

          {rating > 0 && (
            <Text style={[styles.ratingText, hasSubmittedReview && styles.ratingTextSubmitted]}>
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </Text>
          )}
        </View>

        {/* Review Section */}
        <View style={styles.reviewSection}>
          <Text style={styles.sectionTitle}>
            {hasSubmittedReview ? 'Your review' : 'Share your experience'}
          </Text>
          <TextInput
            style={[styles.reviewInput, hasSubmittedReview && styles.reviewInputDisabled]}
            placeholder="Tell us about your experience with this service..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={6}
            value={reviewText}
            onChangeText={setReviewText}
            textAlignVertical="top"
            editable={!hasSubmittedReview}
          />
          {!hasSubmittedReview && (
            <Text style={styles.characterCount}>{reviewText.length} characters</Text>
          )}
        </View>
      </ScrollView>

      {/* Sticky Action Buttons Footer */}
      <View style={styles.stickyButtonsContainer}>
        {hasSubmittedReview ? (
          // Show only Back button when review is submitted
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleCancel}
          >
            <Ionicons name="arrow-back-circle" size={moderateScale(22)} color="#fff" />
            <Text style={styles.backButtonText}>Back to Details</Text>
          </TouchableOpacity>
        ) : (
          // Show Submit and Cancel buttons when review not submitted
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.submitButtonText}>Submitting...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={moderateScale(22)} color="#fff" />
                  <Text style={styles.submitButtonText}>Submit</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={isSubmitting}
            >
              <Ionicons name="close-circle-outline" size={moderateScale(22)} color="#FF6B6B" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Custom Alert Modal */}
      <AlertModalWithButton
        visible={showAlertModal}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onDismiss={() => {
          setShowAlertModal(false);
          if (alertConfig.onConfirm) {
            alertConfig.onConfirm();
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    paddingHorizontal: wp(2),
  },
  titleText: {
    color: '#fff',
    fontSize: scaleFontSize(24),
    fontFamily: 'SFProBold',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    paddingBottom: moderateScale(100),
  },
  heroSection: {
    position: 'relative',
    width: '100%',
    height: hp(35),
    marginBottom: moderateScale(50),
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  topEdgeFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: moderateScale(40),
  },
  bottomEdgeFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: moderateScale(40),
  },
  titleCard: {
    position: 'absolute',
    bottom: moderateScale(-30),
    left: wp(5),
    right: wp(5),
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
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
  businessNameText: {
    fontSize: scaleFontSize(18),
    fontWeight: '700',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: moderateScale(4),
  },
  serviceNameText: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: '#FF9B79',
    textAlign: 'center',
  },
  ratingSection: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(20),
    alignItems: 'center',
    marginBottom: moderateScale(20),
    marginHorizontal: wp(5),
    borderWidth: 1,
    borderColor: '#E3F2FD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  submittedBadge: {
    position: 'absolute',
    top: moderateScale(12),
    right: moderateScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(20),
    gap: moderateScale(6),
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  submittedBadgeText: {
    fontSize: scaleFontSize(12),
    fontWeight: '700',
    color: '#4CAF50',
    letterSpacing: 0.3,
  },
  sectionTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: moderateScale(8),
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: scaleFontSize(13),
    color: '#666',
    marginBottom: moderateScale(20),
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: moderateScale(10),
    marginBottom: moderateScale(15),
  },
  starButton: {
    padding: moderateScale(5),
  },
  ratingText: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: '#1C86FF',
    marginTop: moderateScale(5),
  },
  ratingTextSubmitted: {
    color: '#4CAF50',
  },
  reviewSection: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(20),
    marginBottom: moderateScale(20),
    marginHorizontal: wp(5),
    borderWidth: 1,
    borderColor: '#E3F2FD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(8),
    padding: moderateScale(15),
    fontSize: scaleFontSize(14),
    color: '#333',
    minHeight: moderateScale(120),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginTop: moderateScale(10),
  },
  reviewInputDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E8F5E9',
    color: '#666',
  },
  characterCount: {
    fontSize: scaleFontSize(11),
    color: '#999',
    textAlign: 'right',
    marginTop: moderateScale(6),
  },
  stickyButtonsContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(18),
    paddingBottom: moderateScale(26),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: moderateScale(14),
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: moderateScale(14),
    paddingVertical: hp(2),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(17),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: moderateScale(14),
    paddingVertical: hp(2),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    borderWidth: 2.5,
    borderColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  cancelButtonText: {
    color: '#FF6B6B',
    fontSize: scaleFontSize(17),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  submitButtonDisabled: {
    backgroundColor: '#A5D6A7',
    opacity: 0.6,
    shadowOpacity: 0.2,
  },
  backButton: {
    backgroundColor: '#1C86FF',
    borderRadius: moderateScale(14),
    paddingVertical: hp(2),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    shadowColor: '#1C86FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  backButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(17),
    fontWeight: '700',
    letterSpacing: 0.5,
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
});
