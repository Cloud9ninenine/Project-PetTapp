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
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from '@config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PaymentQRScreen = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [qrCodes, setQrCodes] = useState([]);
  const [selectedQrIndex, setSelectedQrIndex] = useState(0);
  const [qrNotAvailable, setQrNotAvailable] = useState(false);
  const [businessId, setBusinessId] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');

  const { bookingId, businessName, amount } = params;

  // Hide tab bar on this screen
  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: { display: 'none' }
    });
  }, [navigation]);

  // Get auth token for image requests
  useEffect(() => {
    const getToken = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        setAuthToken(token);
      } catch (error) {
        console.error('Error getting auth token:', error);
      }
    };
    getToken();
  }, []);

  useEffect(() => {
    fetchQRCodes();
  }, [bookingId]);

  const fetchQRCodes = async () => {
    try {
      setLoading(true);
      setQrNotAvailable(false);

      // Step 1: Fetch the booking details to get businessId
      const bookingResponse = await apiClient.get(`/bookings/${bookingId}`);
      console.log('Booking API Response:', JSON.stringify(bookingResponse.data, null, 2));

      if (!bookingResponse.data?.data) {
        throw new Error('Booking information not found');
      }

      const booking = bookingResponse.data.data;
      const fetchedBusinessId = booking.businessId?._id || booking.businessId;

      if (!fetchedBusinessId) {
        throw new Error('Business ID not found in booking');
      }

      setBusinessId(fetchedBusinessId);
      setPaymentStatus(booking.paymentStatus || 'pending');
      console.log('Fetched Business ID:', fetchedBusinessId);
      console.log('Payment Status:', booking.paymentStatus);

      // Step 2: Fetch payment QR codes from the business endpoint
      const qrResponse = await apiClient.get(`/businesses/${fetchedBusinessId}/payment-qr`);
      console.log('QR Codes API Response:', JSON.stringify(qrResponse.data, null, 2));

      if (qrResponse.data?.success && qrResponse.data?.data?.qrCodes) {
        const fetchedQrCodes = qrResponse.data.data.qrCodes;

        if (fetchedQrCodes.length > 0) {
          // Process QR codes to ensure proper URLs
          const processedQrCodes = fetchedQrCodes.map(qr => {
            let imageUrl = qr.imageUrl;

            // Debug: Log original URL
            console.log('Original QR imageUrl:', imageUrl);

            // If it's already a full URL, use it as-is
            if (imageUrl && imageUrl.startsWith('http')) {
              console.log('Using full URL:', imageUrl);
              return {
                ...qr,
                imageUrl: imageUrl
              };
            }

            // If it's a relative path, construct the full URL
            // Remove any leading slashes for consistency
            const cleanPath = imageUrl?.replace(/^\/+/, '') || '';

            // Get base URL without trailing slash
            const baseURL = apiClient.defaults.baseURL?.replace(/\/+$/, '') || '';

            // Construct full URL
            const fullUrl = `${baseURL}/${cleanPath}`;
            console.log('Constructed full URL:', fullUrl);

            return {
              ...qr,
              imageUrl: fullUrl
            };
          });

          setQrCodes(processedQrCodes);
          setSelectedQrIndex(0);
          console.log('Final Processed QR Codes:', processedQrCodes);
        } else {
          // No QR codes available
          setQrNotAvailable(true);
          setQrCodes([]);
        }
      } else {
        // Business hasn't uploaded QR codes yet
        setQrNotAvailable(true);
        setQrCodes([]);
      }
    } catch (error) {
      console.error('Error fetching QR codes:', error);
      setQrNotAvailable(true);
      setQrCodes([]);
      Alert.alert(
        'Error',
        'Failed to load payment QR codes. Please try again or contact the business.'
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

  const getPaymentStatusLabel = (status) => {
    const labels = {
      'pending': 'Awaiting payment',
      'proof-uploaded': 'Proof uploaded',
      'paid': 'Payment verified',
      'failed': 'Payment rejected',
      'refunded': 'Refunded'
    };
    return labels[status] || 'Unknown';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      'pending': '#FF9B79',      // Orange - awaiting action
      'proof-uploaded': '#FFC107', // Amber - under review
      'paid': '#4CAF50',         // Green - success
      'failed': '#FF5252',       // Red - rejected
      'refunded': '#2196F3'      // Blue - refunded
    };
    return colors[status] || '#9E9E9E'; // Gray - unknown
  };

  const getPaymentTypeLabel = (type) => {
    const labels = {
      gcash: 'GCash',
      paymaya: 'PayMaya',
      bank: 'Bank Transfer',
      other: 'Other'
    };
    return labels[type] || type;
  };

  const getPaymentTypeColor = (type) => {
    const colors = {
      gcash: '#007DFF',
      paymaya: '#00B140',
      bank: '#FF6B35',
      other: '#6C757D'
    };
    return colors[type] || '#6C757D';
  };

  const renderQrCodeTabs = () => {
    if (qrCodes.length <= 1) return null;

    return (
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {qrCodes.map((qr, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.tab,
                selectedQrIndex === index && styles.tabActive
              ]}
              onPress={() => setSelectedQrIndex(index)}
            >
              <Text style={[
                styles.tabText,
                selectedQrIndex === index && styles.tabTextActive
              ]}>
                {getPaymentTypeLabel(qr.type)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderQrCodeDetails = () => {
    if (qrCodes.length === 0) return null;

    const currentQr = qrCodes[selectedQrIndex];

    return (
      <View style={styles.qrDetailsContainer}>
        <View style={[
          styles.paymentTypeBadge,
          { backgroundColor: getPaymentTypeColor(currentQr.type) + '20' }
        ]}>
          <Text style={[
            styles.paymentTypeText,
            { color: getPaymentTypeColor(currentQr.type) }
          ]}>
            {getPaymentTypeLabel(currentQr.type)}
          </Text>
        </View>

        {currentQr.accountName && (
          <View style={styles.qrDetailRow}>
            <Ionicons name="person-outline" size={moderateScale(16)} color="#666" />
            <Text style={styles.qrDetailLabel}>Account Name:</Text>
            <Text style={styles.qrDetailValue}>{currentQr.accountName}</Text>
          </View>
        )}

        {currentQr.accountNumber && (
          <View style={styles.qrDetailRow}>
            <Ionicons name="card-outline" size={moderateScale(16)} color="#666" />
            <Text style={styles.qrDetailLabel}>Account Number:</Text>
            <Text style={styles.qrDetailValue}>{currentQr.accountNumber}</Text>
          </View>
        )}
      </View>
    );
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
        {/* Note */}
        <View style={styles.noteCard}>
          <Ionicons name="alert-circle-outline" size={moderateScale(20)} color="#FF9B79" />
          <Text style={styles.noteText}>
            Please upload your payment proof after completing the transaction to verify your booking.
          </Text>
        </View>

        {/* Payment Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Business</Text>
            <Text style={styles.infoValue}>{businessName || 'N/A'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Status</Text>
            <View style={[
              styles.paymentStatusBadge,
              { backgroundColor: getPaymentStatusColor(paymentStatus) + '20' }
            ]}>
              <Text style={[
                styles.paymentStatusText,
                { color: getPaymentStatusColor(paymentStatus) }
              ]}>
                {getPaymentStatusLabel(paymentStatus)}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Amount to Pay</Text>
            <Text style={styles.amountValue}>{formatAmount(amount)}</Text>
          </View>
        </View>

        {/* QR Code Tabs */}
        {renderQrCodeTabs()}

        {/* QR Code Display */}
        <View style={styles.qrContainer}>
          <Text style={styles.qrTitle}>Scan to Pay</Text>
          <Text style={styles.qrSubtitle}>Use your preferred payment app to scan the QR code</Text>

          {loading ? (
            <View style={styles.qrPlaceholder}>
              <ActivityIndicator size="large" color="#1C86FF" />
              <Text style={styles.loadingText}>Loading QR Code...</Text>
            </View>
          ) : qrCodes.length > 0 ? (
            <>
              <View style={styles.qrCodeWrapper}>
                <Image
                  source={{
                    uri: qrCodes[selectedQrIndex].imageUrl,
                    headers: authToken ? {
                      'Authorization': `Bearer ${authToken}`
                    } : undefined
                  }}
                  style={styles.qrCode}
                  resizeMode="contain"
                  onError={(error) => {
                    console.error('Image loading error:', error.nativeEvent.error);
                    console.error('Failed to load QR image URL:', qrCodes[selectedQrIndex].imageUrl);
                    console.error('Auth token present:', !!authToken);
                  }}
                  onLoad={() => {
                    console.log('QR image loaded successfully:', qrCodes[selectedQrIndex].imageUrl);
                  }}
                />
              </View>
              {renderQrCodeDetails()}
            </>
          ) : qrNotAvailable ? (
            <View style={styles.qrPlaceholder}>
              <Ionicons name="alert-circle-outline" size={moderateScale(80)} color="#FF9B79" />
              <Text style={styles.notAvailableText}>QR Code Not Available</Text>
              <Text style={styles.notAvailableSubtext}>
                The business hasn't uploaded their payment QR code yet. Please try again later or change to CASH payment.
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchQRCodes}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.qrPlaceholder}>
              <Ionicons name="qr-code-outline" size={moderateScale(80)} color="#ccc" />
              <Text style={styles.errorText}>Failed to load QR code</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchQRCodes}>
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
                <Text style={styles.stepText}>Open your payment app (GCash, PayMaya, or bank app)</Text>
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
                <Text style={styles.stepText}>Confirm the payment amount matches: {formatAmount(amount)}</Text>
              </View>

              <View style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>5</Text>
                </View>
                <Text style={styles.stepText}>Complete the payment in your app</Text>
              </View>

              <View style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>6</Text>
                </View>
                <Text style={styles.stepText}>Take a screenshot of the payment confirmation</Text>
              </View>

              <View style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>7</Text>
                </View>
                <Text style={styles.stepText}>Upload the screenshot as payment proof below</Text>
              </View>
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
  paymentStatusBadge: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(20),
    alignSelf: 'flex-end',
  },
  paymentStatusText: {
    fontSize: scaleFontSize(12),
    fontWeight: '700',
    textAlign: 'center',
  },
  tabsContainer: {
    marginBottom: hp(2),
  },
  tabsScrollContent: {
    paddingHorizontal: wp(2),
  },
  tab: {
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
    marginHorizontal: moderateScale(4),
    borderRadius: moderateScale(20),
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tabActive: {
    backgroundColor: '#1C86FF',
    borderColor: '#1C86FF',
  },
  tabText: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
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
    marginBottom: moderateScale(16),
  },
  qrCode: {
    width: moderateScale(250),
    height: moderateScale(250),
  },
  qrDetailsContainer: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
  },
  paymentTypeBadge: {
    alignSelf: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
    marginBottom: moderateScale(12),
  },
  paymentTypeText: {
    fontSize: scaleFontSize(14),
    fontWeight: '700',
    textAlign: 'center',
  },
  qrDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  qrDetailLabel: {
    fontSize: scaleFontSize(13),
    color: '#666',
    fontWeight: '500',
    marginLeft: moderateScale(8),
  },
  qrDetailValue: {
    fontSize: scaleFontSize(13),
    color: '#333',
    fontWeight: '600',
    marginLeft: moderateScale(8),
    flex: 1,
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
    marginBottom: hp(2),
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
