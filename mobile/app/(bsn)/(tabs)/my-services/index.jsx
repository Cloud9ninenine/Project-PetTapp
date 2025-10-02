import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from "@components/Header";
import AddServiceModal from './AddServiceModal';
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';

export default function MyServicesScreen() {
  const [services, setServices] = useState([
    {
      id: '1',
      name: 'Veterinary Check-up',
      category: 'Veterinary',
      price: '₱500',
      duration: '30 mins',
      description: 'Comprehensive health check-up for your pet',
      icon: 'medical',
      color: '#4CAF50',
      available: true,
    },
    {
      id: '2',
      name: 'Pet Grooming',
      category: 'Grooming',
      price: '₱800',
      duration: '1 hour',
      description: 'Professional grooming services',
      icon: 'cut',
      color: '#2196F3',
      available: true,
    },
    {
      id: '3',
      name: 'Pet Boarding',
      category: 'Boarding',
      price: '₱1,200/day',
      duration: 'Full day',
      description: 'Safe and comfortable boarding facilities',
      icon: 'home',
      color: '#FF9B79',
      available: true,
    },
    {
      id: '4',
      name: 'Vaccination',
      category: 'Veterinary',
      price: '₱300',
      duration: '15 mins',
      description: 'Essential vaccinations for pets',
      icon: 'medical',
      color: '#4CAF50',
      available: false,
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const handleAddService = (newService) => {
    if (editingService) {
      // Update existing service
      setServices(services.map(service =>
        service.id === editingService.id ? { ...service, ...newService } : service
      ));
      setEditingService(null);
    } else {
      // Add new service
      const service = {
        id: Date.now().toString(),
        ...newService,
        available: true,
      };
      setServices([...services, service]);
    }
    setShowAddModal(false);
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setShowAddModal(true);
  };

  const handleDeleteService = (id) => {
    Alert.alert(
      'Delete Service',
      'Are you sure you want to delete this service?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setServices(services.filter(service => service.id !== id));
          },
        },
      ]
    );
  };

  const toggleAvailability = (id) => {
    setServices(services.map(service =>
      service.id === id ? { ...service, available: !service.available } : service
    ));
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingService(null);
  };

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText}>My Services</Text>
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
      <Header
        backgroundColor="#1C86FF"
        titleColor="#fff"
        customTitle={renderTitle()}
        showBack={false}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{services.length}</Text>
            <Text style={styles.statLabel}>Total Services</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{services.filter(s => s.available).length}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
        </View>

        {/* Services List */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Your Services</Text>
          {services.map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              <View style={[styles.serviceIconContainer, { backgroundColor: service.color }]}>
                <Ionicons name={service.icon} size={moderateScale(28)} color="#fff" />
              </View>

              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceCategory}>{service.category}</Text>
                <View style={styles.serviceDetails}>
                  <Text style={styles.servicePrice}>{service.price}</Text>
                  <Text style={styles.serviceDuration}> • {service.duration}</Text>
                </View>
              </View>

              <View style={styles.serviceActions}>
                <TouchableOpacity
                  style={[
                    styles.availabilityToggle,
                    service.available ? styles.availableToggle : styles.unavailableToggle
                  ]}
                  onPress={() => toggleAvailability(service.id)}
                >
                  <Text style={styles.toggleText}>
                    {service.available ? 'Available' : 'Unavailable'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditService(service)}
                  >
                    <Ionicons name="create-outline" size={moderateScale(20)} color="#1C86FF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteService(service.id)}
                  >
                    <Ionicons name="trash-outline" size={moderateScale(20)} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Add Service Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add-circle" size={moderateScale(24)} color="#fff" />
          <Text style={styles.addButtonText}>Add New Service</Text>
        </TouchableOpacity>
      </ScrollView>

      <AddServiceModal
        visible={showAddModal}
        onClose={handleCloseModal}
        onAddService={handleAddService}
        editingService={editingService}
      />
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
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(20),
    paddingBottom: moderateScale(100),
  },
  statsContainer: {
    flexDirection: 'row',
    gap: moderateScale(12),
    marginBottom: moderateScale(25),
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(20),
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: scaleFontSize(32),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(4),
  },
  statLabel: {
    fontSize: scaleFontSize(12),
    color: '#666',
  },
  servicesSection: {
    marginBottom: moderateScale(20),
  },
  sectionTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(15),
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    marginBottom: moderateScale(12),
    alignItems: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  serviceIconContainer: {
    width: moderateScale(55),
    height: moderateScale(55),
    borderRadius: moderateScale(28),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: moderateScale(4),
  },
  serviceCategory: {
    fontSize: scaleFontSize(13),
    color: '#666',
    marginBottom: moderateScale(4),
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#1C86FF',
  },
  serviceDuration: {
    fontSize: scaleFontSize(12),
    color: '#999',
  },
  serviceActions: {
    alignItems: 'flex-end',
    gap: moderateScale(8),
  },
  availabilityToggle: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(12),
  },
  availableToggle: {
    backgroundColor: '#4CAF50',
  },
  unavailableToggle: {
    backgroundColor: '#FF6B6B',
  },
  toggleText: {
    fontSize: scaleFontSize(11),
    color: '#fff',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },
  editButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#1C86FF',
    borderRadius: moderateScale(12),
    paddingVertical: hp(1.8),
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    elevation: 3,
    shadowColor: '#1C86FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
});
