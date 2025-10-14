import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';

export default function SettingsScreen() {
  const router = useRouter();

  const settingsOptions = [
    {
      id: '1',
      title: 'Profile',
      subtitle: 'View and edit your personal information',
      icon: 'person',
      color: '#1C86FF',
      route: '/(bsn)/(tabs)/profile/settings/profile',
    },
    {
      id: '2',
      title: 'Change Password',
      subtitle: 'Update your account password',
      icon: 'lock-closed',
      color: '#FF9B79',
      route: '/(bsn)/(tabs)/profile/settings/change-password',
    },
    {
      id: '3',
      title: 'Delete Account',
      subtitle: 'Permanently remove your account',
      icon: 'trash',
      color: '#FF6B6B',
      route: '/(bsn)/(tabs)/profile/settings/delete-account',
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
        title="Settings"
        showBack={true}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>

          {settingsOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.settingCard}
              onPress={() => router.push(option.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
                <Ionicons name={option.icon} size={moderateScale(24)} color="#fff" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{option.title}</Text>
                <Text style={styles.settingSubtitle}>{option.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={moderateScale(24)} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={moderateScale(24)} color="#1C86FF" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Need Help?</Text>
            <Text style={styles.infoText}>
              If you have any questions or need assistance, please contact our support team.
            </Text>
          </View>
        </View>
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
  content: {
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(20),
    paddingBottom: moderateScale(100),
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    marginBottom: moderateScale(20),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(15),
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  iconContainer: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(15),
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(4),
  },
  settingSubtitle: {
    fontSize: scaleFontSize(13),
    color: '#666',
    lineHeight: scaleFontSize(18),
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    gap: moderateScale(12),
    borderLeftWidth: 4,
    borderLeftColor: '#1C86FF',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: scaleFontSize(15),
    fontWeight: '600',
    color: '#1C86FF',
    marginBottom: moderateScale(4),
  },
  infoText: {
    fontSize: scaleFontSize(13),
    color: '#666',
    lineHeight: scaleFontSize(18),
  },
});
