
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCHLZaEuwJZqJWkKh2N7tCTkGYyJaeGbf4",
  authDomain: "pettapp-73df7.firebaseapp.com",
  projectId: "pettapp-73df7",
  storageBucket: "pettapp-73df7.appspot.com",
  messagingSenderId: "7963028027",
  appId: "1:7963028027:web:89ecaca1bd8808b8fe4a1e",
  measurementId: "G-7SQ8JFNVL9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export { db, auth };
