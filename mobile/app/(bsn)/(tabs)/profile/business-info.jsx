import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Alert,
  Image,
  Pressable,
  ActivityIndicator,
  Platform,
  Switch,
  Modal,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, useNavigation } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from '@config/api';
import DateTimePicker from '@react-native-community/datetimepicker';

const DaySchedule = ({ day, schedule, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(schedule.isOpen);
  const [mode, setMode] = useState('time');
  const [show, setShow] = useState(false);
  const [isPickerFor, setIsPickerFor] = useState('open'); // 'open' or 'close'

  const onChange = (event, selectedDate) => {
    setShow(Platform.OS === 'ios');
    if (selectedDate) {
      const hour = selectedDate.getHours().toString().padStart(2, '0');
      const minute = selectedDate.getMinutes().toString().padStart(2, '0');
      const time = `${hour}:${minute}`;
      const newSchedule = { ...schedule, [isPickerFor]: time, isOpen: true };
      onUpdate(day, newSchedule);
      if(!isOpen) setIsOpen(true);
    }
  };

  const showTimepicker = (pickerFor) => {
    setIsPickerFor(pickerFor);
    setShow(true);
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "HH:MM";
    const parts = timeStr.split(':');
    if (parts.length !== 2) return "HH:MM";
    return timeStr;
  }

  return (
    <View style={styles.dayContainer}>
      <Text style={styles.dayLabel}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
      <Switch
        value={isOpen}
        onValueChange={(value) => {
          setIsOpen(value);
          onUpdate(day, { ...schedule, isOpen: value });
        }}
      />
      <View style={styles.timeInputContainer}>
        <TouchableOpacity onPress={() => showTimepicker('open')} disabled={!isOpen}>
          <View style={[styles.timeInput, !isOpen && styles.disabledInput]}>
            <Text style={styles.timeText}>{formatTime(schedule.open)}</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.timeSeparator}>-</Text>
        <TouchableOpacity onPress={() => showTimepicker('close')} disabled={!isOpen}>
          <View style={[styles.timeInput, !isOpen && styles.disabledInput]}>
            <Text style={styles.timeText}>{formatTime(schedule.close)}</Text>
          </View>
        </TouchableOpacity>
      </View>
      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={new Date()} // You might want to parse schedule.open/close to initialize this
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onChange}
        />
      )}
    </View>
  );
};

