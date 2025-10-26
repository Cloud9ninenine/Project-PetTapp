import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore, auth } from '@config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

    console.log('LOCAL USER INFO:');
    console.log('- AsyncStorage userId:', userId);
    console.log('- Firebase UID:', firebaseUser?.uid);
    console.log('- UIDs match:', userId === firebaseUser?.uid);

    // Skip querying ALL conversations (causes permission error due to security rules)
    console.log('\nSKIPPING ALL CONVERSATIONS QUERY (requires admin permissions)');
    console.log('Instead, querying only conversations where user is participant...');

    // Now query only conversations for current user
    console.log('\nQUERYING MY CONVERSATIONS:');
    const conversationsRef = collection(firestore, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId)
    );

    const myConversationsSnapshot = await getDocs(q);
    console.log(`Found ${myConversationsSnapshot.docs.length} conversations for userId: ${userId}`);

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
      totalConversations: 'N/A (permission denied)',
      myConversations: myConversationsSnapshot.docs.length,
      idsMatch: userId === firebaseUser?.uid
    };
  } catch (error) {
    console.error('Error debugging Firestore:', error);
    throw error;
  }
};

/**
 * Check if a conversation exists between two users
 */
export const checkConversationExists = async (userId1, userId2) => {
  try {
    const participants = [userId1, userId2].sort();
    const expectedConversationId = `${participants[0]}_${participants[1]}`;

    console.log('Checking for conversation:');
    console.log('- User 1:', userId1);
    console.log('- User 2:', userId2);
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
