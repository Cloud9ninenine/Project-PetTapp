import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import Header from '@components/Header';
import CompleteProfileModal from '@components/CompleteProfileModal';
import { wp, moderateScale, scaleFontSize } from '@utils/responsive';
import { useProfileCompletion } from '../../../_hooks/useProfileCompletion';
import apiClient from '@config/api';
import { MyPetsGridSkeleton } from '@components/SkeletonLoader';

export default function MyPetsScreen() {
  const router = useRouter();
  const [showProfileIncompleteModal, setShowProfileIncompleteModal] = useState(false);
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isProfileComplete } = useProfileCompletion();

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText} numberOfLines={1}>
        My Pets
      </Text>
    </View>
  );

  // Fetch pets data
  const fetchPets = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await apiClient.get('/pets');
      
      if (response.status === 200 && response.data.success) {
        setPets(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          Alert.alert('Authentication Error', 'Please log in again.');
          router.replace('/(auth)/login');
        } else {
          Alert.alert('Error', 'Failed to load pets. Please try again.');
        }
      } else if (error.request) {
        Alert.alert('Network Error', 'Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch pets on component mount and when screen is focused
  useEffect(() => {
    if (isProfileComplete) {
      fetchPets();
    }
  }, [isProfileComplete]);

  // Refresh pets when screen is focused (e.g., returning from add/edit pet)
  useFocusEffect(
    React.useCallback(() => {
      if (isProfileComplete) {
        fetchPets(true);
      }
    }, [isProfileComplete])
  );

  // Show modal if profile is incomplete
  useEffect(() => {
    if (!isProfileComplete) {
      setShowProfileIncompleteModal(true);
    }
  }, [isProfileComplete]);



  const renderPetCard = (pet) => (
    <TouchableOpacity
      key={pet._id}
      style={styles.petCard}
      activeOpacity={0.8}
      onPress={() => router.push(`/(user)/(tabs)/my-pets/${pet._id}`)}
    >
      {/* Background Image */}
      {pet.images?.profile ? (
        <Image source={{ uri: pet.images.profile }} style={styles.petCardImage} />
      ) : (
        <View style={styles.petCardImagePlaceholder}>
          <Ionicons name="paw" size={moderateScale(50)} color="#1C86FF" />
        </View>
      )}

      {/* Gradient Overlay */}
      <View style={styles.petCardGradient} />

      {/* Text Overlay */}
      <View style={styles.petInfoOverlay}>
        <Text style={styles.petName} numberOfLines={1}>{pet.name}</Text>
        <View style={styles.petDetailsRow}>
          <Text style={styles.petDetails} numberOfLines={1}>
            {pet.breed || pet.species?.charAt(0).toUpperCase() + pet.species?.slice(1)} • {pet.age} yrs
          </Text>
          <View style={[styles.petGenderIcon, pet.gender === 'male' ? styles.maleIcon : styles.femaleIcon]}>
            <Ionicons
              name={pet.gender === 'male' ? 'male' : 'female'}
              size={moderateScale(14)}
              color="#fff"
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

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

  const renderLoadingState = () => (
    <MyPetsGridSkeleton />
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
        showBack={true}
        onBackPress={() => router.push('/(user)/(tabs)/home')}
      />

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          renderLoadingState()
        ) : (
          <View style={styles.petsSection}>
            <View style={styles.petsGrid}>
              {renderAddPetCard()}
              {pets.map(renderPetCard)}
            </View>
          </View>
        )}
      </ScrollView>

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
    backgroundColor: '#E3F2FD',
    width: '48%',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: moderateScale(180),
    borderWidth: 2,
    borderColor: '#1C86FF',
    borderStyle: 'dashed',
    marginBottom: moderateScale(8),
  },
  addIconCircle: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  addPetText: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#1C86FF',
    textAlign: 'center',
  },
  petsSection: {
    paddingHorizontal: wp(4),
    paddingBottom: moderateScale(20),
  },
  petsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: moderateScale(12),
  },
  sectionTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(12),
  },
  petCard: {
    width: '48%',
    height: moderateScale(200),
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: moderateScale(8),
    position: 'relative',
  },
  petCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  petCardImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  petCardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  petInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: moderateScale(8),
    paddingBottom: moderateScale(10),
  },
  petName: {
    fontSize: scaleFontSize(14),
    fontWeight: '700',
    color: '#fff',
    marginBottom: moderateScale(4),
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  petDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(6),
  },
  petDetails: {
    fontSize: scaleFontSize(11),
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  petGenderIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  maleIcon: {
    backgroundColor: '#2196F3',
  },
  femaleIcon: {
    backgroundColor: '#E91E63',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(60),
  },
  loadingText: {
    marginTop: moderateScale(16),
    fontSize: scaleFontSize(16),
    color: '#666',
  },
});
