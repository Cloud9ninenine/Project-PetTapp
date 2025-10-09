import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Header from '@components/Header';
import CompleteProfileModal from '@components/CompleteProfileModal';
import { wp, moderateScale, scaleFontSize } from '@utils/responsive';
import { useProfileCompletion } from '../../../hooks/useProfileCompletion';

export default function MyPetsScreen() {
  const router = useRouter();
  const [showProfileIncompleteModal, setShowProfileIncompleteModal] = useState(false);
  const { isProfileComplete } = useProfileCompletion();

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText} numberOfLines={1}>
        My Pets
      </Text>
    </View>
  );

  // Show modal if profile is incomplete
  useEffect(() => {
    if (!isProfileComplete) {
      setShowProfileIncompleteModal(true);
    }
  }, [isProfileComplete]);



  const renderAddPetCard = () => (
    <TouchableOpacity
      style={styles.addPetCard}
      activeOpacity={0.8}
      onPress={() => router.push('/(user)/(tabs)/my-pets/add-pet')}
    >
      <View style={styles.addIconCircle}>
        <Ionicons name="add" size={moderateScale(40)} color="#1C86FF" />
      </View>
      <Text style={styles.addPetText}>Add New Pet</Text>
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

      {/* Content */}
      <View style={styles.content}>
        {renderAddPetCard()}
      </View>

      {/* Profile Incomplete Modal */}
      <CompleteProfileModal
        visible={showProfileIncompleteModal}
        onClose={() => setShowProfileIncompleteModal(false)}
        title="Complete Your Profile"
        message="Please complete your profile information before managing pets. You need to provide your first name, last name, address, and contact number."
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
  content: {
    flex: 1,
    paddingTop: moderateScale(16),
  },
  addPetCard: {
    backgroundColor: '#fff',
    marginHorizontal: wp(4),
    marginVertical: moderateScale(8),
    borderRadius: moderateScale(10),
    borderWidth: 2,
    borderColor: '#1C86FF',
    borderStyle: 'dashed',
    padding: moderateScale(15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconCircle: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(40),
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  addPetText: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: '#1C86FF',
  },
});
