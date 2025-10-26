import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore';
import { firestore, auth } from '@config/firebase';
import { signOut } from 'firebase/auth';
import { ensureFirebaseAuth } from '@utils/firebaseAuthPersistence';
import { debugAllConversations } from '@utils/debugFirestore';
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';

export default function MessagesScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [firebaseAuthenticated, setFirebaseAuthenticated] = useState(false);

  useEffect(() => {
    let unsubscribeConversations = null;

    const initialize = async () => {
      unsubscribeConversations = await initializeFirebaseAuth();
    };

    initialize();

    // Cleanup on unmount
    return () => {
      if (unsubscribeConversations) {
        console.log('Unsubscribing from conversations...');
        unsubscribeConversations();
      }
    };
  }, []);

  const initializeFirebaseAuth = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');

      if (!userId) {
        console.error('No userId found in AsyncStorage');
        setLoading(false);
        Alert.alert(
          'Authentication Error',
          'User session not found. Please log in again.'
        );
        return;
      }

      console.log('Retrieved userId from AsyncStorage:', userId);
      setCurrentUserId(userId);

      // Ensure Firebase authentication (uses cached token if valid)
      console.log('Ensuring Firebase authentication...');
      const isAuthenticated = await ensureFirebaseAuth();

      if (!isAuthenticated) {
        throw new Error('Failed to authenticate with Firebase');
      }

      setFirebaseAuthenticated(true);
      console.log('Firebase authentication successful');

      // Debug: Check ALL conversations in Firestore (temporary)
      try {
        await debugAllConversations();
      } catch (debugError) {
        console.error('Debug error:', debugError);
      }

      // Subscribe to user's conversations and return unsubscribe function
      const unsubscribe = await subscribeToConversations(userId);
      return unsubscribe;
    } catch (error) {
      console.error('Error initializing Firebase auth:', error);
      console.error('Error details:', error.response?.data || error.message);
      setLoading(false);

      let errorMessage = 'Could not connect to messaging service. Please try again later.';

      if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (error.response?.status === 503) {
        errorMessage = 'Messaging service is temporarily unavailable.';
      } else if (error.message?.includes('token')) {
        errorMessage = 'Authentication failed. Please log in again.';
      }

      Alert.alert('Authentication Error', errorMessage);
    }
  };

  const subscribeToConversations = async (userId) => {
    try {
      // Debug: Check Firebase auth state
      let currentUser = auth.currentUser;
      console.log('Firebase Auth State:', {
        isAuthenticated: !!currentUser,
        uid: currentUser?.uid,
        localUserId: userId,
        uidMatch: currentUser?.uid === userId
      });

      // If Firebase UID doesn't match local userId, re-authenticate
      if (!currentUser || currentUser.uid !== userId) {
        console.log('Firebase UID mismatch or not authenticated. Re-authenticating...');
        try {
          await signOut(auth); // Sign out the previous user
          const isAuthenticated = await ensureFirebaseAuth();
          if (!isAuthenticated) {
            throw new Error('Failed to re-authenticate with Firebase');
          }
          currentUser = auth.currentUser;
          console.log('Re-authenticated. New UID:', currentUser?.uid);
        } catch (reAuthError) {
          console.error('Re-authentication failed:', reAuthError);
          Alert.alert('Error', 'Failed to authenticate. Please restart the app.');
          setLoading(false);
          return;
        }
      }

      if (!currentUser) {
        console.error('User not authenticated with Firebase!');
        Alert.alert('Error', 'Not authenticated. Please restart the app.');
        setLoading(false);
        return;
      }

      const conversationsRef = collection(firestore, 'conversations');
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', userId)
      );

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        console.log('=== CONVERSATION SYNC DEBUG ===');
        console.log('Query userId:', userId);
        console.log('Firebase UID:', auth.currentUser?.uid);
        console.log('Number of conversations found:', snapshot.docs.length);

        const conversationsList = [];

        // Fetch all conversations with participant details
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          console.log('Conversation ID:', docSnap.id);
          console.log('Participants:', data.participants);
          console.log('Last message:', data.lastMessage?.message);

          const otherParticipant = await getOtherParticipant(data, userId);

          conversationsList.push({
            id: docSnap.id,
            ...data,
            otherParticipant,
          });
        }

        console.log('Total conversations loaded:', conversationsList.length);
        console.log('=================================');

        // Sort conversations by updatedAt (handles both string and Timestamp formats)
        conversationsList.sort((a, b) => {
          const getTimestamp = (conv) => {
            if (!conv.updatedAt) return 0;
            if (typeof conv.updatedAt === 'string') {
              return new Date(conv.updatedAt).getTime();
            }
            if (conv.updatedAt.toDate) {
              return conv.updatedAt.toDate().getTime();
            }
            return new Date(conv.updatedAt).getTime();
          };
          return getTimestamp(b) - getTimestamp(a); // descending order
        });

        setConversations(conversationsList);
        setLoading(false);
        setRefreshing(false);
      }, (error) => {
        console.error('Error fetching conversations:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        setLoading(false);
        setRefreshing(false);

        if (error.code === 'permission-denied') {
          Alert.alert(
            'Permission Error',
            'Firestore rules may not be deployed. Please contact support.'
          );
        }
      });

      // Clean up subscription on unmount
      return () => unsubscribe();
    } catch (error) {
      console.error('Error subscribing to conversations:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getOtherParticipant = async (conversationData, currentUserId) => {
    const participants = conversationData.participants || [];
    const otherUserId = participants.find(id => id !== currentUserId);

    if (!otherUserId) {
      return {
        userId: 'unknown',
        fullName: 'Unknown User',
        profileImage: null,
        role: 'pet-owner',
      };
    }

    // First try to get from conversation participantDetails
    if (conversationData.participantDetails && conversationData.participantDetails[otherUserId]) {
      return conversationData.participantDetails[otherUserId];
    }

    // If not in participantDetails, fetch from users collection
    try {
      const userDocRef = doc(firestore, 'users', otherUserId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        return {
          userId: otherUserId,
          fullName: userData.fullName || 'Unknown User',
          profileImage: userData.profileImage || null,
          role: userData.role || 'business-owner',
        };
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }

    // Fallback
    return {
      userId: otherUserId,
      fullName: 'Unknown User',
      profileImage: null,
      role: 'business-owner',
    };
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (currentUserId) {
      subscribeToConversations(currentUserId);
    } else {
      initializeFirebaseAuth();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    let date;
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp.toDate) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }

    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getUnreadCount = (conversation) => {
    if (!conversation.unreadCount || !currentUserId) return 0;
    return conversation.unreadCount[currentUserId] || 0;
  };

  const renderConversation = ({ item }) => {
    const { otherParticipant, lastMessage } = item;
    const unreadCount = getUnreadCount(item);

    return (
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() => router.push({
          pathname: '/(user)/(tabs)/messages/chat',
          params: {
            conversationId: item.id,
            receiverId: otherParticipant.userId,
            receiverName: otherParticipant.fullName,
            receiverImage: otherParticipant.profileImage || '',
          }
        })}
      >
        <View style={styles.avatarContainer}>
          {otherParticipant.profileImage ? (
            <Image
              source={{ uri: otherParticipant.profileImage }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons
                name={otherParticipant.role === 'business-owner' ? 'storefront' : 'person'}
                size={moderateScale(24)}
                color="#1C86FF"
              />
            </View>
          )}
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.userName} numberOfLines={1}>
              {otherParticipant.fullName}
            </Text>
            {lastMessage && lastMessage.createdAt && (
              <Text style={styles.timestamp}>
                {formatTime(lastMessage.createdAt)}
              </Text>
            )}
          </View>

          {lastMessage && lastMessage.message && (
            <Text
              style={[
                styles.lastMessage,
                unreadCount > 0 && styles.unreadMessage
              ]}
              numberOfLines={1}
            >
              {lastMessage.senderId === currentUserId && 'You: '}
              {lastMessage.message}
            </Text>
          )}
        </View>

        <Ionicons name="chevron-forward" size={moderateScale(20)} color="#ccc" />
      </TouchableOpacity>
    );
  };

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText}>Messages</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          backgroundColor="#1C86FF"
          titleColor="#fff"
          customTitle={renderTitle()}
          showBack={false}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1C86FF" />
          <Text style={styles.loadingText}>Connecting to messaging...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        backgroundColor="#1C86FF"
        titleColor="#fff"
        customTitle={renderTitle()}
        showBack={false}
      />

      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="chatbubbles-outline" size={moderateScale(80)} color="#1C86FF" />
          </View>
          <Text style={styles.emptyTitle}>No Messages</Text>
          <Text style={styles.emptySubtitle}>
            Your conversations will appear here
          </Text>
          <Text style={styles.emptyHint}>
            Book a service to start chatting with providers
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  titleContainer: {
    flex: 1,
  },
  titleText: {
    color: '#fff',
    fontSize: scaleFontSize(24),
    fontFamily: 'SFProBold',
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: moderateScale(15),
    fontSize: scaleFontSize(14),
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(10),
  },
  emptyIconContainer: {
    width: moderateScale(150),
    height: moderateScale(150),
    borderRadius: moderateScale(75),
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(20),
  },
  emptyTitle: {
    fontSize: scaleFontSize(24),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(8),
  },
  emptySubtitle: {
    fontSize: scaleFontSize(16),
    color: '#666',
    textAlign: 'center',
    marginBottom: moderateScale(8),
  },
  emptyHint: {
    fontSize: scaleFontSize(14),
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  listContent: {
    padding: wp(4),
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: moderateScale(12),
  },
  avatar: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
  },
  avatarPlaceholder: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: moderateScale(10),
    minWidth: moderateScale(20),
    height: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(6),
  },
  unreadText: {
    color: '#fff',
    fontSize: scaleFontSize(10),
    fontWeight: 'bold',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  userName: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  timestamp: {
    fontSize: scaleFontSize(12),
    color: '#999',
    marginLeft: moderateScale(8),
  },
  lastMessage: {
    fontSize: scaleFontSize(14),
    color: '#666',
  },
  unreadMessage: {
    color: '#333',
    fontWeight: '600',
  },
});
