import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ImageBackground,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Header from '@components/Header';
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';

export default function ReviewServiceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const serviceData = {
    clinic: params.clinic || 'Pet Service',
    service: params.service || 'Service',
    bookingId: params.bookingId || 'N/A',
  };

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText} numberOfLines={1}>
        Rate Service
      </Text>
    </View>
  );

  const handleStarPress = (selectedRating) => {
    setRating(selectedRating);
  };

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    if (!reviewText.trim()) {
      Alert.alert('Review Required', 'Please write a review before submitting.');
      return;
    }

    // Show success message
    Alert.alert(
      'Review Submitted',
      'Thank you for your feedback!',
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const handleCancel = () => {
    router.back();
  };

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
        {/* Service Info Card */}
        <View style={styles.serviceCard}>
          <View style={styles.serviceIconContainer}>
            <Ionicons name="business" size={moderateScale(40)} color="#1C86FF" />
          </View>
          <Text style={styles.clinicName}>{serviceData.clinic}</Text>
          <Text style={styles.serviceName}>{serviceData.service}</Text>
          <Text style={styles.bookingId}>Booking ID: {serviceData.bookingId}</Text>
        </View>

        {/* Rating Section */}
        <View style={styles.ratingSection}>
          <Text style={styles.sectionTitle}>How was your experience?</Text>
          <Text style={styles.sectionSubtitle}>Tap to rate</Text>

          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => handleStarPress(star)}
                style={styles.starButton}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={moderateScale(45)}
                  color={star <= rating ? '#ff9b79' : '#E0E0E0'}
                />
              </TouchableOpacity>
            ))}
          </View>

          {rating > 0 && (
            <Text style={styles.ratingText}>
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
          <Text style={styles.sectionTitle}>Share your experience</Text>
          <TextInput
            style={styles.reviewInput}
            placeholder="Tell us about your experience with this service..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={6}
            value={reviewText}
            onChangeText={setReviewText}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>{reviewText.length} characters</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#fff" />
            <Text style={styles.submitButtonText}>Submit Review</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Ionicons name="close-circle-outline" size={moderateScale(20)} color="#666" />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(20),
    paddingBottom: moderateScale(40),
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(20),
    alignItems: 'center',
    marginBottom: moderateScale(25),
    borderWidth: 1,
    borderColor: '#E3F2FD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceIconContainer: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  clinicName: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#1C86FF',
    textAlign: 'center',
    marginBottom: moderateScale(4),
  },
  serviceName: {
    fontSize: scaleFontSize(15),
    color: '#FF9B79',
    textAlign: 'center',
    marginBottom: moderateScale(6),
  },
  bookingId: {
    fontSize: scaleFontSize(12),
    color: '#999',
    textAlign: 'center',
  },
  ratingSection: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(20),
    alignItems: 'center',
    marginBottom: moderateScale(20),
    borderWidth: 1,
    borderColor: '#E3F2FD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  reviewSection: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(20),
    marginBottom: moderateScale(20),
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
  characterCount: {
    fontSize: scaleFontSize(11),
    color: '#999',
    textAlign: 'right',
    marginTop: moderateScale(6),
  },
  buttonContainer: {
    gap: moderateScale(12),
  },
  submitButton: {
    backgroundColor: '#1C86FF',
    borderRadius: moderateScale(12),
    paddingVertical: hp(1.8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    shadowColor: '#1C86FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    paddingVertical: hp(1.8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
});
