import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { waitForServer, checkServerWithMessage } from '@config/api';

export default function IndexScreen() {
  const [statusMessage, setStatusMessage] = useState('Initializing app...');

  useEffect(() => {
    // Initialize app with backend check first
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Step 1: Check backend health first
      setStatusMessage('Connecting to server...');
      console.log('🚀 Checking backend health before proceeding...');

      const serverOnline = await waitForServer(5, 3000);

      if (!serverOnline) {
        setStatusMessage('Server unavailable. Please try again later.');
        console.error('❌ Backend is not available. Cannot proceed.');
        // Still navigate to welcome screen even if server is down
        // This allows users to see the app UI, but they won't be able to login
        setTimeout(() => {
          router.replace('/welcome');
        }, 2000);
        return;
      }

      console.log('✅ Backend is online and ready!');
      setStatusMessage('Server connected. Loading app...');

      // Step 2: Check if user is authenticated
      await checkAuthStatus();
    } catch (error) {
      console.error('Error initializing app:', error);
      setStatusMessage('Error initializing app');
      // If error, redirect to welcome after a short delay
      setTimeout(() => {
        router.replace('/welcome');
      }, 1000);
    }
  };

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
      <Text style={styles.statusText}>{statusMessage}</Text>
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
  statusText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
