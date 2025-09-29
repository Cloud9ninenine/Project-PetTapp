import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function IndexScreen() {
  useEffect(() => {
    // Check if user is authenticated
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    // TODO: Implement actual auth check logic here
    // For now, we'll redirect to welcome screen after a brief delay
    
    try {
      // Example: Check for stored auth token
      // const token = await AsyncStorage.getItem('authToken');
      // const isValidToken = await validateToken(token);
      
      // For demo purposes, show welcome screen first
      setTimeout(() => {
        router.replace('/welcome');
      }, 1500);
      
      // If authenticated, redirect to main app:
      // router.replace('/(user)/(tabs)');
    } catch (error) {
      // If error checking auth, redirect to welcome
      router.replace('/welcome');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#000" />
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