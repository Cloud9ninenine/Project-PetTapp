import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Header from '@components/Header';
import { wp, moderateScale, scaleFontSize } from '@utils/responsive';

export default function ConversationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { chatId, serviceName, fromService } = params;

  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const flatListRef = useRef(null);

  // Get clinic info based on chatId or serviceName
  const getClinicInfo = () => {
    const clinics = {
      '1': {
        name: 'PetCo Animal Clinic',
        avatar: require('@assets/images/serviceimages/18.png'),
      },
      '2': {
        name: 'Animed Veterinary Clinic',
        avatar: require('@assets/images/serviceimages/17.png'),
      },
      '3': {
        name: 'Vetfusion Animal Clinic',
        avatar: require('@assets/images/serviceimages/19.png'),
      },
    };

    // If coming from service with serviceName param, use that
    if (serviceName) {
      if (serviceName.includes('Animed')) {
        return { name: serviceName, avatar: require('@assets/images/serviceimages/17.png') };
      } else if (serviceName.includes('Vetfusion')) {
        return { name: serviceName, avatar: require('@assets/images/serviceimages/19.png') };
      } else {
        return { name: serviceName, avatar: require('@assets/images/serviceimages/18.png') };
      }
    }

    return clinics[chatId] || clinics['1'];
  };

  // Sample messages based on chatId or default for new chats
  const getSampleMessages = () => {
    // If coming from service details, return empty or welcome message
    if (fromService === 'true') {
      return [
        {
          id: '1',
          text: `Hello! Welcome to ${clinicInfo.name}. How can we help your pet today?`,
          sender: 'vet',
          timestamp: getCurrentTime()
        }
      ];
    }

    const messagesByChat = {
      '1': [
        { id: '1', text: 'Hello! Welcome to PetCo Animal Clinic. How can we help your pet today?', sender: 'vet', timestamp: '10:00 AM' },
        { id: '2', text: 'Hi! I would like to book a checkup for my dog.', sender: 'user', timestamp: '10:02 AM' },
        { id: '3', text: 'Great! What date and time works best for you?', sender: 'vet', timestamp: '10:03 AM' },
        { id: '4', text: 'How about tomorrow at 2 PM?', sender: 'user', timestamp: '10:05 AM' },
        { id: '5', text: 'Perfect! Tomorrow at 2 PM is available. May I have your pet\'s name and breed?', sender: 'vet', timestamp: '10:06 AM' },
        { id: '6', text: 'His name is Max, Golden Retriever.', sender: 'user', timestamp: '10:08 AM' },
        { id: '7', text: 'Thank you! Your appointment for Max is confirmed for tomorrow at 2 PM. We look forward to seeing you!', sender: 'vet', timestamp: '10:10 AM' },
        { id: '8', text: 'Your appointment is confirmed for tomorrow at 2 PM', sender: 'vet', timestamp: '10:12 AM' },
      ],
      '2': [
        { id: '1', text: 'Good morning! This is Animed Veterinary Clinic. How may we assist you?', sender: 'vet', timestamp: '9:30 AM' },
        { id: '2', text: 'Hi! I need to schedule a vaccination for my cat.', sender: 'user', timestamp: '9:32 AM' },
        { id: '3', text: 'Certainly! Which vaccination does your cat need?', sender: 'vet', timestamp: '9:33 AM' },
        { id: '4', text: 'Rabies vaccine, please.', sender: 'user', timestamp: '9:35 AM' },
        { id: '5', text: 'Understood. We have slots available this week. When would be convenient?', sender: 'vet', timestamp: '9:36 AM' },
        { id: '6', text: 'Friday afternoon would work.', sender: 'user', timestamp: '9:38 AM' },
        { id: '7', text: 'Excellent! Booked for Friday at 3 PM. Please bring your cat\'s vaccination record if available.', sender: 'vet', timestamp: '9:40 AM' },
        { id: '8', text: 'Thank you for choosing our clinic!', sender: 'vet', timestamp: '9:42 AM' },
      ],
      '3': [
        { id: '1', text: 'Hello from Vetfusion Animal Clinic! We\'re here to help your furry friend.', sender: 'vet', timestamp: '11:00 AM' },
        { id: '2', text: 'Hello! My rabbit seems unwell. Can I bring him in today?', sender: 'user', timestamp: '11:05 AM' },
        { id: '3', text: 'I\'m sorry to hear that. What symptoms is your rabbit showing?', sender: 'vet', timestamp: '11:06 AM' },
        { id: '4', text: 'He\'s not eating and seems lethargic.', sender: 'user', timestamp: '11:08 AM' },
        { id: '5', text: 'That does sound concerning. We can see him today at 4 PM. Is that okay?', sender: 'vet', timestamp: '11:09 AM' },
        { id: '6', text: 'Yes, thank you! I\'ll bring him at 4 PM.', sender: 'user', timestamp: '11:11 AM' },
        { id: '7', text: 'Perfect. Please bring him in a secure carrier. See you soon!', sender: 'vet', timestamp: '11:12 AM' },
        { id: '8', text: 'We look forward to seeing your pet', sender: 'vet', timestamp: '11:15 AM' },
      ],
    };
    return messagesByChat[chatId] || messagesByChat['1'];
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const clinicInfo = getClinicInfo();

  useEffect(() => {
    setMessages(getSampleMessages());
  }, [chatId]);

  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'user';
    const hasImage = item.image !== undefined;

    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessageContainer : styles.vetMessageContainer]}>
        {!isUser && (
          <Image source={clinicInfo.avatar} style={styles.messageAvatar} />
        )}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.vetBubble, hasImage && styles.imageBubble]}>
          {hasImage && (
            <Image source={item.image} style={styles.messageImage} />
          )}
          {item.text && (
            <Text style={[styles.messageText, isUser ? styles.userText : styles.vetText]}>
              {item.text}
            </Text>
          )}
          <Text style={[styles.messageTime, isUser ? styles.userTime : styles.vetTime]}>
            {item.timestamp}
          </Text>
        </View>
        {isUser && (
          <View style={styles.userAvatarPlaceholder} />
        )}
      </View>
    );
  };

  const handleSend = () => {
    if (messageText.trim()) {
      const newMessage = {
        id: String(messages.length + 1),
        text: messageText.trim(),
        sender: 'user',
        timestamp: getCurrentTime(),
      };
      setMessages([...messages, newMessage]);
      setMessageText('');

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to send images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      const newMessage = {
        id: String(messages.length + 1),
        image: { uri: result.assets[0].uri },
        text: messageText.trim() || '',
        sender: 'user',
        timestamp: getCurrentTime(),
      };
      setMessages([...messages, newMessage]);
      setMessageText('');

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Messenger-style Header */}
      <View style={styles.messengerHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={moderateScale(28)} color="#fff" />
        </TouchableOpacity>
        <Image source={clinicInfo.avatar} style={styles.headerAvatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{clinicInfo.name}</Text>
          <Text style={styles.headerStatus}>Active now</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          inverted={false}
        />

        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
            <Ionicons name="image-outline" size={moderateScale(24)} color="#1C86FF" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!messageText.trim()}
          >
            <Ionicons name="send" size={moderateScale(20)} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messengerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C86FF',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(20),
    paddingBottom: moderateScale(20),
    paddingTop: moderateScale(50),
    height: moderateScale(110),
    borderBottomLeftRadius: moderateScale(20),
    borderBottomRightRadius: moderateScale(20),
  },
  backButton: {
    padding: moderateScale(5),
    marginRight: moderateScale(8),
  },
  headerAvatar: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    marginRight: moderateScale(12),
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: moderateScale(2),
  },
  headerStatus: {
    fontSize: scaleFontSize(12),
    color: '#e3f2fd',
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: moderateScale(16),
    paddingHorizontal: moderateScale(12),
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: moderateScale(12),
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  vetMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    marginRight: moderateScale(8),
  },
  userAvatarPlaceholder: {
    width: moderateScale(32),
    marginLeft: moderateScale(8),
  },
  messageBubble: {
    maxWidth: '70%',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(18),
  },
  userBubble: {
    backgroundColor: '#1C86FF',
    borderBottomRightRadius: moderateScale(4),
  },
  vetBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: moderateScale(4),
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: scaleFontSize(15),
    lineHeight: moderateScale(20),
  },
  userText: {
    color: '#fff',
  },
  vetText: {
    color: '#333',
  },
  messageTime: {
    fontSize: scaleFontSize(11),
    marginTop: moderateScale(4),
  },
  userTime: {
    color: '#e3f2fd',
    textAlign: 'right',
  },
  vetTime: {
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
    fontSize: scaleFontSize(15),
    maxHeight: moderateScale(100),
    marginRight: moderateScale(8),
  },
  attachButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(4),
  },
  sendButton: {
    backgroundColor: '#1C86FF',
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  imageBubble: {
    paddingHorizontal: moderateScale(4),
    paddingVertical: moderateScale(4),
  },
  messageImage: {
    width: moderateScale(200),
    height: moderateScale(150),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(4),
  },
});