export default function BusinessInformationScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businessId, setBusinessId] = useState(null);

  // Modal state for preventing navigation without profile completion
  const [showWarningModal, setShowWarningModal] = useState(false);

  const [businessInfo, setBusinessInfo] = useState({
    businessName: '',
    businessType: '',
    description: '',
    contactInfo: {
      email: '',
      phone: '',
      website: '',
    },
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Philippines',
      coordinates: {
        latitude: null,
        longitude: null,
      },
    },
    logo: null,
    businessHours: {
      monday: { isOpen: false, open: '09:00', close: '17:00' },
      tuesday: { isOpen: false, open: '09:00', close: '17:00' },
      wednesday: { isOpen: false, open: '09:00', close: '17:00' },
      thursday: { isOpen: false, open: '09:00', close: '17:00' },
      friday: { isOpen: false, open: '09:00', close: '17:00' },
      saturday: { isOpen: false, open: '09:00', close: '17:00' },
      sunday: { isOpen: false, open: '09:00', close: '17:00' },
    },
    credentials: {
      licenseNumber: '',
      certifications: [],
      insuranceInfo: '',
    },
  });

  const [showBusinessTypeDropdown, setShowBusinessTypeDropdown] = useState(false);

  // These values MUST match the backend model enum:
  // ['veterinary', 'grooming', 'accommodation', 'transport', 'pet-supplies']
  const businessTypes = [
    { value: 'veterinary', label: 'Veterinary Services' },
    { value: 'grooming', label: 'Pet Grooming' },
    { value: 'accommodation', label: 'Pet Accommodation/Boarding' },
    { value: 'transport', label: 'Pet Transport' },
    { value: 'pet-supplies', label: 'Pet Supplies' },
  ];

  // Check if business profile is complete
  const isBusinessProfileComplete = () => {
    const hasBasicInfo = businessInfo.businessName &&
                         businessInfo.contactInfo.email &&
                         businessInfo.contactInfo.phone;

    const hasAddress = businessInfo.address.street &&
                       businessInfo.address.city;

    return hasBasicInfo && hasAddress;
  };

  // Handle header back button press
  const handleHeaderBackPress = () => {
    // Allow navigation if still loading or if profile is complete
    if (loading || isBusinessProfileComplete()) {
      router.back();
      return;
    }

    setShowWarningModal(true);
  };

  // Handle hardware back button press (Android)
  const handleBackPress = () => {
    // Allow navigation if still loading or if profile is complete
    if (loading || isBusinessProfileComplete()) {
      return false; // Allow back navigation
    }

    setShowWarningModal(true);
    return true; // Prevent default back behavior
  };

  // Prevent back navigation and tab switching if profile is incomplete
  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

      // Prevent tab navigation if profile is incomplete
      const beforeRemoveListener = navigation.addListener('beforeRemove', (e) => {
        // Allow navigation if still loading or if profile is complete
        if (loading || isBusinessProfileComplete()) {
          return;
        }

        // Prevent default navigation behavior
        e.preventDefault();

        // Show warning modal
        setShowWarningModal(true);
      });

      return () => {
        backHandler.remove();
        beforeRemoveListener();
      };
    }, [businessInfo, navigation, loading])
  );

  useEffect(() => {
    fetchBusinessInfo();
  }, []);

  const fetchBusinessInfo = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/businesses');

      if (response.data && response.data.data && response.data.data.length > 0) {
        const business = response.data.data[0];
        setBusinessId(business._id);

        // Valid business types according to backend model
        const validTypes = ['veterinary', 'grooming', 'accommodation', 'transport', 'pet-supplies'];

        // Get businessType and validate it
        let businessTypeValue = '';
        if (Array.isArray(business.businessType) && business.businessType.length > 0) {
          // Map old values to new valid ones
          const typeMapping = {
            'daycare': 'accommodation',
            'boarding': 'accommodation',
            'training': 'veterinary',
            'pet-shop': 'pet-supplies',
            'other': 'pet-supplies'
          };

          const currentType = business.businessType[0];
          // If it's already valid, use it; otherwise map it
          businessTypeValue = validTypes.includes(currentType)
            ? currentType
            : (typeMapping[currentType] || 'veterinary');

          // Notify user if their business type was migrated
          if (!validTypes.includes(currentType)) {
            const oldTypeLabel = currentType.charAt(0).toUpperCase() + currentType.slice(1);
            const newTypeLabel = businessTypes.find(t => t.value === businessTypeValue)?.label || businessTypeValue;
            setTimeout(() => {
              Alert.alert(
                'Business Type Updated',
                `Your business type "${oldTypeLabel}" has been automatically updated to "${newTypeLabel}" to match our current service categories. Please review and update if needed.`,
                [{ text: 'OK' }]
              );
            }, 500);
          }
        }

        setBusinessInfo({
          businessName: business.businessName || '',
          businessType: businessTypeValue,
          description: business.description || '',
          contactInfo: {
            email: business.contactInfo?.email || '',
            phone: business.contactInfo?.phone || '',
            website: business.contactInfo?.website || '',
          },
          address: {
            street: business.address?.street || '',
            city: business.address?.city || '',
            state: business.address?.state || '',
            zipCode: business.address?.zipCode || '',
            country: business.address?.country || 'Philippines',
            coordinates: {
              // Backend sends GeoJSON: { type: 'Point', coordinates: [lng, lat] }
              // Convert to our format: { latitude, longitude }
              latitude: business.address?.coordinates?.coordinates?.[1] || null,
              longitude: business.address?.coordinates?.coordinates?.[0] || null,
            },
          },
          logo: business.images?.logo || business.logo || null,
          businessHours: business.businessHours || businessInfo.businessHours,
          credentials: business.credentials || businessInfo.credentials,
        });
      }
    } catch (error) {
      console.error('Error fetching business info:', error);
      Alert.alert('Error', 'Failed to load business information');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoPickerAsync = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setBusinessInfo({...businessInfo, logo: result.assets[0]});
      }
    } catch (error) {
      console.error('Error picking logo:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Get current location
  const handleGetCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need location permissions to get your current location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setBusinessInfo({
        ...businessInfo,
        address: {
          ...businessInfo.address,
          coordinates: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
        },
      });
      Alert.alert('Success', 'Current location set successfully!');
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  // Handle map marker drag
  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setBusinessInfo({
      ...businessInfo,
      address: {
        ...businessInfo.address,
        coordinates: {
          latitude,
          longitude,
        },
      },
    });
  };


  const handleSave = async () => {
    // Validation
    if (!businessInfo.businessName.trim()) {
      Alert.alert('Validation Error', 'Business name is required');
      return;
    }
    if (!businessInfo.businessType) {
      Alert.alert('Validation Error', 'Business type is required');
      return;
    }
    if (!businessInfo.contactInfo.email.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      return;
    }
    if (!businessInfo.contactInfo.phone.trim()) {
      Alert.alert('Validation Error', 'Phone is required');
      return;
    }

    // Validate coordinates if provided
    if (businessInfo.address.coordinates.latitude !== null || businessInfo.address.coordinates.longitude !== null) {
      const lat = businessInfo.address.coordinates.latitude;
      const lng = businessInfo.address.coordinates.longitude;

      if (lat !== null && (lat < -90 || lat > 90)) {
        Alert.alert('Validation Error', 'Latitude must be between -90 and 90');
        return;
      }
      if (lng !== null && (lng < -180 || lng > 180)) {
        Alert.alert('Validation Error', 'Longitude must be between -180 and 180');
        return;
      }
    }

    try {
      setSaving(true);

      const formData = new FormData();

      // Append simple fields
      formData.append('businessName', String(businessInfo.businessName));

      // Backend expects businessType as an array, not a string
      formData.append('businessType', JSON.stringify([businessInfo.businessType]));

      if (businessInfo.description) {
        formData.append('description', String(businessInfo.description));
      }

      // Prepare address with coordinates (only include if both lat and lng are set)
      const addressData = {
        street: businessInfo.address.street,
        city: businessInfo.address.city,
        state: businessInfo.address.state,
        zipCode: businessInfo.address.zipCode,
        country: businessInfo.address.country,
      };

      // Only add coordinates if both latitude and longitude are valid numbers
      // Backend expects GeoJSON format: { type: 'Point', coordinates: [longitude, latitude] }
      if (
        businessInfo.address.coordinates.latitude !== null &&
        businessInfo.address.coordinates.longitude !== null &&
        !isNaN(businessInfo.address.coordinates.latitude) &&
        !isNaN(businessInfo.address.coordinates.longitude)
      ) {
        addressData.coordinates = {
          type: 'Point',
          coordinates: [
            Number(businessInfo.address.coordinates.longitude),  // longitude FIRST
            Number(businessInfo.address.coordinates.latitude)    // latitude SECOND
          ]
        };
      }

      // Append complex fields as JSON strings
      formData.append('contactInfo', JSON.stringify(businessInfo.contactInfo));
      formData.append('address', JSON.stringify(addressData));
      formData.append('businessHours', JSON.stringify(businessInfo.businessHours));
      formData.append('credentials', JSON.stringify({
        ...businessInfo.credentials,
        certifications: typeof businessInfo.credentials.certifications === 'string'
          ? businessInfo.credentials.certifications.split(',').map(c => c.trim())
          : businessInfo.credentials.certifications,
      }));

      // Append logo if it's new
      if (businessInfo.logo && typeof businessInfo.logo === 'object' && businessInfo.logo.uri) {
        const logoUri = Platform.OS === 'ios' ? businessInfo.logo.uri.replace('file://', '') : businessInfo.logo.uri;
        const filename = businessInfo.logo.uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('logo', {
          uri: logoUri,
          name: filename || 'logo.jpg',
          type,
        });
      }

      let response;
      if (businessId) {
        // Update existing business
        response = await apiClient.put(`/businesses/${businessId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        // Create new business
        response = await apiClient.post('/businesses', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (response.data && response.data._id) {
          setBusinessId(response.data._id);
        }
      }

      Alert.alert('Success', 'Business information updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving business info:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      let errorMessage = 'Failed to save business information';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
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
        <Header
          backgroundColor="#1C86FF"
          titleColor="#fff"
          title="Business Information"
          showBack={true}
          onBackPress={handleHeaderBackPress}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1C86FF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        title="Business Information"
        showBack={true}
        onBackPress={handleHeaderBackPress}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Business Details Section */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="business-outline" size={moderateScale(24)} color="#1C86FF" />
            <Text style={styles.sectionTitle}>Business Details</Text>
          </View>

          {/* Logo */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Logo</Text>
            <View style={styles.profilePicContainer}>
              <TouchableOpacity
                style={styles.circleImageContainer}
                onPress={handleLogoPickerAsync}
              >
                {businessInfo.logo ? (
                  <Image
                    source={{
                      uri: typeof businessInfo.logo === 'string'
                        ? businessInfo.logo
                        : businessInfo.logo.uri
                    }}
                    style={styles.circleImage}
                  />
                ) : (
                  <View style={styles.circlePlaceholder}>
                    <Ionicons name="camera" size={moderateScale(35)} color="#1C86FF" />
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.profilePicHint}>Tap to upload logo</Text>
            </View>
          </View>

          {/* Business Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Name *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="storefront" size={moderateScale(20)} color="#1C86FF" />
              <TextInput
                style={styles.input}
                value={businessInfo.businessName}
                onChangeText={(text) => setBusinessInfo({ ...businessInfo, businessName: text })}
                placeholder="Enter business name"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Business Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Type *</Text>
            <TouchableOpacity
              style={styles.dropdownContainer}
              onPress={() => setShowBusinessTypeDropdown(!showBusinessTypeDropdown)}
            >
              <Ionicons name="pricetag" size={moderateScale(20)} color="#1C86FF" />
              <Text style={[styles.dropdownText, !businessInfo.businessType && styles.dropdownPlaceholder]}>
                {businessTypes.find(t => t.value === businessInfo.businessType)?.label || 'Select business type'}
              </Text>
              <Ionicons
                name={showBusinessTypeDropdown ? "chevron-up" : "chevron-down"}
                size={moderateScale(20)}
                color="#666"
              />
            </TouchableOpacity>
            {showBusinessTypeDropdown && (
              <ScrollView style={styles.dropdownList} nestedScrollEnabled={true}>
                {businessTypes.map((type, index) => (
                  <Pressable
                    key={type.value}
                    style={({ pressed }) => [
                      styles.dropdownItem,
                      businessInfo.businessType === type.value && styles.dropdownItemSelected,
                      pressed && styles.dropdownItemPressed,
                      index === businessTypes.length - 1 && styles.dropdownItemLast,
                    ]}
                    onPress={() => {
                      setBusinessInfo({ ...businessInfo, businessType: type.value });
                      setShowBusinessTypeDropdown(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      businessInfo.businessType === type.value && styles.dropdownItemTextSelected
                    ]}>
                      {type.label}
                    </Text>
                    {businessInfo.businessType === type.value && (
                      <Ionicons name="checkmark-circle" size={moderateScale(22)} color="#1C86FF" />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                value={businessInfo.description}
                onChangeText={(text) => setBusinessInfo({ ...businessInfo, description: text })}
                placeholder="Describe your business services"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* Contact Information Section */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="call-outline" size={moderateScale(24)} color="#1C86FF" />
            <Text style={styles.sectionTitle}>Contact Information</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={moderateScale(20)} color="#1C86FF" />
              <TextInput
                style={styles.input}
                value={businessInfo.contactInfo.email}
                onChangeText={(text) => setBusinessInfo({
                  ...businessInfo,
                  contactInfo: {...businessInfo.contactInfo, email: text}
                })}
                placeholder="Enter email address"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call" size={moderateScale(20)} color="#1C86FF" />
              <TextInput
                style={styles.input}
                value={businessInfo.contactInfo.phone}
                onChangeText={(text) => setBusinessInfo({
                  ...businessInfo,
                  contactInfo: {...businessInfo.contactInfo, phone: text}
                })}
                placeholder="Enter phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Website (Optional)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="globe" size={moderateScale(20)} color="#1C86FF" />
              <TextInput
                style={styles.input}
                value={businessInfo.contactInfo.website}
                onChangeText={(text) => setBusinessInfo({
                  ...businessInfo,
                  contactInfo: {...businessInfo.contactInfo, website: text}
                })}
                placeholder="Enter website URL"
                placeholderTextColor="#999"
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        {/* Address Section */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="location-outline" size={moderateScale(24)} color="#1C86FF" />
            <Text style={styles.sectionTitle}>Address</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={businessInfo.address.street}
                onChangeText={(text) => setBusinessInfo({
                  ...businessInfo,
                  address: {...businessInfo.address, street: text}
                })}
                placeholder="Enter street address"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>City *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={businessInfo.address.city}
                onChangeText={(text) => setBusinessInfo({
                  ...businessInfo,
                  address: {...businessInfo.address, city: text}
                })}
                placeholder="Enter city"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>State / Province *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={businessInfo.address.state}
                onChangeText={(text) => setBusinessInfo({
                  ...businessInfo,
                  address: {...businessInfo.address, state: text}
                })}
                placeholder="Enter state or province"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Zip Code *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={businessInfo.address.zipCode}
                onChangeText={(text) => setBusinessInfo({
                  ...businessInfo,
                  address: {...businessInfo.address, zipCode: text}
                })}
                placeholder="Enter zip code"
                placeholderTextColor="#999"
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Map Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Location (Optional)</Text>
            <Text style={styles.hint}>
              Tap on the map to set your business location or use current location
            </Text>

            <TouchableOpacity
              style={styles.locationButton}
              onPress={handleGetCurrentLocation}
            >
              <Ionicons name="locate" size={moderateScale(20)} color="#fff" />
              <Text style={styles.locationButtonText}>Use Current Location</Text>
            </TouchableOpacity>

            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: businessInfo.address.coordinates.latitude || 14.5995,
                  longitude: businessInfo.address.coordinates.longitude || 120.9842,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                }}
                region={businessInfo.address.coordinates.latitude ? {
                  latitude: businessInfo.address.coordinates.latitude,
                  longitude: businessInfo.address.coordinates.longitude,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                } : undefined}
                onPress={handleMapPress}
              >
                {businessInfo.address.coordinates.latitude && businessInfo.address.coordinates.longitude && (
                  <Marker
                    coordinate={{
                      latitude: businessInfo.address.coordinates.latitude,
                      longitude: businessInfo.address.coordinates.longitude,
                    }}
                    title="Business Location"
                    draggable
                    onDragEnd={handleMapPress}
                  />
                )}
              </MapView>
            </View>

            {businessInfo.address.coordinates.latitude && businessInfo.address.coordinates.longitude && (
              <View style={styles.coordinatesDisplay}>
                <Text style={styles.coordinatesText}>
                  Latitude: {businessInfo.address.coordinates.latitude.toFixed(6)}
                </Text>
                <Text style={styles.coordinatesText}>
                  Longitude: {businessInfo.address.coordinates.longitude.toFixed(6)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Business Hours Section */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="time-outline" size={moderateScale(24)} color="#1C86FF" />
            <Text style={styles.sectionTitle}>Business Hours</Text>
          </View>
          {Object.keys(businessInfo.businessHours).map(day => (
            <DaySchedule
              key={day}
              day={day}
              schedule={businessInfo.businessHours[day]}
              onUpdate={(day, newSchedule) => {
                setBusinessInfo(prev => ({...prev, businessHours: {...prev.businessHours, [day]: newSchedule}}));
              }}
            />
          ))}
        </View>

        {/* Credentials Section */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="ribbon-outline" size={moderateScale(24)} color="#1C86FF" />
            <Text style={styles.sectionTitle}>Credentials</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>License Number</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="card-outline" size={moderateScale(20)} color="#1C86FF" />
              <TextInput
                style={styles.input}
                value={businessInfo.credentials.licenseNumber}
                onChangeText={(text) => setBusinessInfo({ ...businessInfo, credentials: { ...businessInfo.credentials, licenseNumber: text } })}
                placeholder="e.g., VET-12345"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Certifications (comma-separated)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="medal-outline" size={moderateScale(20)} color="#1C86FF" />
              <TextInput
                style={styles.input}
                value={Array.isArray(businessInfo.credentials.certifications) ? businessInfo.credentials.certifications.join(', ') : businessInfo.credentials.certifications}
                onChangeText={(text) => setBusinessInfo({ ...businessInfo, credentials: { ...businessInfo.credentials, certifications: text } })}
                placeholder="e.g., Certified Groomer, Pet First Aid"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Insurance Information</Text>
            <View style={styles.textAreaInputContainer}>
              <Ionicons name="shield-checkmark-outline" size={moderateScale(20)} color="#1C86FF" style={{ marginTop: moderateScale(2) }}/>
              <TextInput
                style={styles.textAreaInput}
                value={businessInfo.credentials.insuranceInfo}
                onChangeText={(text) => setBusinessInfo({ ...businessInfo, credentials: { ...businessInfo.credentials, insuranceInfo: text } })}
                placeholder="Details about your business insurance"
                placeholderTextColor="#999"
                multiline
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={moderateScale(22)} color="#fff" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Warning Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showWarningModal}
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Icon Container */}
            <View style={styles.modalIconContainer}>
              <View style={styles.modalIconCircle}>
                <Ionicons
                  name="business-outline"
                  size={moderateScale(48)}
                  color="#1C86FF"
                />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.modalTitle}>Business Profile Required</Text>

            {/* Message */}
            <Text style={styles.modalMessage}>
              You must complete your business profile setup to access the dashboard. Please fill in all required information.
            </Text>

            {/* Single Button */}
            <TouchableOpacity
              style={styles.modalFullWidthButton}
              onPress={() => setShowWarningModal(false)}
            >
              <Text style={styles.modalFullWidthButtonText}>Continue Setup</Text>
              <Ionicons name="arrow-forward" size={moderateScale(20)} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: moderateScale(10),
    fontSize: scaleFontSize(16),
    color: '#666',
  },
  content: {
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(20),
    paddingBottom: moderateScale(40),
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    marginBottom: moderateScale(20),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(8),
    gap: moderateScale(10),
  },
  sectionTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#1C86FF',
  },
  sectionSubtitle: {
    fontSize: scaleFontSize(13),
    color: '#666',
    lineHeight: scaleFontSize(18),
    marginBottom: moderateScale(16),
  },
  inputGroup: {
    marginBottom: moderateScale(20),
  },
  label: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(8),
  },
  hint: {
    fontSize: scaleFontSize(12),
    color: '#999',
    marginBottom: moderateScale(8),
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    fontSize: scaleFontSize(15),
    color: '#333',
    marginLeft: moderateScale(12),
  },
  textAreaContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textAreaInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    fontSize: scaleFontSize(15),
    color: '#333',
    minHeight: moderateScale(80),
  },
  textAreaInput: {
    flex: 1,
    fontSize: scaleFontSize(15),
    color: '#333',
    marginLeft: moderateScale(12),
    minHeight: moderateScale(60),
    textAlignVertical: 'top',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#1C86FF',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    shadowColor: '#1C86FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
  profilePicContainer: {
    alignItems: 'center',
    marginVertical: moderateScale(10),
  },
  circleImageContainer: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    borderWidth: 3,
    borderColor: '#1C86FF',
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
    marginBottom: moderateScale(10),
  },
  circlePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
  },
  circleImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profilePicHint: {
    fontSize: scaleFontSize(13),
    color: '#666',
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(14),
    borderWidth: 2,
    borderColor: '#1C86FF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  dropdownText: {
    flex: 1,
    fontSize: scaleFontSize(15),
    color: '#333',
    marginLeft: moderateScale(12),
    fontWeight: '500',
  },
  dropdownPlaceholder: {
    color: '#999',
    fontWeight: '400',
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    marginTop: moderateScale(8),
    borderWidth: 1,
    borderColor: '#1C86FF',
    maxHeight: moderateScale(250),
    elevation: 5,
    shadowColor: '#1C86FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    backgroundColor: '#fff',
  },
  dropdownItemText: {
    fontSize: scaleFontSize(15),
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },
  dropdownItemSelected: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: moderateScale(4),
    borderLeftColor: '#1C86FF',
  },
  dropdownItemPressed: {
    backgroundColor: '#F5F5F5',
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemTextSelected: {
    color: '#1C86FF',
    fontWeight: '600',
  },
  dayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dayLabel: {
    fontSize: scaleFontSize(16),
    fontWeight: '500',
    width: '25%',
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
    width: moderateScale(70),
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: scaleFontSize(14),
    color: '#333',
    textAlign: 'center',
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#999',
  },
  timeSeparator: {
    marginHorizontal: moderateScale(5),
  },
  // Map Styles
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C86FF',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(12),
    gap: moderateScale(8),
  },
  locationButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(14),
    fontWeight: '600',
  },
  mapContainer: {
    height: moderateScale(250),
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: moderateScale(12),
  },
  map: {
    flex: 1,
  },
  coordinatesDisplay: {
    backgroundColor: '#F8F9FA',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  coordinatesText: {
    fontSize: scaleFontSize(13),
    color: '#333',
    marginBottom: moderateScale(4),
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(20),
    padding: moderateScale(30),
    width: '90%',
    maxWidth: moderateScale(400),
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalIconContainer: {
    marginBottom: moderateScale(20),
  },
  modalIconCircle: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: moderateScale(3),
    borderColor: '#1C86FF',
  },
  modalTitle: {
    fontSize: scaleFontSize(22),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: moderateScale(12),
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: scaleFontSize(15),
    color: '#666',
    textAlign: 'center',
    lineHeight: scaleFontSize(22),
    marginBottom: moderateScale(30),
    paddingHorizontal: moderateScale(10),
  },
  modalFullWidthButton: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: moderateScale(16),
    paddingHorizontal: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: '#1C86FF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(10),
    elevation: 4,
    shadowColor: '#1C86FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  modalFullWidthButtonText: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
});
