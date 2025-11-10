import * as Location from 'expo-location';
import cacheManager from '@utils/cacheManager';

/**
 * Location Service - Handles location-related operations
 */

// Location cache key
const LOCATION_CACHE_KEY = 'user_location';
const LOCATION_CACHE_TTL = 600000; // 10 minutes

/**
 * Request location permissions and get current position
 * @param {boolean} forceRefresh - Force fresh location fetch, skip cache
 * @returns {Promise<Object|null>} Location object with latitude and longitude, or null if permission denied
 */
export const getUserLocation = async (forceRefresh = false) => {
  try {
    // Check cache first unless forcing refresh
    if (!forceRefresh) {
      const cachedLocation = cacheManager.get(LOCATION_CACHE_KEY);
      if (cachedLocation) {
        if (__DEV__) {
          console.log('📦 Using cached location');
        }
        return cachedLocation;
      }
    }

    // Request foreground location permissions
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      console.warn('Location permission denied');
      return null;
    }

    // Get current position
    const currentLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const locationData = {
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
      accuracy: currentLocation.coords.accuracy,
      timestamp: currentLocation.timestamp,
    };

    // Cache location for 10 minutes
    cacheManager.set(LOCATION_CACHE_KEY, locationData, LOCATION_CACHE_TTL);

    return locationData;
  } catch (error) {
    console.error('Error getting user location:', error);
    return null;
  }
};

/**
 * Check if location permissions are granted
 * @returns {Promise<boolean>} True if permissions are granted
 */
export const checkLocationPermissions = async () => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking location permissions:', error);
    return false;
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return parseFloat(distance.toFixed(2));
};

/**
 * Convert degrees to radians
 * @param {number} degrees - Degrees value
 * @returns {number} Radians value
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Format distance for display
 * @param {number} distance - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distance) => {
  if (!distance && distance !== 0) return 'Unknown distance';

  const numericDistance = typeof distance === 'number' ? distance : parseFloat(distance) || 0;

  if (numericDistance < 1) {
    return `${Math.round(numericDistance * 1000)} m`;
  }

  return `${numericDistance.toFixed(1)} km`;
};

/**
 * Get address from coordinates (reverse geocoding)
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise<Object|null>} Address object or null
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (addresses && addresses.length > 0) {
      const address = addresses[0];
      return {
        street: address.street,
        city: address.city,
        region: address.region,
        country: address.country,
        postalCode: address.postalCode,
        fullAddress: `${address.street || ''}, ${address.city || ''}, ${address.region || ''} ${address.postalCode || ''}`.trim(),
      };
    }

    return null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
};

/**
 * Get coordinates from address (forward geocoding)
 * @param {string} address - Address string
 * @returns {Promise<Object|null>} Coordinates object or null
 */
export const geocodeAddress = async (address) => {
  if (!address || address.trim().length === 0) {
    return null;
  }

  try {
    const locations = await Location.geocodeAsync(address);

    if (locations && locations.length > 0) {
      const location = locations[0];
      return {
        latitude: location.latitude,
        longitude: location.longitude,
      };
    }

    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
};

/**
 * Watch user's location with real-time updates
 * @param {Function} callback - Callback function to receive location updates
 * @returns {Promise<Object>} Subscription object with remove() method
 */
export const watchUserLocation = async (callback) => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      console.warn('Location permission denied');
      return null;
    }

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000, // Update every 5 seconds
        distanceInterval: 10, // Update if moved 10 meters
      },
      (location) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: location.timestamp,
        });
      }
    );

    return subscription;
  } catch (error) {
    console.error('Error watching user location:', error);
    return null;
  }
};

/**
 * Check if coordinates are within a bounding box
 * @param {Object} point - Point coordinates {latitude, longitude}
 * @param {Object} bounds - Bounding box {minLat, maxLat, minLng, maxLng}
 * @returns {boolean} True if point is within bounds
 */
export const isWithinBounds = (point, bounds) => {
  return (
    point.latitude >= bounds.minLat &&
    point.latitude <= bounds.maxLat &&
    point.longitude >= bounds.minLng &&
    point.longitude <= bounds.maxLng
  );
};

/**
 * Filter items by proximity to user location
 * @param {Array} items - Array of items with latitude and longitude
 * @param {Object} userLocation - User's location {latitude, longitude}
 * @param {number} maxDistance - Maximum distance in kilometers
 * @returns {Array} Filtered and sorted items with distance property
 */
export const filterByProximity = (items, userLocation, maxDistance = 10) => {
  if (!userLocation) return items;

  return items
    .map(item => ({
      ...item,
      distance: calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        item.latitude || item.location?.latitude,
        item.longitude || item.location?.longitude
      ),
    }))
    .filter(item => item.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Get user's last known location (cached)
 * @returns {Promise<Object|null>} Last known location or null
 */
export const getLastKnownLocation = async () => {
  try {
    const location = await Location.getLastKnownPositionAsync();

    if (location) {
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting last known location:', error);
    return null;
  }
};
