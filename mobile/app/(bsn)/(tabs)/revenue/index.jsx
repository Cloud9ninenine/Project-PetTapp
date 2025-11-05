import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import Header from "@components/Header";
import { hp, wp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from "@config/api";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RevenueScreen() {
  const params = useLocalSearchParams();
  const [selectedPeriod, setSelectedPeriod] = useState(params.filter || "month");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revenueData, setRevenueData] = useState(null);

  // Calculate date range based on selected period
  const getDateRange = () => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // Include future bookings
    const startDate = new Date();

    switch (selectedPeriod) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'all':
      default:
        return { startDate: undefined, endDate: undefined };
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
  };

  // Fetch revenue data from API
  const fetchRevenueData = async () => {
    try {
      const { startDate, endDate } = getDateRange();

      const response = await apiClient.get('/revenue', {
        params: {
          startDate,
          endDate
        }
      });

      if (response.data && response.data.success) {
        setRevenueData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      Alert.alert('Error', 'Failed to load revenue data');
    }
  };

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      await fetchRevenueData();
    } catch (error) {
      console.error('Error loading revenue data:', error);
      Alert.alert('Error', 'Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Quiet refresh data without loading indicators
  const quietRefresh = async () => {
    try {
      await fetchRevenueData();
    } catch (error) {
      console.error('Error during quiet refresh:', error);
    }
  };

  // Load data on mount and when period changes
  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  // Quiet refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      quietRefresh();
    }, [selectedPeriod])
  );

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText} numberOfLines={1}>
        Revenue
      </Text>
    </View>
  );

  // Helper functions
  const formatCurrency = (amount) => {
    return `₱${(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPaymentMethodIcon = (method) => {
    const iconMap = {
      cash: 'cash-outline',
      gcash: 'phone-portrait-outline',
      card: 'card-outline',
      bank: 'business-outline',
    };
    return iconMap[method?.toLowerCase()] || 'wallet-outline';
  };

  const calculateGrowth = () => {
    if (!revenueData?.monthlyData || revenueData.monthlyData.length < 2) return null;

    const currentMonth = revenueData.monthlyData[revenueData.monthlyData.length - 1]?.revenue || 0;
    const previousMonth = revenueData.monthlyData[revenueData.monthlyData.length - 2]?.revenue || 0;

    if (previousMonth === 0) return null;

    const growth = ((currentMonth - previousMonth) / previousMonth) * 100;
    return growth;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ImageBackground
          source={require("@assets/images/PetTapp pattern.png")}
          style={styles.backgroundimg}
          imageStyle={styles.backgroundImageStyle}
          resizeMode="repeat"
        />
        <Header
          backgroundColor="#1C86FF"
          titleColor="#fff"
          customTitle={renderTitle()}
          showBack={true}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1C86FF" />
          <Text style={styles.loadingText}>Loading revenue data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const growth = calculateGrowth();
  const currentMonthRevenue = revenueData?.monthlyData?.[revenueData.monthlyData.length - 1]?.revenue || 0;

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("@assets/images/PetTapp pattern.png")}
        style={styles.backgroundimg}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="repeat"
      />
      <Header
        backgroundColor="#1C86FF"
        titleColor="#fff"
        customTitle={renderTitle()}
        showBack={true}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Revenue Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <View>
              <Text style={styles.overviewLabel}>Total Revenue</Text>
              <Text style={styles.overviewValue}>{formatCurrency(revenueData?.totalRevenue || 0)}</Text>
              <Text style={styles.overviewSubtext}>
                {revenueData?.paidBookings || 0} paid bookings
              </Text>
            </View>
            {growth !== null && (
              <View style={styles.growthBadge}>
                <Ionicons name="trending-up" size={moderateScale(16)} color="#4CAF50" />
                <Text style={styles.growthText}>
                  {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                </Text>
              </View>
            )}
          </View>

          {/* Period Selector */}
          <View style={styles.periodSelector}>
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'Week' },
              { id: 'month', label: 'Month' },
              { id: 'year', label: 'Year' },
            ].map((period) => (
              <TouchableOpacity
                key={period.id}
                style={[
                  styles.periodButton,
                  selectedPeriod === period.id && styles.periodButtonActive
                ]}
                onPress={() => setSelectedPeriod(period.id)}
              >
                <Text style={[
                  styles.periodButtonText,
                  selectedPeriod === period.id && styles.periodButtonTextActive
                ]}>
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary Stats Row */}
        <View style={styles.summaryCardsRow}>
          <View style={styles.summaryCardSmall}>
            <Ionicons name="trending-up-outline" size={moderateScale(24)} color="#4CAF50" />
            <Text style={styles.summaryCardLabelSmall}>Current Period</Text>
            <Text style={styles.summaryCardValueSmall}>{formatCurrency(currentMonthRevenue)}</Text>
          </View>

          <View style={styles.summaryCardSmall}>
            <Ionicons name="hourglass-outline" size={moderateScale(24)} color="#FF9B79" />
            <Text style={styles.summaryCardLabelSmall}>Pending Payment</Text>
            <Text style={styles.summaryCardValueSmall}>{formatCurrency(revenueData?.pendingRevenue || 0)}</Text>
            <Text style={styles.pendingBookingsText}>
              {revenueData?.pendingBookings || 0} bookings
            </Text>
          </View>
        </View>

        {/* Payment Method Breakdown */}
        {revenueData?.paymentMethodBreakdown && Object.keys(revenueData.paymentMethodBreakdown).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Methods</Text>
            <View style={styles.paymentMethodGrid}>
              {Object.entries(revenueData.paymentMethodBreakdown).map(([method, data]) => (
                <View key={method} style={styles.paymentMethodCard}>
                  <View style={styles.paymentMethodIconContainer}>
                    <Ionicons
                      name={getPaymentMethodIcon(method)}
                      size={moderateScale(28)}
                      color="#1C86FF"
                    />
                  </View>
                  <Text style={styles.paymentMethodName}>
                    {method.charAt(0).toUpperCase() + method.slice(1)}
                  </Text>
                  <Text style={styles.paymentMethodAmount}>{formatCurrency(data.total)}</Text>
                  <Text style={styles.paymentMethodCount}>{data.count} transactions</Text>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${((data.total / revenueData.totalRevenue) * 100).toFixed(0)}%`,
                          backgroundColor: '#1C86FF'
                        }
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {revenueData?.transactions && revenueData.transactions.length > 0 ? (
            revenueData.transactions.slice(0, 10).map((transaction, index) => (
              <View key={transaction._id || index} style={styles.transactionCard}>
                <View style={styles.transactionIcon}>
                  <Ionicons
                    name={getPaymentMethodIcon(transaction.paymentMethod)}
                    size={moderateScale(28)}
                    color="#1C86FF"
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionCustomer} numberOfLines={1}>
                    {transaction.petOwner?.firstName} {transaction.petOwner?.lastName}
                  </Text>
                  <Text style={styles.transactionService} numberOfLines={1}>
                    {transaction.service?.name || 'Service'}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {formatDate(transaction.appointmentDateTime)}
                  </Text>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={styles.transactionAmount}>
                    {formatCurrency(transaction.totalAmount?.amount || 0)}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    transaction.paymentStatus === 'paid' ? styles.statusBadgePaid : styles.statusBadgePending
                  ]}>
                    <Text style={styles.statusBadgeText}>
                      {transaction.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={moderateScale(48)} color="#C7C7CC" />
              <Text style={styles.emptyStateText}>No transactions yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  backgroundimg: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.5 }],
  },
  backgroundImageStyle: {
    opacity: 0.05,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(40),
  },
  loadingText: {
    marginTop: moderateScale(12),
    fontSize: scaleFontSize(14),
    color: '#666',
    fontFamily: 'SFProReg',
  },
  titleContainer: {
    flex: 1,
  },
  titleText: {
    color: '#fff',
    fontSize: scaleFontSize(24),
    fontFamily: 'SFProBold',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(20),
    paddingBottom: moderateScale(100),
  },
  overviewCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    marginBottom: moderateScale(16),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(20),
  },
  overviewLabel: {
    fontSize: scaleFontSize(14),
    color: '#666',
    marginBottom: moderateScale(4),
  },
  overviewValue: {
    fontSize: scaleFontSize(32),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(4),
  },
  overviewSubtext: {
    fontSize: scaleFontSize(12),
    color: '#999',
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(12),
    gap: moderateScale(4),
  },
  growthText: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#4CAF50',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(10),
    padding: moderateScale(4),
  },
  periodButton: {
    flex: 1,
    paddingVertical: moderateScale(10),
    alignItems: 'center',
    borderRadius: moderateScale(8),
  },
  periodButtonActive: {
    backgroundColor: '#1C86FF',
  },
  periodButtonText: {
    fontSize: scaleFontSize(13),
    color: '#666',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  summaryCardsRow: {
    flexDirection: 'row',
    gap: moderateScale(12),
    marginBottom: moderateScale(20),
  },
  summaryCardSmall: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  summaryCardLabelSmall: {
    fontSize: scaleFontSize(12),
    color: '#666',
    marginTop: moderateScale(8),
    fontWeight: '500',
  },
  summaryCardValueSmall: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#333',
    marginTop: moderateScale(4),
  },
  pendingBookingsText: {
    fontSize: scaleFontSize(11),
    color: '#999',
    marginTop: moderateScale(2),
  },
  section: {
    marginBottom: moderateScale(20),
  },
  sectionTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(15),
  },
  paymentMethodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(12),
  },
  paymentMethodCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  paymentMethodIconContainer: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  paymentMethodName: {
    fontSize: scaleFontSize(13),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(4),
  },
  paymentMethodAmount: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(2),
  },
  paymentMethodCount: {
    fontSize: scaleFontSize(11),
    color: '#999',
    marginBottom: moderateScale(8),
  },
  progressBarContainer: {
    height: moderateScale(6),
    backgroundColor: '#E0E0E0',
    borderRadius: moderateScale(3),
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: moderateScale(3),
  },
  transactionCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    marginBottom: moderateScale(12),
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  transactionIcon: {
    marginRight: moderateScale(12),
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCustomer: {
    fontSize: scaleFontSize(15),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(4),
  },
  transactionService: {
    fontSize: scaleFontSize(13),
    color: '#666',
    marginBottom: moderateScale(2),
  },
  transactionDate: {
    fontSize: scaleFontSize(12),
    color: '#999',
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: moderateScale(6),
  },
  transactionAmount: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statusBadge: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(10),
  },
  statusBadgePaid: {
    backgroundColor: '#E8F5E9',
  },
  statusBadgePending: {
    backgroundColor: '#FFF3E0',
  },
  statusBadgeText: {
    fontSize: scaleFontSize(10),
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(40),
    paddingHorizontal: moderateScale(20),
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
  },
  emptyStateText: {
    marginTop: moderateScale(12),
    fontSize: scaleFontSize(14),
    color: '#999',
    textAlign: 'center',
    fontFamily: 'SFProReg',
  },
});
