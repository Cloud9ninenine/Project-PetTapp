import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Header from '@components/Header';

export default function MyPetsScreen() {
  const router = useRouter();

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText} numberOfLines={1}>
        My Pets
      </Text>
    </View>
  );

  // Sample pet data
  const [pets] = useState([
    {
      id: '1',
      name: 'Max',
      species: 'Dog',
      breed: 'Golden Retriever',
      birthday: '01/15/2022',
      age: '3 years',
      gender: 'Male',
      weight: '32 kg',
      color: 'Golden',
      avatar: null,
    },
    {
      id: '2',
      name: 'Luna',
      species: 'Cat',
      breed: 'Persian',
      birthday: '03/20/2023',
      age: '2 years',
      gender: 'Female',
      weight: '4.5 kg',
      color: 'White',
      avatar: null,
    },
    {
      id: '3',
      name: 'Charlie',
      species: 'Dog',
      breed: 'Beagle',
      birthday: '06/10/2021',
      age: '4 years',
      gender: 'Male',
      weight: '12 kg',
      color: 'Tricolor',
      avatar: null,
    },
  ]);

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
              <Ionicons name="paw" size={40} color="#1C86FF" />
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
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.detailText}>{item.age}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="male-female-outline" size={14} color="#666" />
              <Text style={styles.detailText}>{item.gender}</Text>
            </View>
          </View>
        </View>

        {/* Arrow */}
        <Ionicons name="chevron-forward" size={24} color="#1C86FF" />
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
        <Ionicons name="add" size={40} color="#1C86FF" />
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

      {/* Pet List */}
      <FlatList
        data={pets}
        renderItem={renderPetCard}
        keyExtractor={item => item.id}
        style={styles.petList}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={renderAddPetCard}
        contentContainerStyle={styles.listContent}
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
    fontSize: 24,
    fontFamily: 'SFProBold',
    textAlign: 'center',
  },
  petList: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 16,
  },
  petCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1C86FF',
    padding: 16,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  speciesBreed: {
    fontSize: 13,
    color: '#1C86FF',
    marginBottom: 6,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  addPetCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1C86FF',
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  addPetText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C86FF',
  },
});
