import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';

/**
 * CompleteProfileModal - Reusable modal component that prompts users to complete their profile
 *
 * @param {boolean} visible - Controls modal visibility
 * @param {function} onClose - Callback when modal is closed
 * @param {string} title - Modal title (default: "Complete Your Profile")
 * @param {string} message - Modal message (default: profile completion message)
 * @param {string} buttonText - Button text (default: "Go to Profile")
 */
export default function CompleteProfileModal({
  visible,
  onClose,
  title = "Complete Your Profile",
  message = "Please complete your profile information before continuing. You need to provide your first name, last name, contact number, and a complete address (street and city).",
  buttonText = "Go to Profile",
}) {
  const router = useRouter();

  const handleGoToProfile = () => {
    if (onClose) onClose();
    router.push("/(user)/(tabs)/profile");
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Ionicons name="alert-circle" size={60} color="#FF9B79" style={styles.modalIcon} />
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalText}>{message}</Text>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={handleGoToProfile}
          >
            <Text style={styles.modalButtonText}>{buttonText}</Text>
          </TouchableOpacity>
          {onClose && (
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={onClose}
            >
              <Text style={styles.dismissButtonText}>Dismiss</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(5),
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(30),
    width: '90%',
    maxWidth: wp(90),
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: hp(2),
  },
  modalTitle: {
    fontSize: scaleFontSize(22),
    fontFamily: "SFProBold",
    color: '#1C86FF',
    textAlign: 'center',
    marginBottom: hp(1.5),
  },
  modalText: {
    fontSize: scaleFontSize(16),
    fontFamily: "SFProReg",
    color: '#666',
    textAlign: 'center',
    marginBottom: hp(3),
    lineHeight: scaleFontSize(22),
  },
  modalButton: {
    width: '100%',
    backgroundColor: '#1C86FF',
    paddingVertical: hp(1.5),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    marginBottom: hp(1),
  },
  modalButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(18),
    fontFamily: "SFProSB",
  },
  dismissButton: {
    width: '100%',
    paddingVertical: hp(1.5),
    alignItems: 'center',
  },
  dismissButtonText: {
    color: '#999',
    fontSize: scaleFontSize(16),
    fontFamily: "SFProReg",
  },
});
