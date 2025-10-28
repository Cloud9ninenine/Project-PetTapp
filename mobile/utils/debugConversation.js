import { doc, getDoc } from 'firebase/firestore';
import { db as firestore, auth } from '@config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Debug helper to inspect a conversation in Firestore
 * Call this before sending a message to see what's in the conversation
 */
export const debugConversation = async (conversationId) => {
  try {
    console.log('\n🔍 ===== CONVERSATION DEBUG START =====');

    // 1. Check current user info
    const userId = await AsyncStorage.getItem('userId');
    const currentUser = auth.currentUser;

    console.log('👤 Current User Info:');
    console.log('  - User ID from storage:', userId);
    console.log('  - Expected Firebase UID:', userId ? `pettapp_${userId}` : 'N/A');
    console.log('  - Actual Firebase Auth UID:', currentUser?.uid || 'NOT AUTHENTICATED');
    console.log('  - Firebase Auth Email:', currentUser?.email || 'N/A');
    console.log('  - UIDs Match:', currentUser?.uid === `pettapp_${userId}`);

    // 2. Check conversation exists
    console.log('\n💬 Conversation Info:');
    console.log('  - Conversation ID:', conversationId);

    const conversationRef = doc(firestore, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (!conversationSnap.exists()) {
      console.error('  ❌ CONVERSATION DOES NOT EXIST IN FIRESTORE!');
      console.log('  - This is likely why you\'re getting permission errors');
      console.log('  - The conversation needs to be created on the backend first');
      return false;
    }

    console.log('  ✅ Conversation exists in Firestore');

    // 3. Check conversation data
    const conversationData = conversationSnap.data();
    console.log('\n📋 Conversation Data:');
    console.log('  - Participants:', conversationData.participants || []);
    console.log('  - Participant Count:', (conversationData.participants || []).length);
    console.log('  - Created At:', conversationData.createdAt);
    console.log('  - Last Message:', conversationData.lastMessage?.text || 'None');

    // 4. Check participant details
    console.log('\n👥 Participant Details:');
    if (conversationData.participantDetails) {
      Object.entries(conversationData.participantDetails).forEach(([uid, details]) => {
        console.log(`  - ${uid}:`);
        console.log(`    - Name: ${details.fullName}`);
        console.log(`    - Role: ${details.role}`);
        console.log(`    - Original User ID: ${details.userId}`);
      });
    } else {
      console.log('  ⚠️ No participant details found');
    }

    // 5. Check if current user is a participant
    const participants = conversationData.participants || [];
    const expectedUid = `pettapp_${userId}`;
    const isParticipant = participants.includes(expectedUid);
    const isAuthParticipant = participants.includes(currentUser?.uid);

    console.log('\n🔐 Permission Check:');
    console.log('  - Expected UID in participants?', isParticipant ? '✅ YES' : '❌ NO');
    console.log('  - Auth UID in participants?', isAuthParticipant ? '✅ YES' : '❌ NO');

    if (!isParticipant && !isAuthParticipant) {
      console.error('\n❌ PERMISSION ISSUE DETECTED:');
      console.error('  - Your UID is NOT in the participants array');
      console.error('  - Expected:', expectedUid);
      console.error('  - Or:', currentUser?.uid);
      console.error('  - Actual participants:', participants);
      console.error('  - This is why you\'re getting "insufficient permissions"');
      return false;
    }

    // 6. Check unread counts
    console.log('\n📬 Unread Counts:');
    if (conversationData.unreadCount) {
      Object.entries(conversationData.unreadCount).forEach(([uid, count]) => {
        console.log(`  - ${uid}: ${count}`);
      });
    } else {
      console.log('  - No unread count data');
    }

    console.log('\n✅ ===== CONVERSATION DEBUG END =====\n');
    return true;
  } catch (error) {
    console.error('\n❌ Error debugging conversation:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    return false;
  }
};

/**
 * Quick helper to check if everything is set up correctly
 */
export const quickCheck = async (conversationId) => {
  const isValid = await debugConversation(conversationId);

  if (!isValid) {
    console.error('\n⚠️ IMPORTANT: Fix the issues above before trying to send messages!');
  } else {
    console.log('\n✅ Everything looks good! You should be able to send messages.');
  }

  return isValid;
};
