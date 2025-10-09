import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ImageBackground,
  Alert,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Header from '@components/Header';
import CompleteProfileModal from "@components/CompleteProfileModal";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from "../../../config/api";
import { useProfileCompletion } from "../../../hooks/useProfileCompletion";

export default function MessagesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const params = useLocalSearchParams();
  const router = useRouter();
  const [showProfileIncompleteModal, setShowProfileIncompleteModal] = useState(false);
  const { isProfileComplete } = useProfileCompletion();

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText} numberOfLines={1}>
        Messages
      </Text>
    </View>
  );

  // Sample chat data - will be updated when navigating from service details
  const [chats, setChats] = useState([
    {
      id: '1',
      name: 'PetCo Animal Clinic',
      avatar: require('@assets/images/serviceimages/18.png'),
      lastMessage: 'Your appointment is confirmed for tomorrow at 2 PM',
      timestamp: '2m ago',
      unread: 2,
      category: 'Veterinary Service',
    },
    {
      id: '2',
      name: 'Animed Veterinary Clinic',
      avatar: require('@assets/images/serviceimages/17.png'),
      lastMessage: 'Thank you for choosing our clinic!',
      timestamp: '1h ago',
      unread: 0,
      category: 'Veterinary Service',
    },
    {
      id: '3',
      name: 'Vetfusion Animal Clinic',
      avatar: require('@assets/images/serviceimages/19.png'),
      lastMessage: 'We look forward to seeing your pet',
      timestamp: '3h ago',
      unread: 1,
      category: 'Veterinary Service',
    },
  ]);

  // Get image based on service name
  const getServiceImage = (serviceName) => {
    if (serviceName === 'Animed Veterinary Clinic') {
      return require('@assets/images/serviceimages/17.png');
    } else if (serviceName === 'Vetfusion Animal Clinic') {
      return require('@assets/images/serviceimages/19.png');
    } else if (serviceName === 'PetCo Animal Clinic' || serviceName === 'PetCo Clinic') {
      return require('@assets/images/serviceimages/18.png');
    } else {
      return require('@assets/images/serviceimages/18.png'); // Default
    }
  };

  // Show modal if profile is incomplete
  useEffect(() => {
    if (!isProfileComplete) {
      setShowProfileIncompleteModal(true);
    }
  }, [isProfileComplete]);

  // Handle navigation from service details
  useEffect(() => {
    if (params.serviceName) {
      const existingChatIndex = chats.findIndex(
        chat => chat.name === params.serviceName
      );

      if (existingChatIndex === -1) {
        // Create new chat entry if it doesn't exist
        const newChat = {
          id: String(chats.length + 1),
          name: params.serviceName,
          avatar: getServiceImage(params.serviceName),
          lastMessage: 'Start a conversation about our services',
          timestamp: 'Just now',
          unread: 0,
          category: params.serviceCategory || 'Service',
        };
        setChats([newChat, ...chats]);
      } else {
        // Move existing chat to top
        const updatedChats = [...chats];
        const [existingChat] = updatedChats.splice(existingChatIndex, 1);
        existingChat.timestamp = 'Just now';
        setChats([existingChat, ...updatedChats]);
      }
    }
  }, [params.serviceName]);

  

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderChatItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatCard}
      activeOpacity={0.8}
      onPress={() => router.push(`/(user)/(tabs)/messages/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <Image source={item.avatar} style={styles.avatar} />
        <View style={styles.headerContent}>
          <Text style={styles.chatName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.lastMessage} numberOfLines={2}>
          {item.lastMessage}
        </Text>
        {item.unread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unread}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("@assets/images/PetTapp pattern.png")}
        style={styles.backgroundimg}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="repeat"
      />
      {/* Header */}
      <Header
        backgroundColor="#1C86FF"
        titleColor="#fff"
        customTitle={renderTitle()}
        showBack={false}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={moderateScale(20)} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Chat List */}
      {filteredChats.length > 0 ? (
        <FlatList
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={item => item.id}
          style={styles.chatList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={moderateScale(64)} color="#ccc" />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery ? 'No results found' : 'Start a conversation with a service provider'}
          </Text>
        </View>
      )}

      {/* Profile Incomplete Modal */}
      <CompleteProfileModal
        visible={showProfileIncompleteModal}
        onClose={() => setShowProfileIncompleteModal(false)}
        message="Please complete your profile information before accessing messages. You need to provide your first name, last name, address, and contact number."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  backgroundimg: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.5 }],
  },
  backgroundImageStyle: {
    opacity: 0.1
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: wp(4),
    marginVertical: moderateScale(20),
    paddingHorizontal: moderateScale(15),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#1C86FF',
    height: moderateScale(50),
  },
  searchIcon: {
    marginRight: moderateScale(8),
  },
  searchInput: {
    flex: 1,
    height: moderateScale(44),
    fontSize: scaleFontSize(16),
    color: '#333',
  },
  chatList: {
    flex: 1,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },

  headerContent: {
    flex: 1,
  },

  chatCard: {
    backgroundColor: '#fff',
    marginHorizontal: wp(4),
    marginVertical: moderateScale(8),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#1C86FF',
    padding: moderateScale(16),
  },

  avatar: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    marginRight: moderateScale(12),
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  chatName: {
    fontSize: scaleFontSize(16),
    fontWeight: '700',
    color: '#333',
  },
  categoryText: {
    fontSize: scaleFontSize(12),
    color: '#666',
  },
  timestamp: {
    fontSize: scaleFontSize(12),
    color: '#999',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    flex: 1,
    fontSize: scaleFontSize(14),
    color: '#444',
    marginRight: moderateScale(10),
  },
  unreadBadge: {
    backgroundColor: '#1C86FF',
    borderRadius: moderateScale(10),
    minWidth: moderateScale(20),
    height: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(6),
  },
  unreadText: {
    color: '#fff',
    fontSize: scaleFontSize(12),
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(10),
  },
  emptyTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: '600',
    color: '#333',
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  emptySubtitle: {
    fontSize: scaleFontSize(14),
    color: '#999',
    textAlign: 'center',
  },
  
});
