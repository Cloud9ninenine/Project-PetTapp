import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import SearchHeader from '@components/SearchHeader';

export default function VeterinaryServicesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const veterinaryServices = [
    {
      id: 1,
      name: 'PetCo Animal Clinic',
      price: 'Price (₱xx,xxx)',
      rating: 4.9,
      image: require('@assets/images/serviceimages/18.png'),
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    },
    {
      id: 2,
      name: 'Animed Veterinary Clinic',
      price: 'Price (₱xx,xxx)',
      rating: 4.8,
      image: require('@assets/images/serviceimages/17.png'),
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    },
    {
      id: 3,
      name: 'Vetfusion Animal Clinic',
      price: 'Price (₱xx,xxx)',
      rating: 4.7,
      image: require('@assets/images/serviceimages/19.png'),
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    },
  ];

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={14} color="#FF9B79" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Ionicons key={i} name="star-half" size={14} color="#FF9B79" />
        );
      } else {
        stars.push(
          <Ionicons key={i} name="star-outline" size={14} color="#E0E0E0" />
        );
      }
    }
    return stars;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("@assets/images/PetTapp pattern.png")}
        style={styles.backgroundimg}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="repeat"
      />
      {/* 🔹 Top Search Header */}
      <SearchHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onNotifPress={() => console.log('🔔 Notification tapped')}
      />

      {/* 🔹 Category Title */}
      <View style={styles.categoryContainer}>
        <Text style={styles.categoryText}>Veterinary</Text>
        <Text style={styles.subcategoryText}>(180 Search results)</Text>
      </View>

      {/* 🔹 Services List */}
      <ScrollView style={styles.scrollView}>
        {veterinaryServices.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={styles.serviceCard}
            onPress={() =>
              router.push({
                pathname: 'home/service-details',
                params: {
                  id: service.id,
                  name: service.name,
                  price: service.price,
                  rating: service.rating,
                  description: service.description,
                },
              })
            }
          >
            <Image source={service.image} style={styles.serviceImage} />
            <View style={styles.serviceContent}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.servicePrice}>{service.price}</Text>

              <View style={styles.ratingContainer}>
                {renderStars(service.rating)}
                <Text style={styles.ratingText}>({service.rating})</Text>
              </View>

              <Text style={styles.serviceDescription}>
                {service.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  backgroundimg: { 
  ...StyleSheet.absoluteFillObject,
  transform: [{ scale: 1.5 }], 
 },
 
backgroundImageStyle: { opacity: 0.1 },

  categoryContainer: {
    paddingHorizontal: 20,
    paddingTop: 5,
  },
  categoryText: {
    fontSize: 30,
    fontFamily:"SFProBold",
    color: '#1C86FF',
  },
  subcategoryText: {
    fontSize: 12,
    color: '#FF9B79',
    marginTop: -12,
    fontFamily:"SFProReg"
  },
  scrollView: {
    flex: 1,
    marginTop: 10,
    
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 15,
    marginVertical: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1C86FF',
    alignItems: 'flex-start',
  },
  serviceImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginRight: 12,
  },
  serviceContent: {
    flex: 1,
  },
  serviceName: {
    fontSize: 22,
    fontFamily:"SFProMedium",
    color: '#1C86FF',
  },
  servicePrice: {
    fontSize: 12,
    color: '#FF9B79',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  ratingText: {
    fontSize: 12,
    color: 'black',
    marginLeft: 4,
  },
  serviceDescription: {
    fontSize: 12,
    color: 'black',
    lineHeight: 18,
  },
});
