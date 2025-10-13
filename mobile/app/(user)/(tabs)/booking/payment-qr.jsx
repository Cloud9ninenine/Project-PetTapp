import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from '@config/api';

const PaymentQRScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [qrNotAvailable, setQrNotAvailable] = useState(false);

  const { bookingId, businessName, amount } = params;

  useEffect(() => {
    // Fetch QR code from business
    fetchQRCode();
  }, [bookingId]);

  const fetchQRCode = async () => {
    try {
      setLoading(true);
      setQrNotAvailable(false);

      // Fetch the booking details to get business QR code
      const response = await apiClient.get(`/bookings/${bookingId}`);

      if (response.data && response.data.businessId) {
        const business = response.data.businessId;

        // Check if business has uploaded QR code
        if (business.paymentQRCode) {
          // If it's a full URL, use it directly
          if (business.paymentQRCode.startsWith('http')) {
            setQrCodeUrl(business.paymentQRCode);
          } else {
            // Otherwise, construct the URL (adjust base URL as needed)
            setQrCodeUrl(`${apiClient.defaults.baseURL}/uploads/${business.paymentQRCode}`);
          }
        } else {
          // Business hasn't uploaded QR code yet
          setQrNotAvailable(true);
          setQrCodeUrl(null);
        }
      } else {
        throw new Error('Business information not found');
      }
    } catch (error) {
      console.error('Error fetching QR code:', error);
      setQrNotAvailable(true);
      Alert.alert(
        'Error',
        'Failed to load payment QR code. Please try again or contact the business.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProof = () => {
    router.push({
      pathname: '../booking/upload-payment-proof',
      params: {
        bookingId,
      },
    });
  };

  const formatAmount = (amt) => {
    if (!amt) return '₱0.00';
    const numAmount = typeof amt === 'string' ? parseFloat(amt) : amt;
    return `₱${numAmount.toFixed(2)}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={moderateScale(24)} color="#1C86FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment QR Code</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Payment Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Business</Text>
            <Text style={styles.infoValue}>{businessName || 'N/A'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Booking ID</Text>
            <Text style={styles.infoValueSmall}>{bookingId?.slice(-8) || 'N/A'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Amount to Pay</Text>
            <Text style={styles.amountValue}>{formatAmount(amount)}</Text>
          </View>
        </View>

        {/* QR Code Display */}
        <View style={styles.qrContainer}>
          <Text style={styles.qrTitle}>Scan to Pay</Text>
          <Text style={styles.qrSubtitle}>Use GCash, PayMaya, or any QR payment app</Text>

          {loading ? (
            <View style={styles.qrPlaceholder}>
              <ActivityIndicator size="large" color="#1C86FF" />
              <Text style={styles.loadingText}>Loading QR Code...</Text>
            </View>
          ) : qrCodeUrl ? (
            <View style={styles.qrCodeWrapper}>
              <Image
                source={{ uri: qrCodeUrl }}
                style={styles.qrCode}
                resizeMode="contain"
              />
            </View>
          ) : qrNotAvailable ? (
            <View style={styles.qrPlaceholder}>
              <Ionicons name="alert-circle-outline" size={moderateScale(80)} color="#FF9B79" />
              <Text style={styles.notAvailableText}>QR Code Not Available</Text>
              <Text style={styles.notAvailableSubtext}>
                The business hasn't uploaded their payment QR code yet. Please contact them or try again later.
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchQRCode}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.qrPlaceholder}>
              <Ionicons name="qr-code-outline" size={moderateScale(80)} color="#ccc" />
              <Text style={styles.errorText}>Failed to load QR code</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchQRCode}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <View style={styles.instructionHeader}>
            <Ionicons name="information-circle" size={moderateScale(24)} color="#1C86FF" />
            <Text style={styles.instructionsTitle}>How to Pay</Text>
          </View>

          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>Open your GCash, PayMaya, or bank app</Text>
          </View>

          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>Select "Scan QR" or "QR Payment"</Text>
          </View>

          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>Scan the QR code above</Text>
          </View>

          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <Text style={styles.stepText}>Confirm the payment in your app</Text>
          </View>

          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>5</Text>
            </View>
            <Text style={styles.stepText}>Take a screenshot of the payment confirmation</Text>
          </View>

          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>6</Text>
            </View>
            <Text style={styles.stepText}>Upload the screenshot as payment proof</Text>
          </View>
        </View>

        {/* Note */}
        <View style={styles.noteCard}>
          <Ionicons name="alert-circle-outline" size={moderateScale(20)} color="#FF9B79" />
          <Text style={styles.noteText}>
            Please upload your payment proof after completing the transaction to verify your booking.
          </Text>
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.uploadButton} onPress={handleUploadProof}>
          <Ionicons name="cloud-upload-outline" size={moderateScale(24)} color="#fff" />
          <Text style={styles.uploadButtonText}>Upload Payment Proof</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingTop: hp(6),
    paddingBottom: hp(2),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: moderateScale(8),
  },
  headerTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: '600',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: wp(4),
    paddingBottom: hp(10),
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(8),
  },
  infoLabel: {
    fontSize: scaleFontSize(14),
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: scaleFontSize(14),
    color: '#333',
    fontWeight: '600',
  },
  infoValueSmall: {
    fontSize: scaleFontSize(12),
    color: '#333',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  amountValue: {
    fontSize: scaleFontSize(20),
    color: '#1C86FF',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: moderateScale(4),
  },
  qrContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(20),
    marginBottom: hp(2),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: '700',
    color: '#333',
    marginBottom: moderateScale(4),
  },
  qrSubtitle: {
    fontSize: scaleFontSize(13),
    color: '#666',
    marginBottom: moderateScale(20),
    textAlign: 'center',
  },
  qrCodeWrapper: {
    backgroundColor: '#fff',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    borderWidth: 2,
    borderColor: '#1C86FF',
  },
  qrCode: {
    width: moderateScale(250),
    height: moderateScale(250),
  },
  qrPlaceholder: {
    width: moderateScale(250),
    height: moderateScale(250),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
  },
  loadingText: {
    marginTop: moderateScale(12),
    fontSize: scaleFontSize(14),
    color: '#666',
  },
  notAvailableText: {
    marginTop: moderateScale(12),
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: '#FF9B79',
    textAlign: 'center',
  },
  notAvailableSubtext: {
    marginTop: moderateScale(8),
    fontSize: scaleFontSize(13),
    color: '#666',
    textAlign: 'center',
    lineHeight: scaleFontSize(18),
    paddingHorizontal: moderateScale(12),
  },
  errorText: {
    marginTop: moderateScale(12),
    fontSize: scaleFontSize(14),
    color: '#999',
  },
  retryButton: {
    marginTop: moderateScale(12),
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(8),
    backgroundColor: '#1C86FF',
    borderRadius: moderateScale(8),
  },
  retryButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(14),
    fontWeight: '600',
  },
  instructionsCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  instructionsTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: '700',
    color: '#333',
    marginLeft: moderateScale(8),
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: moderateScale(12),
  },
  stepNumber: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: '#1C86FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  stepNumberText: {
    color: '#fff',
    fontSize: scaleFontSize(12),
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: scaleFontSize(14),
    color: '#666',
    lineHeight: scaleFontSize(20),
    marginTop: moderateScale(2),
  },
  noteCard: {
    backgroundColor: '#FFF4E6',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9B79',
  },
  noteText: {
    flex: 1,
    fontSize: scaleFontSize(13),
    color: '#666',
    lineHeight: scaleFontSize(18),
    marginLeft: moderateScale(12),
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: wp(4),
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  uploadButton: {
    backgroundColor: '#1C86FF',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(14),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1C86FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: '700',
    marginLeft: moderateScale(8),
  },
});

export default PaymentQRScreen;
