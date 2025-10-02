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

export default function RiderProfileScreen() {
  const router = useRouter();

  const riderInfo = {
    name: 'Juan Dela Cruz',
    phone: '+63 917 555 1234',
    email: 'juan.delacruz@email.com',
    vehicleType: 'Motorcycle',
    plateNumber: 'ABC 1234',
    rating: 4.8,
    totalDeliveries: 342,
    verified: true,
  };

  const settingsOptions = [
    {
      id: '1',
      title: 'Personal Information',
      icon: 'person',
      color: '#FF6B35',
      route: '/rider-info',
    },
    {
      id: '2',
      title: 'Vehicle Details',
      icon: 'bicycle',
      color: '#4CAF50',
      route: '/vehicle-details',
    },
    {
      id: '3',
      title: 'Payment Method',
      icon: 'wallet',
      color: '#2196F3',
      route: '/payment-method',
    },
    {
      id: '4',
      title: 'Delivery History',
      icon: 'time',
      color: '#9C27B0',
      route: '/delivery-history',
    },
    {
      id: '5',
      title: 'Help & Support',
      icon: 'help-circle',
      color: '#FFC107',
      route: '/support',
    },
    {
      id: '6',
      title: 'Settings',
      icon: 'settings',
      color: '#607D8B',
      route: '/settings',
    },
  ];

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText}>Profile</Text>
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
        backgroundColor="#FF6B35"
        titleColor="#fff"
        customTitle={renderTitle()}
        showBack={false}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Rider Card */}
        <View style={styles.riderCard}>
          <View style={styles.riderIconContainer}>
            <Ionicons name="person" size={moderateScale(50)} color="#FF6B35" />
            {riderInfo.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#4CAF50" />
              </View>
            )}
          </View>

          <Text style={styles.riderName}>{riderInfo.name}</Text>
          <Text style={styles.vehicleType}>{riderInfo.vehicleType}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="star" size={moderateScale(18)} color="#FFD700" />
              <Text style={styles.statText}>{riderInfo.rating}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="bicycle" size={moderateScale(18)} color="#FF6B35" />
              <Text style={styles.statText}>{riderInfo.totalDeliveries} deliveries</Text>
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.infoRow}>
            <Ionicons name="call" size={moderateScale(20)} color="#FF6B35" />
            <Text style={styles.infoText}>{riderInfo.phone}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="mail" size={moderateScale(20)} color="#FF6B35" />
            <Text style={styles.infoText}>{riderInfo.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="car" size={moderateScale(20)} color="#FF6B35" />
            <Text style={styles.infoText}>{riderInfo.plateNumber}</Text>
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
                Alert.alert('Coming Soon', `${option.title} feature will be available soon!`);
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
  riderCard: {
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
  riderIconContainer: {
    position: 'relative',
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    backgroundColor: '#FFE5DB',
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
  riderName: {
    fontSize: scaleFontSize(24),
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: moderateScale(4),
    textAlign: 'center',
  },
  vehicleType: {
    fontSize: scaleFontSize(14),
    color: '#666',
    marginBottom: moderateScale(15),
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(20),
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  statDivider: {
    width: 1,
    height: moderateScale(20),
    backgroundColor: '#E0E0E0',
  },
  statText: {
    fontSize: scaleFontSize(13),
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
    color: '#FF6B35',
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
