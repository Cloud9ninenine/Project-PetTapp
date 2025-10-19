import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from "../../../config/api";
import MapViewer from './map-viewer';
import MapPicker from './map-picker';

export default function AddressManager() {
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState({
    label: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Philippines',
    latitude: null,
    longitude: null,
  });

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/addresses');

      if (response.status === 200 && response.data?.data) {
        setAddresses(Array.isArray(response.data.data) ? response.data.data : []);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      Alert.alert('Error', 'Failed to load addresses');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      label: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Philippines',
      latitude: null,
      longitude: null,
    });
  };

  const validateForm = () => {
    if (!formData.label.trim()) {
      Alert.alert('Error', 'Please enter an address label');
      return false;
    }
    if (!formData.street.trim()) {
      Alert.alert('Error', 'Please enter a street address');
      return false;
    }
    if (!formData.city.trim()) {
      Alert.alert('Error', 'Please enter a city');
      return false;
    }
    if (!formData.state.trim()) {
      Alert.alert('Error', 'Please enter a state/province');
      return false;
    }
    if (!formData.zipCode.trim()) {
      Alert.alert('Error', 'Please enter a zip code');
      return false;
    }
    if (!formData.country.trim()) {
      Alert.alert('Error', 'Please enter a country');
      return false;
    }
    return true;
  };

  const handleAddAddress = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const response = await apiClient.post('/addresses', formData);

      if (response.status === 201) {
        Alert.alert('Success', 'Address added successfully!');
        resetForm();
        setShowAddModal(false);
        loadAddresses();
      }
    } catch (error) {
      console.error('Error adding address:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add address');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateAddress = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const response = await apiClient.put(`/addresses/${selectedAddress._id}`, formData);

      if (response.status === 200) {
        Alert.alert('Success', 'Address updated successfully!');
        resetForm();
        setShowEditModal(false);
        setSelectedAddress(null);
        loadAddresses();
      }
    } catch (error) {
      console.error('Error updating address:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update address');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiClient.delete(`/addresses/${addressId}`);

              if (response.status === 200) {
                Alert.alert('Success', 'Address deleted successfully!');
                setShowViewModal(false);
                setSelectedAddress(null);
                loadAddresses();
              }
            } catch (error) {
              console.error('Error deleting address:', error);
              Alert.alert('Error', 'Failed to delete address');
            }
          },
        },
      ]
    );
  };

  const handleViewAddress = async (address) => {
    try {
      // Fetch the specific address details
      const response = await apiClient.get(`/addresses/${address._id}`);

      if (response.status === 200 && response.data?.data) {
        setSelectedAddress(response.data.data);
        setShowViewModal(true);
      }
    } catch (error) {
      console.error('Error loading address details:', error);
      // Fallback to using the passed address if API fails
      setSelectedAddress(address);
      setShowViewModal(true);
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      const response = await apiClient.patch(`/addresses/${addressId}/set-default`);

      if (response.status === 200) {
        Alert.alert('Success', 'Default address updated!');
        setShowViewModal(false);
        setSelectedAddress(null);
        loadAddresses();
      }
    } catch (error) {
      console.error('Error setting default address:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to set default address');
    }
  };

  const handleEditAddress = (address) => {
    setSelectedAddress(address);
    setFormData({
      label: address.label || '',
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      zipCode: address.zipCode || '',
      country: address.country || 'Philippines',
      latitude: address.latitude || null,
      longitude: address.longitude || null,
    });
    setShowViewModal(false);
    setShowEditModal(true);
  };

  const handleLocationSelect = async (location) => {
    // Update form data with selected location
    if (location) {
      setFormData(prev => ({
        ...prev,
        latitude: location.latitude,
        longitude: location.longitude,
      }));
    }

    // Save the address
    setIsSaving(true);
    try {
      const dataToSave = {
        ...formData,
        latitude: location?.latitude || null,
        longitude: location?.longitude || null,
      };

      let response;
      if (isEditMode && selectedAddress) {
        response = await apiClient.put(`/addresses/${selectedAddress._id}`, dataToSave);
        if (response.status === 200) {
          Alert.alert('Success', 'Address updated successfully!');
        }
      } else {
        response = await apiClient.post('/addresses', dataToSave);
        if (response.status === 201) {
          Alert.alert('Success', 'Address added successfully!');
        }
      }

      resetForm();
      setShowMapPicker(false);
      setSelectedAddress(null);
      setIsEditMode(false);
      loadAddresses();
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save address');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMapPickerBack = () => {
    setShowMapPicker(false);
    if (isEditMode) {
      setShowEditModal(true);
    } else {
      setShowAddModal(true);
    }
  };

  const renderAddressForm = (isEdit = false) => (
    <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Set Address as:</Text>
        <TextInput
          style={styles.input}
          value={formData.label}
          onChangeText={(value) => setFormData(prev => ({ ...prev, label: value }))}
          placeholder="e.g., Home, Work, Parents' House"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Street Address:</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.street}
          onChangeText={(value) => setFormData(prev => ({ ...prev, street: value }))}
          placeholder="House/Lot No., Building, Street Name"
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>City:</Text>
        <TextInput
          style={styles.input}
          value={formData.city}
          onChangeText={(value) => setFormData(prev => ({ ...prev, city: value }))}
          placeholder="Enter city"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>State/Province:</Text>
        <TextInput
          style={styles.input}
          value={formData.state}
          onChangeText={(value) => setFormData(prev => ({ ...prev, state: value }))}
          placeholder="Enter state or province"
        />
      </View>

      <View style={styles.rowInputGroup}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Zip Code:</Text>
          <TextInput
            style={styles.input}
            value={formData.zipCode}
            onChangeText={(value) => setFormData(prev => ({ ...prev, zipCode: value }))}
            placeholder="0000"
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.halfInput}>
          <Text style={styles.label}>Country:</Text>
          <TextInput
            style={styles.input}
            value={formData.country}
            onChangeText={(value) => setFormData(prev => ({ ...prev, country: value }))}
            placeholder="Country"
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => {
          if (!validateForm()) return;
          setIsEditMode(isEdit);
          if (isEdit) {
            setShowEditModal(false);
          } else {
            setShowAddModal(false);
          }
          setShowMapPicker(true);
        }}
      >
        <Text style={styles.nextButtonText}>Next</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>

      {isEdit && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            setShowEditModal(false);
            resetForm();
            setSelectedAddress(null);
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="location-outline" size={24} color="#1C86FF" />
        <Text style={styles.headerTitle}>My Addresses</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setShowAddModal(true);
          }}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1C86FF" />
          <Text style={styles.loadingText}>Loading addresses...</Text>
        </View>
      ) : addresses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>No addresses added yet</Text>
          <Text style={styles.emptySubtext}>Tap the + button to add your first address</Text>
        </View>
      ) : (
        <ScrollView style={styles.addressList} showsVerticalScrollIndicator={false}>
          {addresses.map((address) => (
            <TouchableOpacity
              key={address._id}
              style={[
                styles.addressCard,
                address.isDefault && styles.addressCardDefault
              ]}
              onPress={() => handleViewAddress(address)}
            >
              <View style={styles.addressCardHeader}>
                <Ionicons name="location" size={24} color="#1C86FF" />
                <Text style={styles.addressLabel}>{address.label}</Text>
                {address.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                  </View>
                )}
              </View>
              <Text style={styles.addressText}>{address.street}</Text>
              <Text style={styles.addressText}>
                {address.city}, {address.state} {address.zipCode}
              </Text>
              <Text style={styles.addressText}>{address.country}</Text>
              {address.latitude && address.longitude && (
                <View style={styles.coordinatesChip}>
                  <Ionicons name="navigate" size={12} color="#666" />
                  <Text style={styles.coordinatesChipText}>
                    {address.latitude.toFixed(6)}, {address.longitude.toFixed(6)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Add Address Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        onRequestClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Address</Text>
            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              <Ionicons name="close" size={28} color="#666" />
            </TouchableOpacity>
          </View>
          {renderAddressForm(false)}
        </View>
      </Modal>

      {/* Edit Address Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        onRequestClose={() => {
          setShowEditModal(false);
          resetForm();
          setSelectedAddress(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Address</Text>
            <TouchableOpacity
              onPress={() => {
                setShowEditModal(false);
                resetForm();
                setSelectedAddress(null);
              }}
            >
              <Ionicons name="close" size={28} color="#666" />
            </TouchableOpacity>
          </View>
          {renderAddressForm(true)}
        </View>
      </Modal>

      {/* View Address Modal */}
      <Modal
        visible={showViewModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowViewModal(false);
          setSelectedAddress(null);
        }}
      >
        <View style={styles.viewModalOverlay}>
          <View style={styles.viewModalContent}>
            <View style={styles.viewModalHeader}>
              <Ionicons name="location" size={40} color="#1C86FF" />
              <Text style={styles.viewModalTitle}>{selectedAddress?.label}</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.viewAddressDetails}>
                <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Street Address</Text>
                <Text style={styles.detailValue}>{selectedAddress?.street}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>City</Text>
                <Text style={styles.detailValue}>{selectedAddress?.city}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>State/Province</Text>
                <Text style={styles.detailValue}>{selectedAddress?.state}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Zip Code</Text>
                <Text style={styles.detailValue}>{selectedAddress?.zipCode}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Country</Text>
                <Text style={styles.detailValue}>{selectedAddress?.country}</Text>
              </View>

              {selectedAddress?.latitude && selectedAddress?.longitude && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Coordinates</Text>
                  <Text style={styles.detailValue}>
                    {selectedAddress.latitude.toFixed(6)}, {selectedAddress.longitude.toFixed(6)}
                  </Text>
                </View>
              )}
            </View>

            {selectedAddress?.latitude && selectedAddress?.longitude && (
              <TouchableOpacity
                style={styles.viewMapButton}
                onPress={() => {
                  setShowViewModal(false);
                  setShowMapModal(true);
                }}
              >
                <Ionicons name="map" size={20} color="#fff" />
                <Text style={styles.viewMapButtonText}>View on Map</Text>
              </TouchableOpacity>
            )}

            {!selectedAddress?.isDefault && (
              <TouchableOpacity
                style={styles.setDefaultButton}
                onPress={() => handleSetDefault(selectedAddress?._id)}
              >
                <Ionicons name="star" size={20} color="#FFA500" />
                <Text style={styles.setDefaultButtonText}>Set as Default</Text>
              </TouchableOpacity>
            )}

            {selectedAddress?.isDefault && (
              <View style={styles.defaultIndicator}>
                <Ionicons name="star" size={20} color="#FFA500" />
                <Text style={styles.defaultIndicatorText}>This is your default address</Text>
              </View>
            )}

            <View style={styles.viewModalButtons}>
              <TouchableOpacity
                style={styles.editButtonModal}
                onPress={() => handleEditAddress(selectedAddress)}
              >
                <Ionicons name="create-outline" size={20} color="#fff" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButtonModal}
                onPress={() => handleDeleteAddress(selectedAddress?._id)}
              >
                <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowViewModal(false);
                setSelectedAddress(null);
              }}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Map Viewer Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        onRequestClose={() => {
          setShowMapModal(false);
          setShowViewModal(true);
        }}
      >
        <MapViewer
          address={selectedAddress}
          onClose={() => {
            setShowMapModal(false);
            setShowViewModal(true);
          }}
        />
      </Modal>

      {/* Map Picker Modal */}
      <Modal
        visible={showMapPicker}
        animationType="slide"
        onRequestClose={handleMapPickerBack}
      >
        <MapPicker
          initialLocation={
            formData.latitude && formData.longitude
              ? { latitude: formData.latitude, longitude: formData.longitude }
              : null
          }
          onLocationSelect={handleLocationSelect}
          onBack={handleMapPickerBack}
          addressLabel={formData.label}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'SFProBold',
    color: '#333',
    marginLeft: 8,
  },
  addButton: {
    backgroundColor: '#1C86FF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'SFProReg',
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'SFProSB',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'SFProReg',
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
  },
  addressList: {
    flex: 1,
    padding: 16,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#1C86FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  addressCardDefault: {
    borderColor: '#FFA500',
    borderWidth: 2,
  },
  addressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  defaultBadge: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  defaultBadgeText: {
    fontSize: 11,
    fontFamily: 'SFProBold',
    color: '#fff',
  },
  addressLabel: {
    fontSize: 18,
    fontFamily: 'SFProBold',
    color: '#1C86FF',
    marginLeft: 8,
  },
  addressText: {
    fontSize: 14,
    fontFamily: 'SFProReg',
    color: '#333',
    marginTop: 4,
  },
  coordinatesChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
    gap: 4,
  },
  coordinatesChipText: {
    fontSize: 11,
    fontFamily: 'SFProReg',
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'SFProBold',
    color: '#1C86FF',
  },
  modalScrollView: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  rowInputGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: 'black',
    marginBottom: 6,
    fontFamily: 'SFProSB',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#1C86FF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'SFProReg',
  },
  textArea: {
    minHeight: 60,
    paddingTop: 12,
  },
  coordinatesSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  coordinatesTitle: {
    fontSize: 16,
    fontFamily: 'SFProBold',
    color: '#333',
    marginBottom: 4,
  },
  coordinatesSubtitle: {
    fontSize: 13,
    fontFamily: 'SFProReg',
    color: '#666',
    marginBottom: 12,
  },
  coordinatesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nextButton: {
    flexDirection: 'row',
    backgroundColor: '#1C86FF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 12,
    gap: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'SFProSB',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1C86FF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  cancelButtonText: {
    color: '#1C86FF',
    fontSize: 16,
    fontFamily: 'SFProSB',
  },
  viewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  viewModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxHeight: '90%',
  },
  viewModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  viewModalTitle: {
    fontSize: 22,
    fontFamily: 'SFProBold',
    color: '#1C86FF',
    marginTop: 8,
  },
  viewAddressDetails: {
    marginBottom: 20,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: 'SFProReg',
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontFamily: 'SFProSB',
    color: '#333',
  },
  viewMapButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  viewMapButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'SFProSB',
  },
  setDefaultButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FFA500',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  setDefaultButtonText: {
    color: '#FFA500',
    fontSize: 16,
    fontFamily: 'SFProSB',
  },
  defaultIndicator: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  defaultIndicatorText: {
    color: '#FFA500',
    fontSize: 16,
    fontFamily: 'SFProSB',
  },
  viewModalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  editButtonModal: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1C86FF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'SFProSB',
  },
  deleteButtonModal: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  deleteButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontFamily: 'SFProSB',
  },
  closeButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'SFProSB',
  },
});
