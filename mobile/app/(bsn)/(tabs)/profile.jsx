import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';

export default function BusinessProfileScreen() {
  const router = useRouter();
  const businessInfo = {
    name: 'PetCare Business',
    type: 'Veterinary & Grooming Services',
    phone: '+63 912 345 6789',
    email: 'contact@petcare.com',
    address: '123 Pet Street, Manila City',
    hours: 'Mon-Sat: 8:00 AM - 6:00 PM',
    rating: 4.8,
    totalReviews: 245,
    verified: true,
  };

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText}>Business Profile</Text>
    </View>
  );

  const settingsOptions = [
    {
      id: '1',
      title: 'Business Information',
      icon: 'business',
      color: '#1C86FF',
    },
    {
      id: '2',
      title: 'Operating Hours',
      icon: 'time',
      color: '#4CAF50',
    },
    {
      id: '3',
      title: 'Payment Settings',
      icon: 'card',
      color: '#FF9B79',
    },
    {
      id: '4',
      title: 'Notifications',
      icon: 'notifications',
      color: '#2196F3',
    },
    {
      id: '5',
      title: 'Staff Management',
      icon: 'people',
      color: '#9C27B0',
    },
    {
      id: '6',
      title: 'Reviews & Ratings',
      icon: 'star',
      color: '#FFD700',
    },
  ];

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
        showBack={false}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Business Card */}
        <View style={styles.businessCard}>
          <View style={styles.businessIconContainer}>
            <Ionicons name="storefront" size={moderateScale(50)} color="#1C86FF" />
            {businessInfo.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#4CAF50" />
              </View>
            )}
          </View>

          <Text style={styles.businessName}>{businessInfo.name}</Text>
          <Text style={styles.businessType}>{businessInfo.type}</Text>

          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={moderateScale(18)} color="#FFD700" />
            <Text style={styles.ratingText}>
              {businessInfo.rating} ({businessInfo.totalReviews} reviews)
            </Text>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.infoRow}>
            <Ionicons name="call" size={moderateScale(20)} color="#1C86FF" />
            <Text style={styles.infoText}>{businessInfo.phone}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="mail" size={moderateScale(20)} color="#1C86FF" />
            <Text style={styles.infoText}>{businessInfo.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location" size={moderateScale(20)} color="#1C86FF" />
            <Text style={styles.infoText}>{businessInfo.address}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time" size={moderateScale(20)} color="#1C86FF" />
            <Text style={styles.infoText}>{businessInfo.hours}</Text>
          </View>
        </View>

        {/* Settings Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          {settingsOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.settingCard}
              onPress={() => {
                if (option.title === 'Business Information') {
                  Alert.alert('Business Information', `Name: ${businessInfo.name}\nType: ${businessInfo.type}\nPhone: ${businessInfo.phone}\nEmail: ${businessInfo.email}`);
                } else if (option.title === 'Operating Hours') {
                  Alert.alert('Operating Hours', businessInfo.hours);
                } else if (option.title === 'Payment Settings') {
                  Alert.alert('Payment Settings', 'Payment methods:\n• GCash\n• PayMaya\n• Bank Transfer\n• Cash on Delivery');
                } else if (option.title === 'Notifications') {
                  Alert.alert('Notifications', 'Push notifications: Enabled\nEmail notifications: Enabled\nSMS alerts: Disabled');
                } else if (option.title === 'Staff Management') {
                  Alert.alert('Staff Management', 'Total staff: 5\nActive: 4\nOn leave: 1');
                } else if (option.title === 'Reviews & Ratings') {
                  Alert.alert('Reviews & Ratings', `Average rating: ${businessInfo.rating}⭐\nTotal reviews: ${businessInfo.totalReviews}\n\nRecent reviews:\n• "Excellent service!" - 5⭐\n• "Very professional" - 5⭐\n• "Great experience" - 4⭐`);
                }
              }}
            >
              <View style={[styles.settingIconContainer, { backgroundColor: option.color }]}>
                <Ionicons name={option.icon} size={moderateScale(22)} color="#fff" />
              </View>
              <Text style={styles.settingTitle}>{option.title}</Text>
              <Ionicons name="chevron-forward" size={moderateScale(20)} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            Alert.alert(
              'Logout',
              'Are you sure you want to logout?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Logout',
                  style: 'destructive',
                  onPress: () => router.replace('/(auth)/login'),
                },
              ]
            );
          }}
        >
          <Ionicons name="log-out-outline" size={moderateScale(22)} color="#FF6B6B" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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
  titleContainer: {
    flex: 1,
  },
  titleText: {
    color: '#fff',
    fontSize: scaleFontSize(24),
    fontFamily: 'SFProBold',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(20),
    paddingBottom: moderateScale(100),
  },
  businessCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(25),
    alignItems: 'center',
    marginBottom: moderateScale(20),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  businessIconContainer: {
    position: 'relative',
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(15),
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(2),
  },
  businessName: {
    fontSize: scaleFontSize(24),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(4),
    textAlign: 'center',
  },
  businessType: {
    fontSize: scaleFontSize(14),
    color: '#666',
    marginBottom: moderateScale(12),
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  ratingText: {
    fontSize: scaleFontSize(14),
    color: '#333',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    marginBottom: moderateScale(15),
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
    marginBottom: moderateScale(15),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(10),
    gap: moderateScale(12),
  },
  infoText: {
    fontSize: scaleFontSize(14),
    color: '#333',
    flex: 1,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingIconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  settingTitle: {
    flex: 1,
    fontSize: scaleFontSize(15),
    color: '#333',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    paddingVertical: hp(1.8),
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    borderWidth: 2,
    borderColor: '#FF6B6B',
    marginTop: moderateScale(10),
  },
  logoutText: {
    color: '#FF6B6B',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
});
