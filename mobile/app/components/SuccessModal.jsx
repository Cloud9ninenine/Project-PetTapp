import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';

/**
 * SuccessModal - Reusable success modal component
 *
 * @param {boolean} visible - Controls modal visibility
 * @param {function} onClose - Callback when modal is closed
 * @param {string} title - Modal title (default: "Success")
 * @param {string} message - Success message
 * @param {string} buttonText - Button text (default: "OK")
 */
export default function SuccessModal({
  visible,
  onClose,
  title = "Success",
  message = "Operation completed successfully!",
  buttonText = "OK",
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Success Icon with animated checkmark */}
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={moderateScale(80)} color="#4CAF50" />
          </View>

          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalText}>{message}</Text>

          <TouchableOpacity
            style={styles.modalButton}
            onPress={onClose}
          >
            <Text style={styles.modalButtonText}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(5),
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(24),
    padding: moderateScale(36),
    width: '90%',
    maxWidth: wp(90),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  iconContainer: {
    marginBottom: hp(2),
  },
  modalTitle: {
    fontSize: scaleFontSize(26),
    fontFamily: "SFProBold",
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: hp(1.5),
    letterSpacing: 0.4,
  },
  modalText: {
    fontSize: scaleFontSize(16),
    fontFamily: "SFProReg",
    color: '#555',
    textAlign: 'center',
    marginBottom: hp(3.5),
    lineHeight: scaleFontSize(24),
    paddingHorizontal: moderateScale(8),
  },
  modalButton: {
    width: '100%',
    backgroundColor: '#4CAF50',
    paddingVertical: hp(1.8),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(18),
    fontFamily: "SFProBold",
    letterSpacing: 0.5,
  },
});
