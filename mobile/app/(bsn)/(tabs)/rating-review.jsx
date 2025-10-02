import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';

export default function RatingReviewScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('pending');
  const [replyText, setReplyText] = useState({});

  const pendingReviews = [
    {
      id: 1,
      customerName: 'Sarah Johnson',
      rating: 5,
      comment: 'Excellent service! My dog loved the grooming session. Very professional and caring staff.',
      date: '2024-03-15',
      petName: 'Max',
      service: 'Pet Grooming',
      avatar: 'person',
    },
    {
      id: 2,
      customerName: 'Michael Chen',
      rating: 4,
      comment: 'Great experience overall. The facility is clean and the staff is friendly.',
      date: '2024-03-14',
      petName: 'Luna',
      service: 'Veterinary Check-up',
      avatar: 'person',
    },
  ];

  const repliedReviews = [
    {
      id: 3,
      customerName: 'Emma Garcia',
      rating: 5,
      comment: 'Best pet care service in the area! Highly recommend.',
      date: '2024-03-10',
      petName: 'Charlie',
      service: 'Pet Boarding',
      avatar: 'person',
      reply: 'Thank you so much for your kind words! We\'re delighted to hear that Charlie enjoyed his stay with us.',
      replyDate: '2024-03-11',
    },
    {
      id: 4,
      customerName: 'David Martinez',
      rating: 4,
      comment: 'Good service, reasonable prices. Will come back again.',
      date: '2024-03-08',
      petName: 'Whiskers',
      service: 'Pet Grooming',
      avatar: 'person',
      reply: 'We appreciate your feedback and look forward to seeing Whiskers again!',
      replyDate: '2024-03-09',
    },
  ];

  const statistics = {
    totalReviews: 128,
    averageRating: 4.9,
    pendingReviews: pendingReviews.length,
    repliedReviews: repliedReviews.length,
    breakdown: {
      5: 98,
      4: 22,
      3: 6,
      2: 1,
      1: 1,
    },
  };

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

  const handleReply = (reviewId) => {
    if (replyText[reviewId]?.trim()) {
      // Here you would typically save the reply to your backend
      alert(`Reply sent: ${replyText[reviewId]}`);
      setReplyText({ ...replyText, [reviewId]: '' });
    }
  };

  const renderReviewCard = (review, showReplyInput = false) => (
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

      {showReplyInput && !review.reply && (
        <View style={styles.replyInputContainer}>
          <TextInput
            style={styles.replyInput}
            placeholder="Write your reply..."
            placeholderTextColor="#999"
            value={replyText[review.id] || ''}
            onChangeText={(text) => setReplyText({ ...replyText, [review.id]: text })}
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => handleReply(review.id)}
          >
            <Ionicons name="send" size={moderateScale(20)} color="#fff" />
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

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
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#FF9B79' }]}>{statistics.pendingReviews}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'pending' && styles.tabActive]}
          onPress={() => setSelectedTab('pending')}
        >
          <Text style={[styles.tabText, selectedTab === 'pending' && styles.tabTextActive]}>
            Pending ({pendingReviews.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'replied' && styles.tabActive]}
          onPress={() => setSelectedTab('replied')}
        >
          <Text style={[styles.tabText, selectedTab === 'replied' && styles.tabTextActive]}>
            Replied ({repliedReviews.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {selectedTab === 'pending' && (
          <>
            {pendingReviews.map((review) => renderReviewCard(review, true))}
            {pendingReviews.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={moderateScale(80)} color="#4CAF50" />
                <Text style={styles.emptyStateText}>All caught up!</Text>
                <Text style={styles.emptyStateSubtext}>
                  No pending reviews to reply to
                </Text>
              </View>
            )}
          </>
        )}

        {selectedTab === 'replied' && (
          <>
            {repliedReviews.map((review) => renderReviewCard(review, false))}
            {repliedReviews.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles" size={moderateScale(80)} color="#ccc" />
                <Text style={styles.emptyStateText}>No replies yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Your replied reviews will appear here
                </Text>
              </View>
            )}
          </>
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: moderateScale(10),
  },
  tab: {
    flex: 1,
    paddingVertical: moderateScale(10),
    alignItems: 'center',
    borderRadius: moderateScale(8),
    backgroundColor: '#F8F9FA',
  },
  tabActive: {
    backgroundColor: '#E3F2FD',
  },
  tabText: {
    fontSize: scaleFontSize(14),
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
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
  replyInputContainer: {
    marginTop: moderateScale(15),
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: moderateScale(15),
  },
  replyInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    fontSize: scaleFontSize(14),
    color: '#333',
    minHeight: moderateScale(80),
    textAlignVertical: 'top',
    marginBottom: moderateScale(10),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sendButton: {
    flexDirection: 'row',
    backgroundColor: '#1C86FF',
    borderRadius: moderateScale(8),
    paddingVertical: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
  },
  sendButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(14),
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(60),
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
});
