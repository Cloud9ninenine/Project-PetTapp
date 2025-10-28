import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import {
  subscribeToMessages,
  sendMessage,
  markMessagesAsRead,
  getConversationDetails,
} from '@utils/messageService';
import { auth } from '@config/firebase';
import { ensureFirebaseAuth } from '@utils/firebaseAuthPersistence';
import { debugConversation } from '@utils/debugConversation';

/**
 * Convert user ID to Firebase UID format
 * CRITICAL: Must match backend format (pettapp_userId)
 */
const getFirebaseUid = (userId) => {
  return `pettapp_${userId}`;
};

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const flatListRef = useRef(null);

  const conversationId = params.conversationId;
  const receiverId = params.receiverId;
  const receiverName = params.receiverName || 'User';
  const receiverImage = params.receiverImage;

  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('');
  const [currentUserImage, setCurrentUserImage] = useState('');
  const [firebaseAuthenticated, setFirebaseAuthenticated] = useState(false);

  useEffect(() => {
    let unsubscribe = null;

    const initializeChat = async () => {
      try {
        const [userId, userData] = await AsyncStorage.multiGet([
          'userId',
          'userData',
        ]);

        const uid = userId[1];
        setCurrentUserId(uid);

        if (userData[1]) {
          const user = JSON.parse(userData[1]);
          setCurrentUserName(`${user.firstName || ''} ${user.lastName || ''}`.trim());
          setCurrentUserImage(user.images?.profile || '');
        }

        // Ensure Firebase authentication
        try {
          const expectedFirebaseUid = getFirebaseUid(uid);

          // Check if Firebase UID matches expected format
          if (auth.currentUser && auth.currentUser.uid !== expectedFirebaseUid) {
            console.log('Firebase UID mismatch in chat. Signing out and re-authenticating...');
            await auth.signOut();
          }

          const isAuthenticated = await ensureFirebaseAuth();
          if (!isAuthenticated) {
            throw new Error('Failed to authenticate with Firebase');
          }

          // Verify UID matches after authentication
          if (auth.currentUser?.uid !== expectedFirebaseUid) {
            throw new Error(`Firebase UID mismatch: expected ${expectedFirebaseUid}, got ${auth.currentUser?.uid}`);
          }

          setFirebaseAuthenticated(true);
          console.log('Firebase authenticated for chat. UID:', auth.currentUser?.uid);

          // DEBUG: Check conversation setup
          console.log('\n🔍 Running conversation diagnostics...');
          await debugConversation(conversationId);
          
        } catch (firebaseError) {
          console.error('Error initializing Firebase auth:', firebaseError);
          setLoading(false);
          Alert.alert(
            'Authentication Error',
            'Could not connect to messaging service. Please try again later.'
          );
          return;
        }

        // Mark messages as read
        if (conversationId) {
          await markMessagesAsRead(conversationId, uid);
        }

        // Subscribe to real-time messages
        unsubscribe = subscribeToMessages(conversationId, (newMessages) => {
          console.log('💬 Chat received messages:', newMessages.length);
          if (newMessages.length > 0) {
            const firstMsg = newMessages[0];
            const lastMsg = newMessages[newMessages.length - 1];
            console.log('🔼 FIRST (should be oldest):', {
              text: firstMsg.text?.substring(0, 30),
              time: firstMsg.createdAt
            });
            console.log('🔽 LAST (should be newest):', {
              text: lastMsg.text?.substring(0, 30),
              time: lastMsg.createdAt
            });
          }
          setMessages(newMessages);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error initializing chat:', error);
        setLoading(false);
        Alert.alert('Error', 'Could not load messages. Please try again.');
      }
    };

    initializeChat();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive (matching web implementation)
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      // Scroll to the end of the list (newest message at bottom)
      setTimeout(() => {
        try {
          flatListRef.current?.scrollToEnd({ animated: true });
        } catch (error) {
          // Ignore scroll errors
        }
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (messageText.trim() === '' || sendingMessage || !firebaseAuthenticated) return;

    const textToSend = messageText.trim();
    setMessageText('');
    setSendingMessage(true);

    try {
      await sendMessage(conversationId, currentUserId, textToSend, {
        name: currentUserName,
        image: currentUserImage,
      });

      // Auto-scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Could not send message. Please try again.');
      // Restore message text if send failed
      setMessageText(textToSend);
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTimestamp = (date) => {
    if (!date) return '';

    let messageDate;
    try {
      if (date instanceof Date) {
        messageDate = date;
      } else if (typeof date === 'string') {
        messageDate = new Date(date);
      } else if (date.toDate && typeof date.toDate === 'function') {
        messageDate = date.toDate();
      } else {
        messageDate = new Date(date);
      }
    } catch (error) {
      console.error('Error parsing message timestamp:', error);
      return '';
    }

    const now = new Date();
    const diff = now - messageDate;

    // If today, show time
    if (diff < 86400000) {
      return messageDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }

    // If yesterday
    if (diff < 172800000) {
      return 'Yesterday ' + messageDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }

    // Otherwise show date and time
    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }) + ' ' + messageDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderMessage = ({ item, index }) => {
    // CRITICAL: Compare using Firebase UID format
    const currentFirebaseUid = getFirebaseUid(currentUserId);
    const isUserMessage = item.senderId === currentFirebaseUid;
    const showAvatar = !isUserMessage;

    // Check if we should show date separator
    // With regular FlatList and ASC order: index 0 is oldest (top), last index is newest (bottom)
    // Show separator if it's the first message OR if the PREVIOUS message (index-1) is from a different day
    const isFirstMessage = index === 0;
    const showDateSeparator = isFirstMessage || !isSameDay(
      item.createdAt,
      messages[index - 1]?.createdAt
    );

    return (
      <>
        {showDateSeparator && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>
              {formatDateSeparator(item.createdAt)}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.messageContainer,
            isUserMessage ? styles.userMessageContainer : styles.otherMessageContainer,
          ]}
        >
          {showAvatar && (
            <View style={styles.messageAvatar}>
              {receiverImage ? (
                <Image source={{ uri: receiverImage }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={moderateScale(16)} color="#1C86FF" />
                </View>
              )}
            </View>
          )}
          <View
            style={[
              styles.messageBubble,
              isUserMessage ? styles.userBubble : styles.otherBubble,
              !showAvatar && styles.noAvatarBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isUserMessage ? styles.userMessageText : styles.otherMessageText,
              ]}
            >
              {item.message}
            </Text>
            <Text
              style={[
                styles.timestamp,
                isUserMessage ? styles.userTimestamp : styles.otherTimestamp,
              ]}
            >
              {formatTimestamp(item.createdAt)}
            </Text>
          </View>
        </View>
      </>
    );
  };

  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;

    let d1, d2;
    try {
      // Convert date1
      if (date1 instanceof Date) {
        d1 = date1;
      } else if (typeof date1 === 'string') {
        d1 = new Date(date1);
      } else if (date1.toDate && typeof date1.toDate === 'function') {
        d1 = date1.toDate();
      } else {
        d1 = new Date(date1);
      }

      // Convert date2
      if (date2 instanceof Date) {
        d2 = date2;
      } else if (typeof date2 === 'string') {
        d2 = new Date(date2);
      } else if (date2.toDate && typeof date2.toDate === 'function') {
        d2 = date2.toDate();
      } else {
        d2 = new Date(date2);
      }
    } catch (error) {
      console.error('Error comparing dates:', error);
      return false;
    }

    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const formatDateSeparator = (date) => {
    if (!date) return '';

    let messageDate;
    try {
      if (date instanceof Date) {
        messageDate = date;
      } else if (typeof date === 'string') {
        messageDate = new Date(date);
      } else if (date.toDate && typeof date.toDate === 'function') {
        messageDate = date.toDate();
      } else {
        messageDate = new Date(date);
      }
    } catch (error) {
      console.error('Error parsing date separator:', error);
      return '';
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (isSameDay(messageDate, today)) {
      return 'Today';
    } else if (isSameDay(messageDate, yesterday)) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  const renderTitle = () => (
    <View style={styles.headerTitleContainer}>
      <View style={styles.headerAvatar}>
        {receiverImage ? (
          <Image source={{ uri: receiverImage }} style={styles.headerAvatarImage} />
        ) : (
          <View style={styles.headerAvatarPlaceholder}>
            <Ionicons name="person" size={moderateScale(20)} color="#fff" />
          </View>
        )}
      </View>
      <View>
        <Text style={styles.headerTitle}>{receiverName}</Text>
        <Text style={styles.headerSubtitle}>Online</Text>
      </View>
    </View>
  );

  if (loading) {
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
          <Text style={styles.loadingText}>Loading messages...</Text>
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
        showBack={true}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="chatbubbles-outline" size={moderateScale(60)} color="#1C86FF" />
            </View>
            <Text style={styles.emptyStateTitle}>Start Conversation</Text>
            <Text style={styles.emptyStateText}>
              Send a message to {receiverName}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item, index) => item.id || index.toString()}
            contentContainerStyle={styles.messagesList}
          />
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageText.trim() || sendingMessage || !firebaseAuthenticated) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sendingMessage || !firebaseAuthenticated}
          >
            {sendingMessage ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons
                name="send"
                size={moderateScale(20)}
                color={messageText.trim() && firebaseAuthenticated ? '#fff' : '#999'}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
  },
  headerAvatar: {
    width: moderateScale(35),
    height: moderateScale(35),
    borderRadius: moderateScale(17.5),
    overflow: 'hidden',
  },
  headerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  headerAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#E3F2FD',
    fontSize: scaleFontSize(12),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: moderateScale(15),
    fontSize: scaleFontSize(14),
    color: '#666',
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(15),
    paddingBottom: moderateScale(20),
  },
  dateSeparator: {
    alignSelf: 'center',
    backgroundColor: '#E0E0E0',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(12),
    marginVertical: moderateScale(15),
  },
  dateSeparatorText: {
    fontSize: scaleFontSize(12),
    color: '#666',
    fontWeight: '600',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: moderateScale(15),
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    marginRight: moderateScale(8),
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(16),
    maxWidth: '100%',
  },
  noAvatarBubble: {
    marginLeft: moderateScale(38),
  },
  userBubble: {
    backgroundColor: '#1C86FF',
    borderBottomRightRadius: moderateScale(4),
  },
  otherBubble: {
    backgroundColor: '#E0E0E0',
    borderBottomLeftRadius: moderateScale(4),
  },
  messageText: {
    fontSize: scaleFontSize(15),
    lineHeight: scaleFontSize(20),
    marginBottom: moderateScale(4),
  },
  userMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#333',
  },
  timestamp: {
    fontSize: scaleFontSize(11),
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimestamp: {
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(10),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
    gap: moderateScale(10),
  },
  input: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(10),
    fontSize: scaleFontSize(15),
    color: '#333',
    maxHeight: moderateScale(100),
  },
  sendButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#1C86FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(10),
  },
  emptyIconContainer: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(20),
  },
  emptyStateTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(10),
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: scaleFontSize(14),
    color: '#666',
    textAlign: 'center',
    lineHeight: scaleFontSize(20),
  },
});
