import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ImageBackground,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Header from '@components/Header';
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from '@config/api';

export default function MyPetsScreen() {
  const router = useRouter();
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText} numberOfLines={1}>
        My Pets
      </Text>
    </View>
  );

  // Calculate age from birthday
  const calculateAge = (birthday) => {
    if (!birthday) return 'Unknown';
    const birthDate = new Date(birthday);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      years--;
    }

    return years > 0 ? `${years} year${years !== 1 ? 's' : ''}` : 'Less than 1 year';
  };

  // Fetch pets from API
  useEffect(() => {
    const fetchPets = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get('/pets');

        if (response.status === 200) {
          // Map API response to match UI structure
          const petsData = response.data.map(pet => ({
            id: pet.id.toString(),
            name: pet.name,
            species: pet.species,
            breed: pet.breed,
            birthday: pet.birthday,
            age: calculateAge(pet.birthday),
            gender: pet.gender,
            weight: pet.weight ? `${pet.weight} kg` : 'Unknown',
            color: pet.color || 'Unknown',
            avatar: pet.avatar || null,
          }));
          setPets(petsData);
        }
      } catch (error) {
        console.error('Error fetching pets:', error);
        if (error.response) {
          const status = error.response.status;
          if (status === 401) {
            Alert.alert('Authentication Error', 'Please log in again.');
            router.replace('/(auth)/login');
          } else if (status === 404) {
            // No pets found, just show empty state
            setPets([]);
          } else {
            Alert.alert('Error', 'Failed to load pets. Please try again.');
          }
        } else if (error.request) {
          Alert.alert('Network Error', 'Please check your connection and try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPets();
  }, []);

  const renderPetCard = ({ item }) => (
    <TouchableOpacity
      style={styles.petCard}
      activeOpacity={0.8}
      onPress={() => router.push(`/(user)/(tabs)/my-pets/${item.id}`)}
    >
      <View style={styles.cardContent}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="paw" size={moderateScale(40)} color="#1C86FF" />
            </View>
          )}
        </View>

        {/* Pet Info */}
        <View style={styles.petInfo}>
          <Text style={styles.petName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.speciesBreed} numberOfLines={1}>
            {item.species} • {item.breed}
          </Text>
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={moderateScale(14)} color="#666" />
              <Text style={styles.detailText}>{item.age}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="male-female-outline" size={moderateScale(14)} color="#666" />
              <Text style={styles.detailText}>{item.gender}</Text>
            </View>
          </View>
        </View>

        {/* Arrow */}
        <Ionicons name="chevron-forward" size={moderateScale(24)} color="#1C86FF" />
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

      {/* Loading State */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1C86FF" />
          <Text style={styles.loadingText}>Loading your pets...</Text>
        </View>
      ) : (
        /* Pet List */
        <FlatList
          data={pets}
          renderItem={renderPetCard}
          keyExtractor={item => item.id}
          style={styles.petList}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderAddPetCard}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="paw-outline" size={moderateScale(80)} color="#ccc" />
              <Text style={styles.emptyText}>No pets yet</Text>
              <Text style={styles.emptySubText}>Add your first pet to get started!</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
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
  petList: {
    flex: 1,
  },
  listContent: {
    paddingVertical: moderateScale(16),
  },
  petCard: {
    backgroundColor: '#fff',
    marginHorizontal: wp(4),
    marginVertical: moderateScale(8),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#1C86FF',
    padding: moderateScale(16),
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: moderateScale(12),
  },
  avatar: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
  },
  avatarPlaceholder: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: moderateScale(4),
  },
  speciesBreed: {
    fontSize: scaleFontSize(13),
    color: '#1C86FF',
    marginBottom: moderateScale(6),
  },
  detailsRow: {
    flexDirection: 'row',
    gap: moderateScale(16),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
  },
  detailText: {
    fontSize: scaleFontSize(12),
    color: '#666',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(40),
  },
  loadingText: {
    marginTop: moderateScale(16),
    fontSize: scaleFontSize(16),
    color: '#666',
    fontFamily: 'SFProReg',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(60),
  },
  emptyText: {
    fontSize: scaleFontSize(20),
    fontWeight: '600',
    color: '#999',
    marginTop: moderateScale(16),
  },
  emptySubText: {
    fontSize: scaleFontSize(14),
    color: '#bbb',
    marginTop: moderateScale(8),
  },
});
