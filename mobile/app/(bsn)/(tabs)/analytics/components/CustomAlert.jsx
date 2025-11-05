import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hp, wp, moderateScale, scaleFontSize } from '@utils/responsive';

const CustomAlert = ({ visible, onClose, title, message, type = 'info', buttons = [] }) => {
  const animatedScale = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(animatedScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      animatedScale.setValue(0);
    }
  }, [visible]);

  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return {
          name: 'checkmark-circle',
          color: '#4CAF50',
          backgroundColor: '#E8F5E9',
        };
      case 'error':
        return {
          name: 'close-circle',
          color: '#F44336',
          backgroundColor: '#FFEBEE',
        };
      case 'warning':
        return {
          name: 'warning',
          color: '#FF9800',
          backgroundColor: '#FFF3E0',
        };
      default:
        return {
          name: 'information-circle',
          color: '#1C86FF',
          backgroundColor: '#E3F2FD',
        };
    }
  };

  const iconConfig = getIconConfig();

  // Default buttons if none provided
  const defaultButtons = [
    {
      text: 'OK',
      onPress: onClose,
      style: 'primary',
    },
  ];

  const alertButtons = buttons.length > 0 ? buttons : defaultButtons;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.alertContainer,
            { transform: [{ scale: animatedScale }] },
          ]}
        >
          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: iconConfig.backgroundColor },
            ]}
          >
            <Ionicons
              name={iconConfig.name}
              size={moderateScale(48)}
              color={iconConfig.color}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {alertButtons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  button.style === 'cancel' && styles.buttonCancel,
                  button.style === 'destructive' && styles.buttonDestructive,
                  alertButtons.length === 1 && styles.buttonFull,
                ]}
                onPress={() => {
                  if (button.onPress) {
                    button.onPress();
                  }
                  // Always close the alert after button press
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.buttonText,
                    button.style === 'cancel' && styles.buttonTextCancel,
                    button.style === 'destructive' && styles.buttonTextDestructive,
                  ]}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  overlayTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  alertContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(20),
    padding: moderateScale(24),
    width: '90%',
    maxWidth: moderateScale(400),
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  iconContainer: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  title: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: moderateScale(8),
    textAlign: 'center',
  },
  message: {
    fontSize: scaleFontSize(15),
    color: '#666',
    textAlign: 'center',
    lineHeight: scaleFontSize(22),
    marginBottom: moderateScale(24),
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: moderateScale(12),
  },
  button: {
    flex: 1,
    backgroundColor: '#1C86FF',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonFull: {
    flex: 1,
  },
  buttonCancel: {
    backgroundColor: '#F0F0F0',
  },
  buttonDestructive: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: '#fff',
  },
  buttonTextCancel: {
    color: '#666',
  },
  buttonTextDestructive: {
    color: '#fff',
  },
});

export default CustomAlert;
