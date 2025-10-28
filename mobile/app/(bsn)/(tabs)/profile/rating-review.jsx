import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from "@config/api";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RatingReviewScreen() {
  const router = useRouter();
  const [selectedStarFilter, setSelectedStarFilter] = useState('all'); // 'all', '5', '4', '3', '2', '1'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [businessId, setBusinessId] = useState(null);
  const [bookingsWithRatings, setBookingsWithRatings] = useState([]);

  useEffect(() => {
    fetchBusinessIdAndRatings();
  }, []);

  const fetchBusinessIdAndRatings = async () => {
    try {
      setLoading(true);
      // Get business ID from AsyncStorage
      const storedBusinessId = await AsyncStorage.getItem('businessId');
      if (!storedBusinessId) {
        Alert.alert('Error', 'Business not found. Please complete your business profile.');
        router.back();
        return;
      }
      setBusinessId(storedBusinessId);
      await fetchRatings(storedBusinessId);
    } catch (error) {
      console.error('Error fetching business ID:', error);
      Alert.alert('Error', 'Failed to load business information');
    } finally {
      setLoading(false);
    }
  };

  const fetchRatings = async (bizId) => {
    try {
      // Fetch completed bookings with ratings
      const response = await apiClient.get('/bookings', {
        params: {
          businessId: bizId,
          status: 'completed',
          limit: 100, // Get more ratings
        }
      });

      if (response.data.success) {
        // Filter only bookings that have ratings
        const ratingsData = response.data.data.filter(booking => booking.rating && booking.rating.score);
        console.log('Fetched ratings:', ratingsData.length);
        setBookingsWithRatings(ratingsData);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
      Alert.alert('Error', 'Failed to load ratings and reviews');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (businessId) {
      await fetchRatings(businessId);
    }
    setRefreshing(false);
  };

  // Transform bookings data for UI
  const allReviews = bookingsWithRatings.map(booking => ({
    id: booking._id,
    bookingId: booking._id,
    customerName: `${booking.petOwnerId?.firstName || ''} ${booking.petOwnerId?.lastName || ''}`.trim() || 'Anonymous',
    rating: booking.rating?.score || 0,
    comment: booking.rating?.review || 'No comment provided',
    date: booking.rating?.createdAt || booking.createdAt,
    petName: booking.petId?.name || 'Pet',
    service: booking.serviceId?.name || 'Service',
    avatar: 'person',
    reply: booking.rating?.businessReply,
    replyDate: booking.rating?.businessReplyDate,
  }));

  // Filter by star rating
  const filterByStars = (reviews) => {
    if (selectedStarFilter === 'all') return reviews;
    return reviews.filter(review => review.rating === parseInt(selectedStarFilter));
  };

  // Filter by search query
  const filterBySearch = (reviews) => {
    if (!searchQuery.trim()) return reviews;
    const query = searchQuery.toLowerCase();
    return reviews.filter(review =>
      review.customerName.toLowerCase().includes(query) ||
      review.comment.toLowerCase().includes(query) ||
      review.petName.toLowerCase().includes(query) ||
      review.service.toLowerCase().includes(query)
    );
  };

  // Apply all filters
  const filteredReviews = filterBySearch(filterByStars(allReviews));

  // Count reviews by star rating
  const countByStar = (star) => {
    return allReviews.filter(review => review.rating === star).length;
  };

  // Calculate statistics
  const calculateStats = () => {
    if (allReviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
      };
    }

    const totalScore = allReviews.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = (totalScore / allReviews.length).toFixed(1);

    return {
      totalReviews: allReviews.length,
      averageRating: parseFloat(avgRating),
    };
  };

  const statistics = calculateStats();

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

  const renderReviewCard = (review) => (
    <View key={review.id} style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.customerAvatar}>
          <Ionicons name={review.avatar} size={moderateScale(24)} color="#1C86FF" />
        </View>
        <View style={styles.reviewHeaderInfo}>
          <Text style={styles.customerName}>{review.customerName}</Text>
          <Text style={styles.reviewDate}>{new Date(review.date).toLocaleDateString()}</Text>
        </View>
        {renderStars(review.rating)}
      </View>

      <Text style={styles.reviewComment}>{review.comment}</Text>

      <View style={styles.reviewMeta}>
        <View style={styles.petTag}>
          <Ionicons name="paw" size={moderateScale(14)} color="#1C86FF" />
          <Text style={styles.petTagText}>{review.petName}</Text>
        </View>
        <View style={styles.serviceTag}>
          <Ionicons name="briefcase" size={moderateScale(14)} color="#FF9B79" />
          <Text style={styles.serviceTagText}>{review.service}</Text>
        </View>
      </View>

      {review.reply && (
        <View style={styles.replyContainer}>
          <View style={styles.replyHeader}>
            <Ionicons name="arrow-undo" size={moderateScale(16)} color="#1C86FF" />
            <Text style={styles.replyLabel}>Your Reply</Text>
            <Text style={styles.replyDate}>{new Date(review.replyDate).toLocaleDateString()}</Text>
          </View>
          <Text style={styles.replyText}>{review.reply}</Text>
        </View>
      )}
    </View>
  );

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
        <Header
          backgroundColor="#1C86FF"
          titleColor="#fff"
          title="Rating & Reviews"
          showBack={true}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1C86FF" />
          <Text style={styles.loadingText}>Loading ratings...</Text>
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
      <Header
        backgroundColor="#1C86FF"
        titleColor="#fff"
        title="Rating & Reviews"
        showBack={true}
      />

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{statistics.averageRating}</Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= Math.floor(statistics.averageRating) ? 'star' : 'star-outline'}
                size={moderateScale(14)}
                color="#FFD700"
              />
            ))}
          </View>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{statistics.totalReviews}</Text>
          <Text style={styles.statLabel}>Total Reviews</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={moderateScale(20)} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search reviews by customer, pet, or service..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={moderateScale(20)} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Star Rating Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterTabsContainer}
        contentContainerStyle={styles.filterTabsContent}
      >
        <TouchableOpacity
          style={[styles.filterTab, selectedStarFilter === 'all' && styles.filterTabActive]}
          onPress={() => setSelectedStarFilter('all')}
        >
          <Text style={[styles.filterTabText, selectedStarFilter === 'all' && styles.filterTabTextActive]}>
            All ({allReviews.length})
          </Text>
        </TouchableOpacity>
        {[5, 4, 3, 2, 1].map((starCount) => (
          <TouchableOpacity
            key={starCount}
            style={[styles.filterTab, selectedStarFilter === starCount.toString() && styles.filterTabActive]}
            onPress={() => setSelectedStarFilter(starCount.toString())}
          >
            <Ionicons name="star" size={moderateScale(14)} color={selectedStarFilter === starCount.toString() ? '#FFD700' : '#999'} />
            <Text style={[styles.filterTabText, selectedStarFilter === starCount.toString() && styles.filterTabTextActive]}>
              {starCount} ({countByStar(starCount)})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1C86FF']}
            tintColor="#1C86FF"
          />
        }
      >
        {filteredReviews.map((review) => renderReviewCard(review))}

        {filteredReviews.length === 0 && allReviews.length > 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="filter-outline" size={moderateScale(80)} color="#ccc" />
            <Text style={styles.emptyStateText}>No reviews found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try adjusting your filters or search query
            </Text>
          </View>
        )}

        {allReviews.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="star-outline" size={moderateScale(80)} color="#ccc" />
            <Text style={styles.emptyStateText}>No reviews yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Reviews from completed bookings will appear here
            </Text>
          </View>
        )}
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(15),
    gap: moderateScale(10),
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statValue: {
    fontSize: scaleFontSize(24),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(4),
  },
  statLabel: {
    fontSize: scaleFontSize(12),
    color: '#666',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: wp(5),
    marginVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    gap: moderateScale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: scaleFontSize(14),
    color: '#333',
    paddingVertical: 0,
  },
  filterTabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterTabsContent: {
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(10),
    gap: moderateScale(8),
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(20),
    backgroundColor: '#F8F9FA',
    gap: moderateScale(6),
  },
  filterTabActive: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#1C86FF',
  },
  filterTabText: {
    fontSize: scaleFontSize(13),
    color: '#666',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#1C86FF',
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(15),
    paddingBottom: moderateScale(100),
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
    marginBottom: moderateScale(12),
  },
  reviewMeta: {
    flexDirection: 'row',
    gap: moderateScale(8),
    marginBottom: moderateScale(10),
  },
  petTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(8),
    gap: moderateScale(6),
  },
  petTagText: {
    fontSize: scaleFontSize(12),
    color: '#1C86FF',
    fontWeight: '500',
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(8),
    gap: moderateScale(6),
  },
  serviceTagText: {
    fontSize: scaleFontSize(12),
    color: '#FF9B79',
    fontWeight: '500',
  },
  replyContainer: {
    backgroundColor: '#F8F9FA',
    borderLeftWidth: moderateScale(3),
    borderLeftColor: '#1C86FF',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    marginTop: moderateScale(10),
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(8),
    gap: moderateScale(6),
  },
  replyLabel: {
    fontSize: scaleFontSize(13),
    fontWeight: '600',
    color: '#1C86FF',
    flex: 1,
  },
  replyDate: {
    fontSize: scaleFontSize(11),
    color: '#999',
  },
  replyText: {
    fontSize: scaleFontSize(13),
    color: '#333',
    lineHeight: scaleFontSize(18),
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: scaleFontSize(18),
    fontWeight: '600',
    color: '#666',
    marginTop: moderateScale(20),
  },
  emptyStateSubtext: {
    fontSize: scaleFontSize(14),
    color: '#999',
    textAlign: 'center',
    marginTop: moderateScale(8),
    paddingHorizontal: wp(10),
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
});
