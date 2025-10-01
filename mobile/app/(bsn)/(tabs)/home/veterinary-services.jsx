import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import SearchHeader from '@components/SearchHeader';
import { wp, moderateScale, scaleFontSize } from '@utils/responsive';

export default function VeterinaryServicesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const veterinaryServices = [
    {
      id: 1,
      name: 'PetCo Animal Clinic',
      category: 'Vet Clinic Animal',
      price: 'Price (200PHP)',
      rating: 4.9,
      image: require('@assets/images/serviceimages/18.png'),
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
    },
    {
      id: 2,
      name: 'Animed Veterinary Clinic',
      category: 'Vet Clinic',
      price: 'Price (200PHP)',
      rating: 4.8,
      image: require('@assets/images/serviceimages/17.png'),
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
    },
    {
      id: 3,
      name: 'Vetfusion Animal Clinic',
      category: 'Vet Clinic',
      price: 'Price (200PHP)',
      rating: 4.7,
      image: require('@assets/images/serviceimages/19.png'),
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
    },
  ];

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={moderateScale(12)} color="#FFD700" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Ionicons key={i} name="star-half" size={moderateScale(12)} color="#FFD700" />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={moderateScale(12)} color="#E0E0E0" />);
      }
    }
    return stars;
  };

  return (
    <SafeAreaView style={styles.container}>
        <SearchHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onNotifPress={() => console.log("🔔 Notification tapped")}
        />

      {/* Category */}
      <View style={styles.categoryContainer}>
        <Text style={styles.categoryText}>Veterinary</Text>
        <Text style={styles.subcategoryText}>Vet Clinic Animal</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Services List */}
        {veterinaryServices.map((service) => (
          <TouchableOpacity 
            key={service.id} 
            style={styles.serviceCard}
            onPress={() => router.push({
              pathname: 'home/service-details',
              params: {
                id: service.id,
                name: service.name,
                category: service.category,
                price: service.price,
                rating: service.rating,
                description: service.description
              }
            })}
          >
            <Image source={service.image} style={styles.serviceImage} />
            <View style={styles.serviceContent}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceCategory}>{service.category}</Text>
              <Text style={styles.servicePrice}>{service.price}</Text>
              <View style={styles.ratingContainer}>
                <View style={styles.starsContainer}>
                  {renderStars(service.rating)}
                </View>
                <Text style={styles.ratingText}>({service.rating})</Text>
              </View>
              <Text style={styles.serviceDescription}>{service.description}</Text>
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
    backgroundColor: '#f0f0f0',
  },
  simpleHeader: {
    backgroundColor: '#1C86FF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(20),
    paddingBottom: moderateScale(10),
    gap: moderateScale(13),
    borderBottomLeftRadius: moderateScale(20),
    borderBottomRightRadius: moderateScale(20),
  },
  backButtonContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    color: '#fff',
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
  },
  searchContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: moderateScale(15),
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(12),
  },
  searchInput: {
    fontSize: scaleFontSize(16),
    color: '#333',
  },
  bellContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    tintColor: '#fff',
  },
  categoryContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(15),
  },
  categoryText: {
    fontSize: scaleFontSize(24),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(5),
  },
  subcategoryText: {
    fontSize: scaleFontSize(14),
    color: '#666',
  },
  servicesContainer: {
    paddingHorizontal: wp(5),
  },
  scrollView: {
    flex: 1,
    paddingBottom: moderateScale(100),
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    marginVertical: moderateScale(8),
    marginHorizontal: wp(5),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: moderateScale(2) },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(4),
  },
  serviceImage: {
    width: '100%',
    height: moderateScale(200),
    resizeMode: 'cover',
  },
  serviceContent: {
    padding: moderateScale(15),
  },
  serviceName: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(5),
  },
  serviceCategory: {
    fontSize: scaleFontSize(12),
    color: '#FF9B79',
    marginBottom: moderateScale(5),
  },
  servicePrice: {
    fontSize: scaleFontSize(12),
    color: '#666',
    marginBottom: moderateScale(8),
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(1),
  },
  ratingText: {
    fontSize: scaleFontSize(10),
    color: '#666',
    marginLeft: moderateScale(4),
    fontWeight: '500',
  },
  serviceDescription: {
    fontSize: scaleFontSize(12),
    color: '#666',
    lineHeight: moderateScale(16),
  },
});