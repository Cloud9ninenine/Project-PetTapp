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
  Modal,
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
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

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

      {/* Unified Statistics Card */}
      <View style={styles.statsContainer}>
        <View style={styles.unifiedStatCard}>
          <View style={styles.statLeft}>
            <Text style={styles.bigRatingValue}>{statistics.averageRating}</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= Math.floor(statistics.averageRating) ? 'star' : 'star-outline'}
                  size={moderateScale(18)}
                  color="#FFD700"
                />
              ))}
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statRight}>
            <Text style={styles.totalReviewsValue}>{statistics.totalReviews}</Text>
            <Text style={styles.totalReviewsLabel}>Total Reviews</Text>
          </View>
        </View>
      </View>

      {/* Search Bar and Filter */}
      <View style={styles.searchFilterRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={moderateScale(20)} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search reviews..."
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

        {/* Filter Dropdown Button */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterDropdown(true)}
        >
          <Ionicons name="filter" size={moderateScale(20)} color="#1C86FF" />
          {selectedStarFilter !== 'all' && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>1</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filter Dropdown Modal */}
      <Modal
        visible={showFilterDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilterDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterDropdown(false)}
        >
          <View style={styles.dropdownContainer}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Filter by Rating</Text>
              <TouchableOpacity onPress={() => setShowFilterDropdown(false)}>
                <Ionicons name="close" size={moderateScale(24)} color="#666" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.dropdownItem, selectedStarFilter === 'all' && styles.dropdownItemActive]}
              onPress={() => {
                setSelectedStarFilter('all');
                setShowFilterDropdown(false);
              }}
            >
              <Text style={[styles.dropdownItemText, selectedStarFilter === 'all' && styles.dropdownItemTextActive]}>
                All Reviews ({allReviews.length})
              </Text>
              {selectedStarFilter === 'all' && (
                <Ionicons name="checkmark" size={moderateScale(20)} color="#1C86FF" />
              )}
            </TouchableOpacity>

            {[5, 4, 3, 2, 1].map((starCount) => (
              <TouchableOpacity
                key={starCount}
                style={[styles.dropdownItem, selectedStarFilter === starCount.toString() && styles.dropdownItemActive]}
                onPress={() => {
                  setSelectedStarFilter(starCount.toString());
                  setShowFilterDropdown(false);
                }}
              >
                <View style={styles.dropdownItemLeft}>
                  <View style={styles.dropdownStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= starCount ? 'star' : 'star-outline'}
                        size={moderateScale(14)}
                        color="#FFD700"
                      />
                    ))}
                  </View>
                  <Text style={[styles.dropdownItemText, selectedStarFilter === starCount.toString() && styles.dropdownItemTextActive]}>
                    ({countByStar(starCount)})
                  </Text>
                </View>
                {selectedStarFilter === starCount.toString() && (
                  <Ionicons name="checkmark" size={moderateScale(20)} color="#1C86FF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

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
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(15),
  },
  unifiedStatCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  statLeft: {
    flex: 1,
    alignItems: 'center',
    paddingRight: moderateScale(15),
  },
  bigRatingValue: {
    fontSize: scaleFontSize(42),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(8),
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#E0E0E0',
  },
  statRight: {
    flex: 1,
    alignItems: 'center',
    paddingLeft: moderateScale(15),
  },
  totalReviewsValue: {
    fontSize: scaleFontSize(32),
    fontWeight: 'bold',
    color: '#FF9B79',
    marginBottom: moderateScale(4),
  },
  totalReviewsLabel: {
    fontSize: scaleFontSize(13),
    color: '#666',
    fontWeight: '600',
  },
  searchFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    marginBottom: moderateScale(10),
    gap: moderateScale(10),
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
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
  filterButton: {
    width: moderateScale(48),
    height: moderateScale(48),
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: moderateScale(6),
    right: moderateScale(6),
    backgroundColor: '#FF5252',
    borderRadius: moderateScale(8),
    width: moderateScale(16),
    height: moderateScale(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: scaleFontSize(10),
    color: '#fff',
    fontWeight: 'bold',
  },
  searchInput: {
    flex: 1,
    fontSize: scaleFontSize(14),
    color: '#333',
    paddingVertical: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(5),
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    width: '100%',
    maxWidth: moderateScale(400),
    maxHeight: '70%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dropdownTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#333',
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemActive: {
    backgroundColor: '#E3F2FD',
  },
  dropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
  },
  dropdownStars: {
    flexDirection: 'row',
    gap: moderateScale(2),
  },
  dropdownItemText: {
    fontSize: scaleFontSize(15),
    color: '#333',
    fontWeight: '500',
  },
  dropdownItemTextActive: {
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
