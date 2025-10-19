import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function IndexScreen() {
  useEffect(() => {
    // Check if user is authenticated
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check for stored auth token and user role
      const [accessToken, userRole] = await AsyncStorage.multiGet([
        'accessToken',
        'userRole',
      ]);

      const token = accessToken[1];
      const role = userRole[1];

      console.log('Checking auth status...', { hasToken: !!token, role });

      // If we have a valid token and role, navigate to the appropriate screen
      if (token && role) {
        console.log('User is authenticated, navigating to:', role);

        if (role === 'business-owner') {
          router.replace('/(bsn)/(tabs)/home');
        } else if (role === 'pet-owner') {
          router.replace('/(user)/(tabs)/home');
        } else {
          // Unknown role, go to welcome
          console.warn('Unknown user role:', role);
          router.replace('/welcome');
        }
      } else {
        // No token or role, show welcome screen
        console.log('User is not authenticated, showing welcome screen');
        router.replace('/welcome');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      // If error checking auth, redirect to welcome
      router.replace('/welcome');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1C86FF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
