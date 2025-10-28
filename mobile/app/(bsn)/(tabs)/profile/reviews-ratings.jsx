import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';

export default function ReviewsRatingsScreen() {
  const businessRating = {
    average: 4.9,
    totalReviews: 128,
    breakdown: {
      5: 98,
      4: 22,
      3: 6,
      2: 1,
      1: 1,
    },
  };

  const reviews = [
    {
      id: 1,
      customerName: 'Sarah Johnson',
      rating: 5,
      comment: 'Excellent service! My dog loved the grooming session. Very professional and caring staff.',
      date: '2 days ago',
      petName: 'Max',
    },
    {
      id: 2,
      customerName: 'Michael Chen',
      rating: 5,
      comment: 'Very professional vet service. Dr. Maria was very thorough with the check-up.',
      date: '5 days ago',
      petName: 'Luna',
    },
    {
      id: 3,
      customerName: 'Emma Garcia',
      rating: 4,
      comment: 'Great experience overall. The facility is clean and the staff is friendly. Would recommend!',
      date: '1 week ago',
      petName: 'Charlie',
    },
    {
      id: 4,
      customerName: 'David Martinez',
      rating: 5,
      comment: 'Best pet care service in the area! My cat has never been so happy after grooming.',
      date: '1 week ago',
      petName: 'Whiskers',
    },
    {
      id: 5,
      customerName: 'Lisa Anderson',
      rating: 4,
      comment: 'Good service, reasonable prices. The boarding facility is very comfortable.',
      date: '2 weeks ago',
      petName: 'Rocky',
    },
    {
      id: 6,
      customerName: 'James Wilson',
      rating: 5,
      comment: 'Highly recommend! They took great care of my puppy during his first check-up.',
      date: '2 weeks ago',
      petName: 'Buddy',
    },
  ];

  const renderStars = (rating) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={moderateScale(16)}
            color="#FFD700"
          />
        ))}
      </View>
    );
  };

  const renderRatingBar = (stars, count) => {
    const percentage = (count / businessRating.totalReviews) * 100;
    return (
      <View style={styles.ratingBarRow}>
        <Text style={styles.ratingBarLabel}>{stars}⭐</Text>
        <View style={styles.ratingBarBackground}>
          <View style={[styles.ratingBarFill, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.ratingBarCount}>{count}</Text>
      </View>
    );
  };

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
        title="Reviews & Ratings"
        showBack={true}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Overall Rating Card */}
        <View style={styles.overallCard}>
          <View style={styles.overallRatingSection}>
            <Text style={styles.overallRating}>{businessRating.average}</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= Math.floor(businessRating.average) ? 'star' : 'star-outline'}
                  size={moderateScale(24)}
                  color="#FFD700"
                />
              ))}
            </View>
            <Text style={styles.totalReviews}>
              Based on {businessRating.totalReviews} reviews
            </Text>
          </View>

          <View style={styles.ratingBreakdown}>
            {[5, 4, 3, 2, 1].map((stars) => renderRatingBar(stars, businessRating.breakdown[stars]))}
          </View>
        </View>

        {/* Reviews List */}
        <View style={styles.reviewsSection}>
          <Text style={styles.sectionTitle}>Customer Reviews</Text>
          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.customerAvatar}>
                  <Ionicons name="person" size={moderateScale(24)} color="#1C86FF" />
                </View>
                <View style={styles.reviewHeaderInfo}>
                  <Text style={styles.customerName}>{review.customerName}</Text>
                  <Text style={styles.reviewDate}>{review.date}</Text>
                </View>
                {renderStars(review.rating)}
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
              <View style={styles.petTag}>
                <Ionicons name="paw" size={moderateScale(14)} color="#1C86FF" />
                <Text style={styles.petTagText}>{review.petName}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
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
  content: {
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(20),
    paddingBottom: moderateScale(100),
  },
  overallCard: {
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
  overallRatingSection: {
    alignItems: 'center',
    paddingBottom: moderateScale(20),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  overallRating: {
    fontSize: scaleFontSize(48),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(8),
  },
  totalReviews: {
    fontSize: scaleFontSize(14),
    color: '#666',
    marginTop: moderateScale(8),
  },
  ratingBreakdown: {
    marginTop: moderateScale(20),
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  ratingBarLabel: {
    fontSize: scaleFontSize(14),
    color: '#333',
    width: moderateScale(40),
  },
  ratingBarBackground: {
    flex: 1,
    height: moderateScale(8),
    backgroundColor: '#E0E0E0',
    borderRadius: moderateScale(4),
    marginHorizontal: moderateScale(10),
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: moderateScale(4),
  },
  ratingBarCount: {
    fontSize: scaleFontSize(14),
    color: '#666',
    width: moderateScale(40),
    textAlign: 'right',
  },
  reviewsSection: {
    marginTop: moderateScale(10),
  },
  sectionTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(15),
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    marginBottom: moderateScale(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  customerAvatar: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  reviewHeaderInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: scaleFontSize(15),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(2),
  },
  reviewDate: {
    fontSize: scaleFontSize(12),
    color: '#999',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: moderateScale(2),
  },
  reviewComment: {
    fontSize: scaleFontSize(14),
    color: '#333',
    lineHeight: scaleFontSize(20),
    marginBottom: moderateScale(10),
  },
  petTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
    gap: moderateScale(6),
  },
  petTagText: {
    fontSize: scaleFontSize(12),
    color: '#1C86FF',
    fontWeight: '500',
  },
});
