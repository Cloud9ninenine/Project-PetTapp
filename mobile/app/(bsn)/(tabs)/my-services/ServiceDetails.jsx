// mobile/app/(bsn)/(tabs)/my-services/ServiceDetails.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ImageBackground,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { wp, hp, moderateScale, scaleFontSize } from "@utils/responsive";
import apiClient from "@config/api";
import AddServiceModal from "./AddServiceModal";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ServiceDetails() {
  const router = useRouter();
  const { serviceId } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [service, setService] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [businessId, setBusinessId] = useState(null);

  useEffect(() => {
    if (serviceId) {
      fetchServiceDetails();
      loadBusinessId();
    }
  }, [serviceId]);

  const loadBusinessId = async () => {
    try {
      const storedBusinessId = await AsyncStorage.getItem('selectedBusinessId');
      if (storedBusinessId) {
        setBusinessId(storedBusinessId);
      }
    } catch (error) {
      console.error('Error loading business ID:', error);
    }
  };

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

  const formatAvailabilityShort = (availability) => {
    if (!availability || !availability.days) return 'N/A';
    const days = availability.days;
    if (days.length === 7) return 'Daily';
    if (days.length > 3) return `${days.length} days/week`;
    return days.map(d => d.substring(0, 3)).join(', ');
  };

  const handleEditService = async (formData, editServiceId) => {
    try {
      // Use the serviceId from the modal or fallback to the one from route params
      const idToUpdate = editServiceId || serviceId;

      const response = await apiClient.put(`/services/${idToUpdate}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.success) {
        Alert.alert('Success', 'Service updated successfully');
        setShowEditModal(false);
        fetchServiceDetails(); // Refresh service data
      }
    } catch (error) {
      console.error('Error updating service:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update service');
      throw error; // Re-throw to prevent modal from closing
    }
  };

  const handleDeleteService = () => {
    Alert.alert(
      'Delete Service',
      'Are you sure you want to delete this service? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiClient.delete(`/services/${serviceId}`);
              if (response.data && response.data.success) {
                Alert.alert('Success', 'Service deleted successfully');
                router.back();
              }
            } catch (error) {
              console.error('Error deleting service:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete service');
            }
          },
        },
      ]
    );
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

  const renderTabContent = () => {
    if (!service) return null;

    return (
      <View style={styles.tabContent}>
        {/* Description */}
        {service.description && (
          <>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{service.description}</Text>
          </>
        )}

        {/* Availability */}
        {service.availability && (
          <>
            <Text style={styles.sectionTitle}>Availability & Time Slots</Text>
            <View style={styles.availabilitySection}>
              {service.availability.days && service.availability.days.length > 0 && (
                <View style={styles.availabilityItem}>
                  <Ionicons name="calendar" size={moderateScale(18)} color="#1C86FF" />
                  <View style={styles.availabilityTextContainer}>
                    <Text style={styles.availabilityLabel}>Available Days</Text>
                    <View style={styles.daysContainer}>
                      {service.availability.days.map((day, index) => (
                        <View key={index} style={styles.dayChip}>
                          <Text style={styles.dayChipText}>
                            {day.charAt(0).toUpperCase() + day.slice(1)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              )}
              {service.availability.timeSlots && service.availability.timeSlots.length > 0 && (
                <View style={styles.availabilityItem}>
                  <Ionicons name="time" size={moderateScale(18)} color="#FF9B79" />
                  <View style={styles.availabilityTextContainer}>
                    <Text style={styles.availabilityLabel}>Time Slots</Text>
                    <View style={styles.timeSlotsContainer}>
                      {service.availability.timeSlots.map((slot, index) => (
                        <View key={index} style={styles.timeSlotChip}>
                          <Text style={styles.timeSlotText}>
                            {slot.start} - {slot.end}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </View>
          </>
        )}

        {/* Requirements */}
        {service.requirements && (
          <>
            <Text style={styles.sectionTitle}>Service Requirements</Text>
            <View style={styles.requirementsSection}>
              {service.requirements.petTypes && service.requirements.petTypes.length > 0 && (
                <View style={styles.requirementItem}>
                  <Text style={styles.requirementLabel}>Pet Types</Text>
                  {service.requirements.petTypes.map((type, index) => (
                    <View key={index} style={styles.bulletPoint}>
                      <View style={styles.bullet} />
                      <Text style={styles.bulletText}>
                        {type === 'guinea-pig' ? 'Guinea Pig' : type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              {service.requirements.ageRestrictions && (service.requirements.ageRestrictions.minAge || service.requirements.ageRestrictions.maxAge) && (
                <View style={styles.requirementItem}>
                  <Text style={styles.requirementLabel}>Age Restrictions</Text>
                  {service.requirements.ageRestrictions.minAge !== undefined && (
                    <View style={styles.bulletPoint}>
                      <View style={styles.bullet} />
                      <Text style={styles.bulletText}>
                        Minimum Age: {service.requirements.ageRestrictions.minAge} {service.requirements.ageRestrictions.minAge === 1 ? 'year' : 'years'}
                      </Text>
                    </View>
                  )}
                  {service.requirements.ageRestrictions.maxAge !== undefined && (
                    <View style={styles.bulletPoint}>
                      <View style={styles.bullet} />
                      <Text style={styles.bulletText}>
                        Maximum Age: {service.requirements.ageRestrictions.maxAge} {service.requirements.ageRestrictions.maxAge === 1 ? 'year' : 'years'}
                      </Text>
                    </View>
                  )}
                </View>
              )}
              {service.requirements.healthRequirements && service.requirements.healthRequirements.length > 0 && (
                <View style={styles.requirementItem}>
                  <Text style={styles.requirementLabel}>Health Requirements</Text>
                  {service.requirements.healthRequirements.map((req, index) => (
                    <View key={index} style={styles.bulletPoint}>
                      <View style={styles.bullet} />
                      <Text style={styles.bulletText}>{req}</Text>
                    </View>
                  ))}
                </View>
              )}
              {service.requirements.specialNotes && (
                <View style={styles.requirementItem}>
                  <Text style={styles.requirementLabel}>Special Notes</Text>
                  <Text style={styles.requirementValue}>{service.requirements.specialNotes}</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Created and Updated Dates */}
        <View style={styles.timestampSection}>
          {service.createdAt && (
            <View style={styles.timestampItem}>
              <Ionicons name="calendar-outline" size={moderateScale(14)} color="#999" />
              <Text style={styles.timestampLabel}>Created: </Text>
              <Text style={styles.timestampValue}>
                {new Date(service.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
            </View>
          )}
          {service.updatedAt && (
            <View style={styles.timestampItem}>
              <Ionicons name="time-outline" size={moderateScale(14)} color="#999" />
              <Text style={styles.timestampLabel}>Updated: </Text>
              <Text style={styles.timestampValue}>
                {new Date(service.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
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

  const serviceImage = service.imageUrl || null;

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("@assets/images/PetTapp pattern.png")}
        style={styles.backgroundimg}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="repeat"
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Image Section with Overlay */}
        <View style={styles.heroSection}>
          {serviceImage ? (
            <Image source={{ uri: serviceImage }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImagePlaceholder, { backgroundColor: getCategoryColor(service.category) }]}>
              <Ionicons name={getCategoryIcon(service.category)} size={moderateScale(80)} color="rgba(255, 255, 255, 0.3)" />
            </View>
          )}

          {/* Overlay Gradient Effect */}
          <View style={styles.imageOverlay} />

          {/* Back Button on Image */}
          <View style={styles.topButtonsContainer}>
            <TouchableOpacity style={styles.circularButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={moderateScale(24)} color="#1C86FF" />
            </TouchableOpacity>
          </View>

          {/* Service Title Card Overlapping Image */}
          <View style={styles.titleCard}>
            <Text style={styles.serviceTitleText} numberOfLines={2}>
              {service.name}
            </Text>
            <View style={styles.badgesRow}>
              <View style={styles.categoryBadge}>
                <Ionicons name="pricetag" size={moderateScale(14)} color="#FF9B79" />
                <Text style={styles.categoryBadgeText}>
                  {service.category.charAt(0).toUpperCase() + service.category.slice(1)}
                </Text>
              </View>
              <View style={[
                styles.statusBadge,
                service.isActive ? styles.statusBadgeActive : styles.statusBadgeInactive
              ]}>
                <Text style={styles.statusBadgeText}>
                  {service.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            {service.description && (
              <Text style={styles.descriptionPreview} numberOfLines={3}>
                {service.description}
              </Text>
            )}
          </View>
        </View>

        {/* Quick Info Cards */}
        <View style={styles.quickInfoContainer}>
          <View style={styles.quickInfoCard}>
            <View style={styles.iconCircle}>
              <Ionicons name="time-outline" size={moderateScale(20)} color="#1C86FF" />
            </View>
            <Text style={styles.quickInfoLabel}>Duration</Text>
            <Text style={styles.quickInfoValue}>{formatDuration(service.duration)}</Text>
          </View>

          <View style={styles.quickInfoCard}>
            <View style={styles.iconCircle}>
              <Ionicons name="cash-outline" size={moderateScale(20)} color="#4CAF50" />
            </View>
            <Text style={styles.quickInfoLabel}>Price</Text>
            <Text style={styles.quickInfoValue}>{formatCurrency(service.price?.amount || 0)}</Text>
          </View>

          <View style={styles.quickInfoCard}>
            <View style={styles.iconCircle}>
              <Ionicons name="people-outline" size={moderateScale(20)} color="#FF9B79" />
            </View>
            <Text style={styles.quickInfoLabel}>Capacity</Text>
            <Text style={styles.quickInfoValue} numberOfLines={2}>
              {service.capacity || service.maxWorkers ?
                `${service.capacity || service.maxWorkers} ${(service.capacity || service.maxWorkers) === 1 ? 'worker' : 'workers'}`
                : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Tab Content */}
        {renderTabContent()}

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setShowEditModal(true)}
          >
            <Ionicons name="create-outline" size={moderateScale(20)} color="#fff" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteService}
          >
            <Ionicons name="trash-outline" size={moderateScale(20)} color="#FF6B6B" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: moderateScale(30) }} />
      </ScrollView>

      {/* Edit Service Modal */}
      <AddServiceModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        onAddService={handleEditService}
        editingService={service}
        businessId={businessId}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  backgroundimg: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.5 }],
  },
  backgroundImageStyle: {
    opacity: 0.08,
  },
  scrollView: {
    flex: 1,
  },

  // Hero Section Styles
  heroSection: {
    position: 'relative',
    width: '100%',
    height: hp(40),
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  topButtonsContainer: {
    position: 'absolute',
    top: moderateScale(50),
    left: wp(5),
    zIndex: 10,
  },
  circularButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  titleCard: {
    position: 'absolute',
    bottom: moderateScale(-30),
    left: wp(5),
    right: wp(5),
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(12),
  },
  serviceTitleText: {
    fontSize: scaleFontSize(22),
    fontFamily: 'SFProBold',
    color: '#1C86FF',
    marginBottom: moderateScale(12),
    textAlign: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    marginBottom: moderateScale(12),
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(12),
    gap: moderateScale(4),
  },
  categoryBadgeText: {
    fontSize: scaleFontSize(12),
    fontWeight: '600',
    color: '#FF9B79',
  },
  descriptionPreview: {
    fontSize: scaleFontSize(13),
    color: '#666',
    lineHeight: moderateScale(19),
  },

  // Quick Info Cards
  quickInfoContainer: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    marginTop: moderateScale(45),
    marginBottom: moderateScale(20),
    gap: moderateScale(10),
  },
  quickInfoCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  iconCircle: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  quickInfoLabel: {
    fontSize: scaleFontSize(11),
    color: '#999',
    marginBottom: moderateScale(4),
  },
  quickInfoValue: {
    fontSize: scaleFontSize(13),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },

  // Tab Content
  tabContent: {
    backgroundColor: '#fff',
    margin: wp(5),
    marginTop: moderateScale(20),
    padding: moderateScale(20),
    borderRadius: moderateScale(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: moderateScale(15),
    marginBottom: moderateScale(10),
  },
  sectionTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#333',
    marginTop: moderateScale(15),
    marginBottom: moderateScale(10),
  },
  statusBadge: {
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(12),
  },
  statusBadgeActive: {
    backgroundColor: '#1C86FF',
  },
  statusBadgeInactive: {
    backgroundColor: '#FF6B6B',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: scaleFontSize(12),
    fontWeight: '600',
    fontFamily: 'SFProBold',
  },
  description: {
    fontSize: scaleFontSize(14),
    color: '#666',
    lineHeight: moderateScale(20),
  },

  // Availability Section
  availabilitySection: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E3F2FD',
    marginTop: moderateScale(8),
    padding: moderateScale(16),
  },
  availabilityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: moderateScale(16),
    gap: moderateScale(12),
  },
  availabilityTextContainer: {
    flex: 1,
  },
  availabilityLabel: {
    fontSize: scaleFontSize(13),
    color: '#333',
    fontWeight: '600',
    marginBottom: moderateScale(8),
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  dayChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: '#1C86FF',
  },
  dayChipText: {
    fontSize: scaleFontSize(12),
    color: '#1C86FF',
    fontWeight: '600',
  },
  timeSlotsContainer: {
    gap: moderateScale(8),
  },
  timeSlotChip: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#FF9B79',
    alignSelf: 'flex-start',
  },
  timeSlotText: {
    fontSize: scaleFontSize(13),
    color: '#FF9B79',
    fontWeight: '600',
  },

  // Requirements Section
  requirementsSection: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E3F2FD',
    padding: moderateScale(16),
    marginTop: moderateScale(8),
  },
  requirementItem: {
    marginBottom: moderateScale(16),
  },
  requirementLabel: {
    fontSize: scaleFontSize(14),
    color: '#333',
    fontWeight: '600',
    marginBottom: moderateScale(12),
  },
  requirementValue: {
    fontSize: scaleFontSize(14),
    color: '#666',
    lineHeight: moderateScale(20),
    marginTop: moderateScale(8),
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: moderateScale(8),
    paddingLeft: moderateScale(8),
  },
  bullet: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: '#1C86FF',
    marginRight: moderateScale(12),
    marginTop: moderateScale(6),
  },
  bulletText: {
    flex: 1,
    fontSize: scaleFontSize(14),
    color: '#666',
    lineHeight: moderateScale(20),
  },

  // Timestamp Section
  timestampSection: {
    marginTop: moderateScale(20),
    paddingTop: moderateScale(16),
    borderTopWidth: 1,
    borderTopColor: '#E3F2FD',
    gap: moderateScale(8),
  },
  timestampItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  timestampLabel: {
    fontSize: scaleFontSize(12),
    color: '#999',
  },
  timestampValue: {
    fontSize: scaleFontSize(12),
    color: '#666',
    fontWeight: '500',
  },

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    margin: wp(5),
    marginTop: moderateScale(24),
    gap: moderateScale(12),
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C86FF',
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(12),
    gap: moderateScale(8),
    shadowColor: '#1C86FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    fontFamily: 'SFProBold',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(12),
    gap: moderateScale(8),
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  deleteButtonText: {
    color: '#FF6B6B',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    fontFamily: 'SFProBold',
  },

  // Loading & Error states
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(8),
  },
  errorText: {
    fontSize: scaleFontSize(18),
    color: '#333',
    marginTop: moderateScale(16),
    marginBottom: moderateScale(24),
    textAlign: 'center',
  },
  backButton: {
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
});
