import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '@config/firebase';
import { signInWithCustomToken } from 'firebase/auth';
import { getFirebaseAuthToken } from '@utils/messageService';

const FIREBASE_TOKEN_KEY = 'firebaseCustomToken';
const FIREBASE_TOKEN_EXPIRY_KEY = 'firebaseTokenExpiry';

/**
 * Initialize Firebase authentication with persisted token
 * Call this on app startup or when user logs in
 * @returns {Promise<boolean>} true if authenticated successfully
 */
export const initializeFirebaseAuth = async () => {
  try {
    // Check if user is already signed in to Firebase
    if (auth.currentUser) {
      console.log('Firebase: Already authenticated');
      return true;
    }

    // Try to get stored Firebase token
    const storedToken = await AsyncStorage.getItem(FIREBASE_TOKEN_KEY);
    const tokenExpiry = await AsyncStorage.getItem(FIREBASE_TOKEN_EXPIRY_KEY);

    // Check if token exists and is not expired
    const now = Date.now();
    if (storedToken && tokenExpiry && parseInt(tokenExpiry) > now) {
      console.log('Firebase: Using stored token');
      try {
        await signInWithCustomToken(auth, storedToken);
        console.log('Firebase: Signed in with stored token');
        return true;
      } catch (error) {
        console.log('Firebase: Stored token invalid, fetching new token');
        // Token is invalid, remove it and fetch new one
        await AsyncStorage.multiRemove([FIREBASE_TOKEN_KEY, FIREBASE_TOKEN_EXPIRY_KEY]);
      }
    }

    // No valid token, fetch new one from backend
    console.log('Firebase: Fetching new token from backend');
    const userId = await AsyncStorage.getItem('userId');

    if (!userId) {
      console.log('Firebase: No userId found, user not logged in');
      return false;
    }

    const firebaseToken = await getFirebaseAuthToken();
    await storeFirebaseToken(firebaseToken);
    await signInWithCustomToken(auth, firebaseToken);
    console.log('Firebase: Signed in with new token');
    return true;
  } catch (error) {
    console.error('Firebase: Authentication failed:', error);
    return false;
  }
};

/**
 * Store Firebase custom token in AsyncStorage
 * Firebase custom tokens expire after 1 hour
 * @param {string} token - Firebase custom token
 */
export const storeFirebaseToken = async (token) => {
  try {
    // Custom tokens expire after 1 hour, store expiry time
    const expiryTime = Date.now() + (55 * 60 * 1000); // 55 minutes to be safe

    await AsyncStorage.multiSet([
      [FIREBASE_TOKEN_KEY, token],
      [FIREBASE_TOKEN_EXPIRY_KEY, expiryTime.toString()],
    ]);

    console.log('Firebase: Token stored successfully');
  } catch (error) {
    console.error('Firebase: Failed to store token:', error);
  }
};

/**
 * Clear stored Firebase token
 * Call this on logout
 */
export const clearFirebaseToken = async () => {
  try {
    // Try to remove Firebase token from AsyncStorage (may already be cleared)
    try {
      await AsyncStorage.multiRemove([FIREBASE_TOKEN_KEY, FIREBASE_TOKEN_EXPIRY_KEY]);
    } catch (storageError) {
      console.log('Firebase: AsyncStorage already cleared or error:', storageError.message);
    }

    // Sign out from Firebase (always attempt this)
    if (auth.currentUser) {
      console.log('Firebase: Signing out user:', auth.currentUser.uid);
      await auth.signOut();
      console.log('Firebase: Successfully signed out');
    } else {
      console.log('Firebase: No current user to sign out');
    }

    console.log('Firebase: Token cleared and signed out');
  } catch (error) {
    console.error('Firebase: Failed to clear token:', error);
    // Force sign out even if there's an error
    try {
      await auth.signOut();
    } catch (signOutError) {
      console.error('Firebase: Force sign out failed:', signOutError);
    }
  }
};

/**
 * Check if Firebase auth is valid and refresh if needed
 * @returns {Promise<boolean>} true if authenticated
 */
export const ensureFirebaseAuth = async () => {
  try {
    // If already authenticated, check if token is still valid
    if (auth.currentUser) {
      // Check token expiry
      const tokenExpiry = await AsyncStorage.getItem(FIREBASE_TOKEN_EXPIRY_KEY);
      const now = Date.now();

      if (tokenExpiry && parseInt(tokenExpiry) > now) {
        console.log('Firebase: Auth still valid');
        return true;
      }

      // Token expired, sign out and re-authenticate
      console.log('Firebase: Token expired, refreshing');
      await auth.signOut();
    }

    // Re-authenticate
    return await initializeFirebaseAuth();
  } catch (error) {
    console.error('Firebase: Failed to ensure auth:', error);
    return false;
  }
};
