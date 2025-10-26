import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore, auth } from '@config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Convert user ID to Firebase UID format
 * CRITICAL: Must match backend format (pettapp_userId)
 */
const toFirebaseUid = (userId) => {
  return `pettapp_${userId}`;
};

/**
 * Debug function to see all conversations in Firestore
 * Call this from your component to debug conversation sync issues
 */
export const debugAllConversations = async () => {
  try {
    console.log('\n========== FIRESTORE DEBUG START ==========');

    // Get current user info
    const userId = await AsyncStorage.getItem('userId');
    const firebaseUser = auth.currentUser;
    const expectedFirebaseUid = toFirebaseUid(userId);

    console.log('LOCAL USER INFO:');
    console.log('- AsyncStorage userId:', userId);
    console.log('- Expected Firebase UID:', expectedFirebaseUid);
    console.log('- Actual Firebase UID:', firebaseUser?.uid);
    console.log('- UIDs match:', expectedFirebaseUid === firebaseUser?.uid);

    // Skip querying ALL conversations (causes permission error due to security rules)
    console.log('\nSKIPPING ALL CONVERSATIONS QUERY (requires admin permissions)');
    console.log('Instead, querying only conversations where user is participant...');

    // Now query only conversations for current user using Firebase UID
    console.log('\nQUERYING MY CONVERSATIONS:');
    const conversationsRef = collection(firestore, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', expectedFirebaseUid)
    );

    const myConversationsSnapshot = await getDocs(q);
    console.log(`Found ${myConversationsSnapshot.docs.length} conversations for Firebase UID: ${expectedFirebaseUid}`);

    // Show details of each conversation found
    myConversationsSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n  Conversation ${index + 1}:`);
      console.log(`    - ID: ${doc.id}`);
      console.log(`    - Participants:`, data.participants);
      console.log(`    - Last message: ${data.lastMessage?.message || 'None'}`);
      console.log(`    - Updated at: ${data.updatedAt}`);

      // Check participant details
      if (data.participantDetails) {
        Object.entries(data.participantDetails).forEach(([id, details]) => {
          console.log(`    - Participant ${id}: ${details.fullName} (${details.role})`);
        });
      }
    });

    console.log('========== FIRESTORE DEBUG END ==========\n');

    return {
      userId,
      firebaseUid: firebaseUser?.uid,
      expectedFirebaseUid,
      totalConversations: 'N/A (permission denied)',
      myConversations: myConversationsSnapshot.docs.length,
      idsMatch: expectedFirebaseUid === firebaseUser?.uid
    };
  } catch (error) {
    console.error('Error debugging Firestore:', error);
    throw error;
  }
};

/**
 * Check if a conversation exists between two users
 * CRITICAL: Uses Firebase UID format to match backend
 */
export const checkConversationExists = async (userId1, userId2) => {
  try {
    const firebaseUid1 = toFirebaseUid(userId1);
    const firebaseUid2 = toFirebaseUid(userId2);
    const participants = [firebaseUid1, firebaseUid2].sort();
    const expectedConversationId = `${participants[0]}_${participants[1]}`;

    console.log('Checking for conversation:');
    console.log('- User 1:', userId1, '→ Firebase UID:', firebaseUid1);
    console.log('- User 2:', userId2, '→ Firebase UID:', firebaseUid2);
    console.log('- Expected ID:', expectedConversationId);

    const conversationsRef = collection(firestore, 'conversations');
    const snapshot = await getDocs(conversationsRef);

    const conversation = snapshot.docs.find(doc => doc.id === expectedConversationId);

    if (conversation) {
      console.log('✓ Conversation EXISTS');
      console.log('- Participants:', conversation.data().participants);
    } else {
      console.log('✗ Conversation DOES NOT EXIST');
    }

    return !!conversation;
  } catch (error) {
    console.error('Error checking conversation:', error);
    return false;
  }
};
