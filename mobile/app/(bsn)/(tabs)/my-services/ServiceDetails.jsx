// mobile/app/(bsn)/(tabs)/my-services/ServiceDetails.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  ImageBackground,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { wp, hp, moderateScale, scaleFontSize } from "@utils/responsive";
import apiClient from "@config/api";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ServiceDetails() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { serviceId } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [service, setService] = useState(null);

  useEffect(() => {
    if (serviceId) {
      fetchServiceDetails();
    }
  }, [serviceId]);

  const fetchServiceDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/services/${serviceId}`);

      if (response.data && response.data.success) {
        setService(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching service details:', error);
      Alert.alert('Error', 'Failed to load service details');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} mins`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getCategoryIcon = (category) => {
    const iconMap = {
      veterinary: 'medical',
      grooming: 'cut',
      boarding: 'home',
      daycare: 'sunny',
      training: 'school',
      emergency: 'alert-circle',
      consultation: 'chatbubbles',
      other: 'ellipsis-horizontal'
    };
    return iconMap[category] || 'briefcase';
  };

  const getCategoryColor = (category) => {
    const colorMap = {
      veterinary: '#4CAF50',
      grooming: '#2196F3',
      boarding: '#FF9B79',
      daycare: '#FFD700',
      training: '#9C27B0',
      emergency: '#FF6B6B',
      consultation: '#00BCD4',
      other: '#999'
    };
    return colorMap[category] || '#1C86FF';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ImageBackground
          source={require("@assets/images/PetTapp pattern.png")}
          style={styles.backgroundimg}
          imageStyle={styles.backgroundImageStyle}
          resizeMode="repeat"
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1C86FF" />
          <Text style={styles.loadingText}>Loading service details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!service) {
    return (
      <SafeAreaView style={styles.container}>
        <ImageBackground
          source={require("@assets/images/PetTapp pattern.png")}
          style={styles.backgroundimg}
          imageStyle={styles.backgroundImageStyle}
          resizeMode="repeat"
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={moderateScale(64)} color="#FF6B6B" />
          <Text style={styles.errorText}>Service not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const serviceImage = service.images?.main || service.image || null;

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("@assets/images/PetTapp pattern.png")}
        style={styles.backgroundimg}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="repeat"
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + moderateScale(10) }]}>
        <TouchableOpacity style={styles.backIconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={moderateScale(24)} color="#1C86FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Service Image */}
        {serviceImage ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: serviceImage }}
              style={styles.serviceImage}
              resizeMode="cover"
            />
          </View>
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: getCategoryColor(service.category) }]}>
            <Ionicons name={getCategoryIcon(service.category)} size={moderateScale(64)} color="#fff" />
          </View>
        )}

        {/* Service Info Card */}
        <View style={styles.contentContainer}>
          {/* Title and Status */}
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceCategory}>
                {service.category.charAt(0).toUpperCase() + service.category.slice(1)}
              </Text>
            </View>
            <View style={[
              styles.statusBadge,
              service.isActive ? styles.activeBadge : styles.inactiveBadge
            ]}>
              <Text style={styles.statusText}>
                {service.isActive ? 'Available' : 'Unavailable'}
              </Text>
            </View>
          </View>

          {/* Price and Duration */}
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Ionicons name="cash-outline" size={moderateScale(24)} color="#1C86FF" />
              <Text style={styles.infoLabel}>Price</Text>
              <Text style={styles.infoValue}>{formatCurrency(service.price?.amount || 0)}</Text>
            </View>
            <View style={styles.infoCard}>
              <Ionicons name="time-outline" size={moderateScale(24)} color="#1C86FF" />
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>{formatDuration(service.duration)}</Text>
            </View>
          </View>

          {/* Description */}
          {service.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{service.description}</Text>
            </View>
          )}

          {/* Additional Details */}
          {service.requirements && service.requirements.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Requirements</Text>
              {service.requirements.map((req, index) => (
                <View key={index} style={styles.listItem}>
                  <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#4CAF50" />
                  <Text style={styles.listItemText}>{req}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Pet Types */}
          {service.petTypes && service.petTypes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available For</Text>
              <View style={styles.tagsContainer}>
                {service.petTypes.map((type, index) => (
                  <View key={index} style={styles.tag}>
                    <Ionicons name="paw" size={moderateScale(16)} color="#1C86FF" />
                    <Text style={styles.tagText}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Additional Images */}
          {service.images?.gallery && service.images.gallery.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gallery</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {service.images.gallery.map((image, index) => (
                  <Image
                    key={index}
                    source={{ uri: image }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push({
                pathname: "../my-services",
                params: { editServiceId: serviceId }
              })}
            >
              <Ionicons name="create-outline" size={moderateScale(20)} color="#fff" />
              <Text style={styles.editButtonText}>Edit Service</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  backgroundimg: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.5 }],
  },
  backgroundImageStyle: {
    opacity: 0.05,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: moderateScale(12),
    fontSize: scaleFontSize(14),
    color: '#666',
    fontFamily: 'SFProReg',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
  },
  errorText: {
    marginTop: moderateScale(16),
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'SFProBold',
  },
  backButton: {
    marginTop: moderateScale(24),
    backgroundColor: '#1C86FF',
    paddingHorizontal: moderateScale(32),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(8),
  },
  backButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    fontFamily: 'SFProBold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingBottom: moderateScale(15),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backIconButton: {
    padding: moderateScale(8),
  },
  headerTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'SFProBold',
  },
  placeholder: {
    width: moderateScale(40),
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: hp(30),
    backgroundColor: '#E3F2FD',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: hp(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: wp(5),
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(20),
  },
  titleContainer: {
    flex: 1,
    marginRight: moderateScale(12),
  },
  serviceName: {
    fontSize: scaleFontSize(24),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: moderateScale(4),
    fontFamily: 'SFProBold',
  },
  serviceCategory: {
    fontSize: scaleFontSize(16),
    color: '#666',
    fontFamily: 'SFProReg',
  },
  statusBadge: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
  },
  activeBadge: {
    backgroundColor: '#4CAF50',
  },
  inactiveBadge: {
    backgroundColor: '#FF6B6B',
  },
  statusText: {
    color: '#fff',
    fontSize: scaleFontSize(12),
    fontWeight: '600',
    fontFamily: 'SFProBold',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: moderateScale(12),
    marginBottom: moderateScale(24),
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    alignItems: 'center',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  infoLabel: {
    fontSize: scaleFontSize(12),
    color: '#999',
    marginTop: moderateScale(8),
    marginBottom: moderateScale(4),
    fontFamily: 'SFProReg',
  },
  infoValue: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'SFProBold',
  },
  section: {
    marginBottom: moderateScale(24),
  },
  sectionTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: moderateScale(12),
    fontFamily: 'SFProBold',
  },
  description: {
    fontSize: scaleFontSize(15),
    color: '#666',
    lineHeight: scaleFontSize(22),
    fontFamily: 'SFProReg',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  listItemText: {
    fontSize: scaleFontSize(14),
    color: '#666',
    marginLeft: moderateScale(8),
    flex: 1,
    fontFamily: 'SFProReg',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(16),
    gap: moderateScale(4),
  },
  tagText: {
    fontSize: scaleFontSize(13),
    color: '#1C86FF',
    fontWeight: '500',
    fontFamily: 'SFProReg',
  },
  galleryImage: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(12),
    marginRight: moderateScale(12),
  },
  actionButtons: {
    marginTop: moderateScale(8),
    marginBottom: moderateScale(24),
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: '#1C86FF',
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  editButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    fontFamily: 'SFProBold',
  },
});
