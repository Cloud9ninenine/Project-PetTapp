import { Dimensions, Platform, PixelRatio } from 'react-native';

// Get device dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Guideline sizes are based on standard iPhone screen
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * Convert width percentage to independent pixels
 * @param {number} widthPercent - percentage of screen width
 * @returns {number} - calculated width in pixels
 */
export const wp = (widthPercent) => {
  const elemWidth = typeof widthPercent === 'number' ? widthPercent : parseFloat(widthPercent);
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * elemWidth) / 100);
};

/**
 * Convert height percentage to independent pixels
 * @param {number} heightPercent - percentage of screen height
 * @returns {number} - calculated height in pixels
 */
export const hp = (heightPercent) => {
  const elemHeight = typeof heightPercent === 'number' ? heightPercent : parseFloat(heightPercent);
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * elemHeight) / 100);
};

/**
 * Scale size based on screen width
 * @param {number} size - base size
 * @returns {number} - scaled size
 */
export const widthScale = (size) => {
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH / guidelineBaseWidth) * size);
};

/**
 * Scale size based on screen height
 * @param {number} size - base size
 * @returns {number} - scaled size
 */
export const heightScale = (size) => {
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT / guidelineBaseHeight) * size);
};

/**
 * Moderate scale - less aggressive scaling
 * @param {number} size - base size
 * @param {number} factor - scaling factor (default 0.5)
 * @returns {number} - moderately scaled size
 */
export const moderateScale = (size, factor = 0.5) => {
  return PixelRatio.roundToNearestPixel(size + (widthScale(size) - size) * factor);
};

/**
 * Scale font size responsively
 * @param {number} size - base font size
 * @returns {number} - scaled font size
 */
export const scaleFontSize = (size) => {
  return moderateScale(size, 0.3);
};

/**
 * Check if device is a small screen (iPhone SE, etc.)
 * @returns {boolean}
 */
export const isSmallDevice = () => {
  return SCREEN_WIDTH < 375 || SCREEN_HEIGHT < 667;
};

/**
 * Check if device is a tablet
 * @returns {boolean}
 */
export const isTablet = () => {
  const aspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;
  return (
    (Platform.OS === 'ios' && Platform.isPad) ||
    (SCREEN_WIDTH >= 768 && aspectRatio < 1.6)
  );
};

/**
 * Get device size category
 * @returns {string} - 'small', 'medium', 'large', or 'tablet'
 */
export const getDeviceSize = () => {
  if (isTablet()) return 'tablet';
  if (isSmallDevice()) return 'small';
  if (SCREEN_WIDTH >= 428) return 'large';
  return 'medium';
};

/**
 * Get responsive padding based on device size
 * @param {number} basePadding - base padding value
 * @returns {number} - responsive padding
 */
export const getResponsivePadding = (basePadding) => {
  const deviceSize = getDeviceSize();
  switch (deviceSize) {
    case 'small':
      return basePadding * 0.8;
    case 'large':
      return basePadding * 1.1;
    case 'tablet':
      return basePadding * 1.5;
    default:
      return basePadding;
  }
};

// Export dimensions for convenience
export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;
