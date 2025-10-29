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
import { useFocusEffect } from "expo-router";
import Header from "@components/Header";
import { hp, wp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from "@config/api";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RevenueScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revenueData, setRevenueData] = useState(null);

  // Calculate date range based on selected period
  const getDateRange = () => {
    // For "all" period, return undefined to fetch all data
    if (selectedPeriod === 'all') {
      return {
        startDate: undefined,
        endDate: undefined
      };
    }

    const endDate = new Date();
    // Extend end date to 30 days in the future to include future bookings
    endDate.setDate(endDate.getDate() + 30);

    const startDate = new Date();

    if (selectedPeriod === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (selectedPeriod === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (selectedPeriod === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
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

  // Load data on mount and when screen is focused
  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  useFocusEffect(
    useCallback(() => {
      loadData();
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
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
          showBack={false}
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
  const previousMonthRevenue = revenueData?.monthlyData?.[revenueData.monthlyData.length - 2]?.revenue || 0;

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
        showBack={false}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === "all" && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod("all")}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === "all" && styles.periodButtonTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === "week" && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod("week")}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === "week" && styles.periodButtonTextActive,
              ]}
            >
              Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === "month" && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod("month")}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === "month" && styles.periodButtonTextActive,
              ]}
            >
              Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === "year" && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod("year")}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === "year" && styles.periodButtonTextActive,
              ]}
            >
              Year
            </Text>
          </TouchableOpacity>
        </View>

        {/* Revenue Summary Cards */}
        <View style={styles.summaryCardsContainer}>
          <View style={[styles.summaryCard, styles.totalRevenueCard]}>
            <Ionicons name="cash-outline" size={moderateScale(32)} color="#fff" />
            <Text style={styles.summaryCardLabel}>Total Revenue (Paid)</Text>
            <Text style={styles.summaryCardValue}>{formatCurrency(revenueData?.totalRevenue || 0)}</Text>
            <Text style={styles.summaryCardSubtext}>
              {revenueData?.paidBookings || 0} paid bookings
            </Text>
          </View>

          <View style={styles.summaryCardsRow}>
            <View style={styles.summaryCardSmall}>
              <Ionicons name="trending-up-outline" size={moderateScale(24)} color="#4CAF50" />
              <Text style={styles.summaryCardLabelSmall}>Current Period</Text>
              <Text style={styles.summaryCardValueSmall}>{formatCurrency(currentMonthRevenue)}</Text>
              {growth !== null && (
                <Text style={[
                  styles.growthBadge,
                  { color: growth >= 0 ? '#4CAF50' : '#FF6B6B' }
                ]}>
                  {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                </Text>
              )}
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
        </View>

        {/* Payment Method Breakdown */}
        {revenueData?.paymentMethodBreakdown && Object.keys(revenueData.paymentMethodBreakdown).length > 0 && (
          <View style={styles.paymentMethodSection}>
            <Text style={styles.sectionTitle}>Payment Methods</Text>
            <View style={styles.paymentMethodGrid}>
              {Object.entries(revenueData.paymentMethodBreakdown).map(([method, data]) => (
                <View key={method} style={styles.paymentMethodCard}>
                  <Ionicons
                    name={getPaymentMethodIcon(method)}
                    size={moderateScale(24)}
                    color="#1C86FF"
                  />
                  <Text style={styles.paymentMethodName}>
                    {method.charAt(0).toUpperCase() + method.slice(1)}
                  </Text>
                  <Text style={styles.paymentMethodAmount}>{formatCurrency(data.total)}</Text>
                  <Text style={styles.paymentMethodCount}>{data.count} transactions</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
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
                    transaction.paymentStatus === 'paid' && styles.statusBadgePaid
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
    backgroundColor: "#FFFFFF",
  },
  backgroundimg: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.5 }],
  },
  backgroundImageStyle: {
    opacity: 0.1,
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
  },
  periodSelector: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: moderateScale(12),
    padding: moderateScale(4),
    marginBottom: moderateScale(20),
  },
  periodButton: {
    flex: 1,
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(8),
    alignItems: "center",
  },
  periodButtonActive: {
    backgroundColor: "#1C86FF",
  },
  periodButtonText: {
    fontSize: scaleFontSize(14),
    fontWeight: "600",
    color: "#666",
  },
  periodButtonTextActive: {
    color: "#fff",
  },
  summaryCardsContainer: {
    marginBottom: moderateScale(24),
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    marginBottom: moderateScale(12),
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  totalRevenueCard: {
    backgroundColor: "#1C86FF",
    borderColor: "#1C86FF",
  },
  summaryCardLabel: {
    fontSize: scaleFontSize(14),
    color: "#fff",
    marginTop: moderateScale(8),
    fontWeight: "500",
  },
  summaryCardValue: {
    fontSize: scaleFontSize(32),
    fontWeight: "bold",
    color: "#fff",
    marginTop: moderateScale(4),
  },
  summaryCardSubtext: {
    fontSize: scaleFontSize(12),
    color: "rgba(255,255,255,0.8)",
    marginTop: moderateScale(4),
  },
  summaryCardsRow: {
    flexDirection: "row",
    gap: moderateScale(12),
  },
  summaryCardSmall: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  summaryCardLabelSmall: {
    fontSize: scaleFontSize(12),
    color: "#666",
    marginTop: moderateScale(8),
    fontWeight: "500",
  },
  summaryCardValueSmall: {
    fontSize: scaleFontSize(20),
    fontWeight: "bold",
    color: "#333",
    marginTop: moderateScale(4),
  },
  growthBadge: {
    fontSize: scaleFontSize(12),
    fontWeight: "600",
    marginTop: moderateScale(4),
  },
  pendingBookingsText: {
    fontSize: scaleFontSize(11),
    color: "#999",
    marginTop: moderateScale(2),
  },
  paymentMethodSection: {
    marginBottom: moderateScale(24),
  },
  paymentMethodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(12),
  },
  paymentMethodCard: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  paymentMethodName: {
    fontSize: scaleFontSize(13),
    fontWeight: "600",
    color: "#333",
    marginTop: moderateScale(8),
  },
  paymentMethodAmount: {
    fontSize: scaleFontSize(16),
    fontWeight: "bold",
    color: "#1C86FF",
    marginTop: moderateScale(4),
  },
  paymentMethodCount: {
    fontSize: scaleFontSize(11),
    color: "#999",
    marginTop: moderateScale(2),
  },
  transactionsSection: {
    marginBottom: moderateScale(24),
  },
  sectionTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: "bold",
    color: "#1C86FF",
    marginBottom: moderateScale(16),
  },
  transactionCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: moderateScale(12),
    borderWidth: 1,
    borderColor: "#E0E0E0",
    alignItems: "center",
  },
  transactionIcon: {
    marginRight: moderateScale(12),
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCustomer: {
    fontSize: scaleFontSize(15),
    fontWeight: "600",
    color: "#333",
    marginBottom: moderateScale(4),
  },
  transactionService: {
    fontSize: scaleFontSize(13),
    color: "#666",
    marginBottom: moderateScale(2),
  },
  transactionDate: {
    fontSize: scaleFontSize(12),
    color: "#999",
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: scaleFontSize(16),
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: moderateScale(6),
  },
  statusBadge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
  },
  statusBadgePaid: {
    backgroundColor: "#E8F5E9",
  },
  statusBadgeText: {
    fontSize: scaleFontSize(11),
    color: "#FF9B79",
    fontWeight: "600",
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(40),
    paddingHorizontal: moderateScale(20),
  },
  emptyStateText: {
    marginTop: moderateScale(12),
    fontSize: scaleFontSize(14),
    color: '#999',
    textAlign: 'center',
    fontFamily: 'SFProReg',
  },
});
