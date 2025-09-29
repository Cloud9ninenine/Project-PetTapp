import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function AuthLayout() {
  return (
    <>
      <StatusBar style="dark" backgroundColor="#f5f5f5" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#f5f5f5' },
        }}
      >
        
        <Stack.Screen 
          name="login" 
          options={{
            title: 'Login',
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="signup" 
          options={{
            title: 'Sign Up',
            gestureEnabled: true,
          }}
        />
        <Stack.Screen 
          name="forgot-password" 
          options={{
            title: 'Forgot Password',
            gestureEnabled: true,
          }}
        />
        <Stack.Screen 
          name="initial-setup" 
          options={{
            title: 'User Information',
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="pet-information" 
          options={{
            title: 'Pet Information',
            gestureEnabled: true,
          }}
        />
        <Stack.Screen 
          name="account-created" 
          options={{
            title: 'Account Created',
            gestureEnabled: false,
          }}
        />
      </Stack>
    </>
  );
}