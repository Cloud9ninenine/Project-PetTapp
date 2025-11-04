import { StyleSheet } from 'react-native';
import { hp, wp, moderateScale, scaleFontSize } from '@utils/responsive';

// Color constants
export const COLORS = {
  primary: '#1C86FF',
  success: '#4CAF50',
  error: '#FF6B6B',
  warning: '#FFC107',
  info: '#1C86FF',
  gray: '#9E9E9E',
  text: {
    primary: '#2C3E50',
    secondary: '#7F8C8D',
    light: '#999',
  },
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayDark: 'rgba(0, 0, 0, 0.75)',
  white: '#fff',
};

// Shared Modal Styles
export const modalStyles = StyleSheet.create({
  // Generic overlay for all modals
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  overlayDark: {
    flex: 1,
    backgroundColor: COLORS.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(5),
  },

  // Bottom sheet modal (for input forms)
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  bottomSheetContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    maxHeight: '70%',
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(20),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  bottomSheetTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  bottomSheetBody: {
    padding: moderateScale(20),
  },

  // Confirmation Modal (with icon and buttons)
  confirmationContainer: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(24),
    padding: moderateScale(32),
    width: '90%',
    maxWidth: wp(90),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  confirmationIconContainer: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2.5),
  },
  confirmationTitle: {
    fontSize: scaleFontSize(24),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: hp(1.5),
    letterSpacing: 0.4,
  },
  confirmationMessage: {
    fontSize: scaleFontSize(15),
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: hp(3),
    lineHeight: scaleFontSize(22),
    paddingHorizontal: moderateScale(8),
  },
  confirmationButtonContainer: {
    flexDirection: 'row',
    gap: moderateScale(12),
    width: '100%',
  },
  confirmationCancelButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: hp(1.6),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(6),
    borderWidth: 2,
    borderColor: COLORS.error,
    backgroundColor: COLORS.white,
  },
  confirmationCancelButtonText: {
    color: COLORS.error,
    fontSize: scaleFontSize(14),
    fontWeight: '600',
  },
  confirmationConfirmButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: hp(1.6),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(6),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmationConfirmButtonText: {
    color: COLORS.white,
    fontSize: scaleFontSize(14),
    fontWeight: '600',
  },
  confirmationButtonDisabled: {
    opacity: 0.6,
  },

  // Success/Alert Modal (auto-dismiss)
  alertContainer: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(28),
    padding: moderateScale(40),
    width: '85%',
    maxWidth: wp(85),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 15,
  },
  alertContainerCompact: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(20),
    padding: moderateScale(28),
    width: '90%',
    maxWidth: moderateScale(380),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  alertIconContainer: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  alertIconContainerCompact: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  alertTitle: {
    fontSize: scaleFontSize(26),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: hp(1),
    letterSpacing: 0.3,
  },
  alertTitleCompact: {
    fontSize: scaleFontSize(22),
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: moderateScale(12),
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: scaleFontSize(15),
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: hp(2.5),
    lineHeight: scaleFontSize(22),
    paddingHorizontal: moderateScale(8),
  },
  alertMessageCompact: {
    fontSize: scaleFontSize(15),
    color: COLORS.text.secondary,
    lineHeight: scaleFontSize(22),
    textAlign: 'center',
    marginBottom: moderateScale(24),
  },
  alertButton: {
    width: '100%',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  alertButtonText: {
    color: COLORS.white,
    fontSize: scaleFontSize(16),
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Input Section (for bottom sheets)
  inputSection: {
    marginBottom: moderateScale(20),
  },
  inputLabel: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(15),
  },
  inputField: {
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: scaleFontSize(15),
    color: '#333',
    minHeight: moderateScale(100),
  },

  // Button Row (for bottom sheets)
  buttonRow: {
    flexDirection: 'row',
    gap: moderateScale(12),
    marginTop: moderateScale(20),
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingVertical: moderateScale(15),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: scaleFontSize(16),
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: moderateScale(15),
    borderRadius: moderateScale(12),
    alignItems: 'center',
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: scaleFontSize(16),
    fontWeight: '600',
  },
});

// Helper function to get background color for alert icons
export const getAlertIconBackground = (type, opacity = 0.2) => {
  const colors = {
    success: COLORS.success,
    error: COLORS.error,
    info: COLORS.info,
    warning: COLORS.warning,
  };
  const color = colors[type] || COLORS.primary;
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};

// Helper function to get icon name based on alert type
export const getAlertIcon = (type) => {
  const icons = {
    success: 'checkmark-circle',
    error: 'close-circle',
    info: 'information-circle',
    warning: 'alert-circle',
  };
  return icons[type] || 'checkmark-circle';
};

// Helper function to get button background color
export const getButtonColor = (type) => {
  const colors = {
    success: COLORS.success,
    error: COLORS.error,
    info: COLORS.info,
    warning: COLORS.warning,
    primary: COLORS.primary,
  };
  return colors[type] || COLORS.primary;
};

export default modalStyles;
