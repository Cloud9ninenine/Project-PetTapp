import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale, scaleFontSize } from '@utils/responsive';

const RatingsDisplay = ({ data }) => {
  if (!data || data.totalRatings === 0) {
    return null;
  }

  const averageRating = data.averageRating || 0;
  const totalRatings = data.totalRatings || 0;

  // Render star rating
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(averageRating);
    const hasHalfStar = averageRating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Ionicons
            key={i}
            name="star"
            size={moderateScale(32)}
            color="#FFB300"
          />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <Ionicons
            key={i}
            name="star-half"
            size={moderateScale(32)}
            color="#FFB300"
          />
        );
      } else {
        stars.push(
          <Ionicons
            key={i}
            name="star-outline"
            size={moderateScale(32)}
            color="#FFB300"
          />
        );
      }
    }
    return stars;
  };

  // Get rating quality text
  const getRatingQuality = (rating) => {
    if (rating >= 4.5) return { text: 'Excellent', color: '#4CAF50' };
    if (rating >= 4.0) return { text: 'Very Good', color: '#8BC34A' };
    if (rating >= 3.5) return { text: 'Good', color: '#FFC107' };
    if (rating >= 3.0) return { text: 'Average', color: '#FF9800' };
    if (rating >= 2.0) return { text: 'Below Average', color: '#FF5722' };
    return { text: 'Poor', color: '#F44336' };
  };

  const ratingQuality = getRatingQuality(averageRating);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Customer Ratings</Text>

      <View style={styles.ratingContainer}>
        {/* Average Rating */}
        <View style={styles.averageRatingSection}>
          <Text style={styles.averageRatingValue}>{averageRating.toFixed(1)}</Text>
          <View style={styles.starsContainer}>{renderStars()}</View>
          <Text style={styles.totalRatingsText}>
            Based on {totalRatings} rating{totalRatings !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Rating Quality Badge */}
        <View style={[styles.qualityBadge, { backgroundColor: ratingQuality.color + '20' }]}>
          <Ionicons
            name="trophy"
            size={moderateScale(28)}
            color={ratingQuality.color}
          />
          <Text style={[styles.qualityText, { color: ratingQuality.color }]}>
            {ratingQuality.text}
          </Text>
        </View>
      </View>

      {/* Rating Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="people" size={moderateScale(24)} color="#1C86FF" />
          <Text style={styles.statValue}>{totalRatings}</Text>
          <Text style={styles.statLabel}>Total Reviews</Text>
        </View>

        <View style={styles.statItem}>
          <Ionicons name="thumbs-up" size={moderateScale(24)} color="#4CAF50" />
          <Text style={styles.statValue}>
            {((averageRating / 5) * 100).toFixed(0)}%
          </Text>
          <Text style={styles.statLabel}>Satisfaction</Text>
        </View>

        <View style={styles.statItem}>
          <Ionicons name="trending-up" size={moderateScale(24)} color="#FF9800" />
          <Text style={styles.statValue}>{averageRating > 4.0 ? 'High' : 'Good'}</Text>
          <Text style={styles.statLabel}>Performance</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    marginBottom: moderateScale(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(20),
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: moderateScale(20),
  },
  averageRatingSection: {
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  averageRatingValue: {
    fontSize: scaleFontSize(48),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: moderateScale(8),
  },
  starsContainer: {
    flexDirection: 'row',
    gap: moderateScale(4),
    marginBottom: moderateScale(8),
  },
  totalRatingsText: {
    fontSize: scaleFontSize(14),
    color: '#666',
  },
  qualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(20),
  },
  qualityText: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: moderateScale(12),
  },
  statItem: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    alignItems: 'center',
  },
  statValue: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#333',
    marginTop: moderateScale(8),
    marginBottom: moderateScale(4),
  },
  statLabel: {
    fontSize: scaleFontSize(11),
    color: '#666',
    textAlign: 'center',
  },
});

export default RatingsDisplay;
