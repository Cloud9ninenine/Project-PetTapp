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
      if (isProfileComplete && !isLoading) {
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
      <View style={styles.petImageContainer}>
        {pet.images?.profile ? (
          <Image source={{ uri: pet.images.profile }} style={styles.petImage} />
        ) : (
          <View style={styles.petImagePlaceholder}>
            <Ionicons name="paw" size={moderateScale(30)} color="#1C86FF" />
          </View>
        )}
      </View>
      
      <View style={styles.petInfo}>
        <Text style={styles.petName} numberOfLines={1}>{pet.name}</Text>
        <Text style={styles.petDetails} numberOfLines={2}>
          {pet.species?.charAt(0).toUpperCase() + pet.species?.slice(1)}
          {pet.breed && ` • ${pet.breed}`}
        </Text>
        <View style={styles.petMeta}>
          <Text style={styles.petAge}>{pet.age} years old</Text>
          <Text style={styles.petGender}>
            {pet.gender === 'male' ? '♂' : '♀'} {pet.gender}
          </Text>
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={moderateScale(20)} color="#666" />
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
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#1C86FF" />
      <Text style={styles.loadingText}>Loading your pets...</Text>
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
          <>
            {pets.length > 0 && (
              <View style={styles.petsSection}>
                {pets.map(renderPetCard)}
              </View>
            )}

            {renderAddPetCard()}
          </>
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
  petsSection: {
    marginBottom: moderateScale(20),
  },
  sectionTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: '600',
    color: '#333',
    marginHorizontal: wp(4),
    marginBottom: moderateScale(12),
  },
  petCard: {
    backgroundColor: '#fff',
    marginHorizontal: wp(4),
    marginVertical: moderateScale(6),
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  petImageContainer: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    marginRight: moderateScale(12),
    overflow: 'hidden',
  },
  petImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  petImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(4),
  },
  petDetails: {
    fontSize: scaleFontSize(14),
    color: '#666',
    marginBottom: moderateScale(6),
  },
  petMeta: {
    flexDirection: 'row',
    gap: moderateScale(12),
  },
  petAge: {
    fontSize: scaleFontSize(12),
    color: '#888',
  },
  petGender: {
    fontSize: scaleFontSize(12),
    color: '#888',
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
