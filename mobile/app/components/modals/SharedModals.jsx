import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale } from '@utils/responsive';
import { modalStyles, COLORS, getAlertIconBackground, getAlertIcon, getButtonColor } from '@styles/modalStyles';

/**
 * Confirmation Modal - Shows a confirmation dialog with icon, title, message, and action buttons
 * @param {boolean} visible - Modal visibility
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 * @param {string} icon - Icon name (Ionicons)
 * @param {string} iconColor - Icon color
 * @param {string} confirmText - Confirm button text
 * @param {string} cancelText - Cancel button text
 * @param {function} onConfirm - Confirm callback
 * @param {function} onCancel - Cancel callback
 * @param {boolean} loading - Loading state for buttons
 */
export const ConfirmationModal = ({
  visible,
  title,
  message,
  icon = 'checkmark-circle',
  iconColor = COLORS.primary,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={modalStyles.overlayDark}>
        <View style={modalStyles.confirmationContainer}>
          {/* Icon Container */}
          <View
            style={[
              modalStyles.confirmationIconContainer,
              { backgroundColor: getAlertIconBackground(iconColor, 0.2) }
            ]}
          >
            <Ionicons
              name={icon}
              size={moderateScale(60)}
              color={iconColor}
            />
          </View>

          {/* Title and Message */}
          <Text
            style={[
              modalStyles.confirmationTitle,
              { color: iconColor }
            ]}
          >
            {title}
          </Text>
          <Text style={modalStyles.confirmationMessage}>
            {message}
          </Text>

          {/* Action Buttons */}
          <View style={modalStyles.confirmationButtonContainer}>
            {/* Cancel Button */}
            <TouchableOpacity
              style={[
                modalStyles.confirmationCancelButton,
                loading && modalStyles.confirmationButtonDisabled
              ]}
              onPress={onCancel}
              disabled={loading}
            >
              <Ionicons
                name="close-circle"
                size={moderateScale(18)}
                color={COLORS.error}
              />
              <Text style={modalStyles.confirmationCancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>

            {/* Confirm Button */}
            <TouchableOpacity
              style={[
                modalStyles.confirmationConfirmButton,
                { backgroundColor: iconColor },
                loading && modalStyles.confirmationButtonDisabled
              ]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle"
                    size={moderateScale(18)}
                    color={COLORS.white}
                  />
                  <Text style={modalStyles.confirmationConfirmButtonText}>
                    {confirmText}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Success/Alert Modal - Shows a success or alert message that auto-dismisses
 * @param {boolean} visible - Modal visibility
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 * @param {string} type - Alert type: 'success', 'error', 'info', 'warning'
 * @param {string} iconColor - Custom icon color (optional)
 * @param {string} icon - Custom icon name (optional)
 */
export const AlertModal = ({
  visible,
  title,
  message,
  type = 'success',
  iconColor,
  icon,
}) => {
  const alertIconColor = iconColor || getButtonColor(type);
  const alertIcon = icon || getAlertIcon(type);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.alertContainer}>
          {/* Icon Container */}
          <View
            style={[
              modalStyles.alertIconContainer,
              { backgroundColor: getAlertIconBackground(type, 0.2) }
            ]}
          >
            <Ionicons
              name={alertIcon}
              size={moderateScale(64)}
              color={alertIconColor}
            />
          </View>

          {/* Title and Message */}
          <Text style={[modalStyles.alertTitle, { color: alertIconColor }]}>
            {title}
          </Text>
          <Text style={modalStyles.alertMessage}>
            {message}
          </Text>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Alert Modal with OK Button - Shows an alert with a button to dismiss
 * @param {boolean} visible - Modal visibility
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 * @param {string} type - Alert type: 'success', 'error', 'info', 'warning'
 * @param {function} onDismiss - Callback when OK is pressed
 */
export const AlertModalWithButton = ({
  visible,
  title,
  message,
  type = 'success',
  onDismiss,
}) => {
  const alertIconColor = getButtonColor(type);
  const alertIcon = getAlertIcon(type);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.alertContainerCompact}>
          {/* Icon */}
          <View style={[
            modalStyles.alertIconContainerCompact,
            { backgroundColor: alertIconColor },
          ]}>
            <Ionicons
              name={alertIcon}
              size={moderateScale(48)}
              color={COLORS.white}
            />
          </View>

          {/* Title */}
          <Text style={modalStyles.alertTitleCompact}>{title}</Text>

          {/* Message */}
          <Text style={modalStyles.alertMessageCompact}>{message}</Text>

          {/* Button */}
          <TouchableOpacity
            style={[
              modalStyles.alertButton,
              { backgroundColor: alertIconColor }
            ]}
            onPress={onDismiss}
          >
            <Text style={modalStyles.alertButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Input Modal (Bottom Sheet) - Shows a modal with input field and buttons
 * @param {boolean} visible - Modal visibility
 * @param {string} title - Modal title
 * @param {string} label - Input label
 * @param {string} placeholder - Input placeholder
 * @param {string} value - Input value
 * @param {function} onChangeText - Input change callback
 * @param {function} onConfirm - Confirm callback
 * @param {function} onCancel - Cancel callback
 * @param {string} confirmText - Confirm button text
 * @param {string} confirmColor - Confirm button color
 * @param {boolean} loading - Loading state
 */
export const InputModal = ({
  visible,
  title,
  label,
  placeholder,
  value,
  onChangeText,
  onConfirm,
  onCancel,
  confirmText = 'Submit',
  confirmColor = COLORS.primary,
  loading = false,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={modalStyles.bottomSheetOverlay}>
        <View style={modalStyles.bottomSheetContent}>
          <View style={modalStyles.bottomSheetHeader}>
            <Text style={modalStyles.bottomSheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onCancel}>
              <Ionicons name="close" size={moderateScale(28)} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={modalStyles.bottomSheetBody}>
            <View style={modalStyles.inputSection}>
              <Text style={modalStyles.inputLabel}>
                {label} <Text style={{ color: COLORS.error }}>*</Text>
              </Text>
              <TextInput
                style={modalStyles.inputField}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={modalStyles.buttonRow}>
              <TouchableOpacity
                style={modalStyles.cancelButton}
                onPress={onCancel}
              >
                <Text style={modalStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  modalStyles.confirmButton,
                  { backgroundColor: confirmColor }
                ]}
                onPress={onConfirm}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={modalStyles.confirmButtonText}>{confirmText}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};
