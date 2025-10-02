import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const flatListRef = useRef(null);

  const customerName = params.customerName || 'Customer';
  const petName = params.petName || 'Pet';
  const service = params.service || 'Service';
  const appointmentDate = params.date || '';
  const appointmentTime = params.time || '';
  const fromAppointment = params.startConversation === 'true';

  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // If coming from appointment, add initial message about the booking
    if (fromAppointment && appointmentDate && appointmentTime) {
      const initialMessage = {
        id: Date.now().toString(),
        text: `Hi ${customerName}! This is regarding your ${service} appointment for ${petName} scheduled on ${appointmentDate} at ${appointmentTime}. How can I help you?`,
        sender: 'business',
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        isSystemMessage: true,
      };
      setMessages([initialMessage]);
    }
  }, []);

  const sendMessage = () => {
    if (messageText.trim() === '') return;

    const newMessage = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'business',
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageText('');

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Simulate customer response after 2 seconds
    setTimeout(() => {
      const autoReply = {
        id: (Date.now() + 1).toString(),
        text: 'Thank you for reaching out! I appreciate your help.',
        sender: 'customer',
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
      };
      setMessages(prev => [...prev, autoReply]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 2000);
  };

  const renderMessage = ({ item }) => {
    const isBusinessMessage = item.sender === 'business';
    const isSystemMessage = item.isSystemMessage;

    return (
      <View style={[
        styles.messageContainer,
        isBusinessMessage ? styles.businessMessageContainer : styles.customerMessageContainer
      ]}>
        {isSystemMessage && (
          <View style={styles.systemMessageBadge}>
            <Ionicons name="calendar" size={moderateScale(12)} color="#1C86FF" />
            <Text style={styles.systemMessageBadgeText}>Appointment Message</Text>
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isBusinessMessage ? styles.businessBubble : styles.customerBubble
        ]}>
          <Text style={[
            styles.messageText,
            isBusinessMessage ? styles.businessMessageText : styles.customerMessageText
          ]}>
            {item.text}
          </Text>
          <Text style={[
            styles.timestamp,
            isBusinessMessage ? styles.businessTimestamp : styles.customerTimestamp
          ]}>
            {item.timestamp}
          </Text>
        </View>
      </View>
    );
  };

  const renderTitle = () => (
    <View style={styles.headerTitleContainer}>
      <View style={styles.customerAvatar}>
        <Ionicons name="person" size={moderateScale(20)} color="#fff" />
      </View>
      <View>
        <Text style={styles.headerTitle}>{customerName}</Text>
        <Text style={styles.headerSubtitle}>{petName}</Text>
      </View>
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
              Send a message to {customerName} about {petName}'s appointment
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
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
            style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!messageText.trim()}
          >
            <Ionicons
              name="send"
              size={moderateScale(20)}
              color={messageText.trim() ? "#fff" : "#999"}
            />
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
  backgroundimg: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.5 }],
  },
  backgroundImageStyle: {
    opacity: 0.05,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
  },
  customerAvatar: {
    width: moderateScale(35),
    height: moderateScale(35),
    borderRadius: moderateScale(17.5),
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
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(15),
    paddingBottom: moderateScale(20),
  },
  messageContainer: {
    marginBottom: moderateScale(15),
    maxWidth: '80%',
  },
  businessMessageContainer: {
    alignSelf: 'flex-end',
  },
  customerMessageContainer: {
    alignSelf: 'flex-start',
  },
  systemMessageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(10),
    marginBottom: moderateScale(6),
    gap: moderateScale(4),
  },
  systemMessageBadgeText: {
    fontSize: scaleFontSize(10),
    color: '#1C86FF',
    fontWeight: '600',
  },
  messageBubble: {
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(16),
  },
  businessBubble: {
    backgroundColor: '#1C86FF',
    borderBottomRightRadius: moderateScale(4),
  },
  customerBubble: {
    backgroundColor: '#E0E0E0',
    borderBottomLeftRadius: moderateScale(4),
  },
  messageText: {
    fontSize: scaleFontSize(15),
    lineHeight: scaleFontSize(20),
    marginBottom: moderateScale(4),
  },
  businessMessageText: {
    color: '#fff',
  },
  customerMessageText: {
    color: '#333',
  },
  timestamp: {
    fontSize: scaleFontSize(11),
    alignSelf: 'flex-end',
  },
  businessTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  customerTimestamp: {
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
