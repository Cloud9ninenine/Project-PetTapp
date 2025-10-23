import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import Constants from 'expo-constants';

// Firebase configuration from environment variables
// In Expo/React Native, environment variables from .env are accessed via Constants.expoConfig.extra
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.VITE_FIREBASE_API_KEY || "AIzaSyCHLZaEuwJZqJWkKh2N7tCTkGYyJaeGbf4",
  authDomain: Constants.expoConfig?.extra?.VITE_FIREBASE_AUTH_DOMAIN || "pettapp-73df7.firebaseapp.com",
  projectId: Constants.expoConfig?.extra?.VITE_FIREBASE_PROJECT_ID || "pettapp-73df7",
  storageBucket: Constants.expoConfig?.extra?.VITE_FIREBASE_STORAGE_BUCKET || "pettapp-73df7.firebasestorage.app",
  messagingSenderId: Constants.expoConfig?.extra?.VITE_FIREBASE_MESSAGING_SENDER_ID || "7963028027",
  appId: Constants.expoConfig?.extra?.VITE_FIREBASE_APP_ID || "1:7963028027:web:89ecaca1bd8808b8fe4a1e"
};

// Initialize Firebase only if it hasn't been initialized
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Get Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app);

/**
 * Sign in to Firebase using custom token from backend
 * @param {string} customToken - Custom token from backend API
 * @returns {Promise<UserCredential>}
 */
export const signInWithBackendToken = async (customToken) => {
  try {
    const userCredential = await signInWithCustomToken(auth, customToken);
    return userCredential;
  } catch (error) {
    console.error('Error signing in with custom token:', error);
    throw error;
  }
};

/**
 * Get current Firebase user
 * @returns {User|null}
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Sign out from Firebase
 * @returns {Promise<void>}
 */
export const signOutFirebase = async () => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Error signing out from Firebase:', error);
    throw error;
  }
};

export default app;
