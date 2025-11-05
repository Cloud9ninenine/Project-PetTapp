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
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter, useLocalSearchParams } from "expo-router";
import Header from "@components/Header";
import { hp, wp, moderateScale, scaleFontSize } from '@utils/responsive';
import {
  fetchTodayAnalytics,
  fetchLast7DaysAnalytics,
  fetchLast30DaysAnalytics,
  fetchCurrentMonthAnalytics,
  fetchLastMonthAnalytics,
  fetchLast3MonthsAnalytics,
  fetchThisYearAnalytics,
  fetchAllTimeAnalytics,
} from './analyticsService';
import PaymentBreakdown from './components/PaymentBreakdown';
import TimeDistribution from './components/TimeDistribution';
import RatingsDisplay from './components/RatingsDisplay';
import RevenueTrend from './components/RevenueTrend';
import CustomAlert from './components/CustomAlert';
import { useCustomAlert } from './hooks/useCustomAlert';
import { generateReport } from './reportService';

export default function AnalyticsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedPeriod, setSelectedPeriod] = useState(params.filter || "allTime");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [formatModalVisible, setFormatModalVisible] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();

  const handleBackPress = () => {
    router.push('/(bsn)/(tabs)/home');
  };

  // Period options
  const periodOptions = [
    { value: 'today', label: 'Today' },
    { value: 'last7Days', label: 'Last 7 Days' },
    { value: 'last30Days', label: 'Last 30 Days' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'last3Months', label: 'Last 3 Months' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'allTime', label: 'All Time' },
  ];

  // Fetch analytics data using service layer
  const fetchAnalyticsData = async () => {
    try {
      console.log('Fetching analytics for period:', selectedPeriod);

      let data;
      switch (selectedPeriod) {
        case 'today':
          data = await fetchTodayAnalytics();
          break;
        case 'last7Days':
          data = await fetchLast7DaysAnalytics();
          break;
        case 'last30Days':
          data = await fetchLast30DaysAnalytics();
          break;
        case 'thisMonth':
          data = await fetchCurrentMonthAnalytics();
          break;
        case 'lastMonth':
          data = await fetchLastMonthAnalytics();
          break;
        case 'last3Months':
          data = await fetchLast3MonthsAnalytics();
          break;
        case 'thisYear':
          data = await fetchThisYearAnalytics();
          break;
        case 'allTime':
          data = await fetchAllTimeAnalytics();
          break;
        default:
          data = await fetchAllTimeAnalytics();
      }

      console.log('Analytics data received:', data);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      console.error('Error details:', error.response?.data);

      if (error.response?.status === 404) {
        showAlert('Business Not Found', 'Please complete your business profile first.', 'error');
      } else if (error.response?.status === 403) {
        showAlert('Access Denied', 'You do not have permission to view analytics.', 'error');
      } else {
        showAlert('Error', error.response?.data?.message || 'Failed to load analytics data. Please try again.', 'error');
      }
      setAnalyticsData(null);
    }
  };

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      await fetchAnalyticsData();
    } catch (error) {
      console.error('Error loading analytics data:', error);
      showAlert('Error', 'Failed to load analytics data', 'error');
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
      await fetchAnalyticsData();
    } catch (error) {
      console.error('Error during quiet refresh:', error);
      // Don't show alerts during quiet refresh
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
        Analytics
      </Text>
    </View>
  );

  // Helper functions
  const formatCurrency = (amount) => {
    return `₱${(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  // Handle report generation with selected format
  const handleGenerateReport = async (format) => {
    try {
      setIsGeneratingReport(true);
      setFormatModalVisible(false);
      await generateReport(selectedPeriod, format, showAlert);
    } catch (error) {
      showAlert('Error', error.message || 'Failed to generate report', 'error');
    } finally {
      setIsGeneratingReport(false);
    }
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
          onBackPress={handleBackPress}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1C86FF" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const {
    overview,
    topServices,
    customerStats,
    statusBreakdown,
    dayOfWeekDistribution,
    paymentMethodBreakdown,
    timeOfDayDistribution,
    ratings,
    revenueTrend
  } = analyticsData || {};

  // Empty state when no data
  if (!loading && !analyticsData) {
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
          onBackPress={handleBackPress}
        />
        <ScrollView
          contentContainerStyle={styles.emptyStateContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Ionicons name="analytics-outline" size={moderateScale(80)} color="#ccc" />
          <Text style={styles.emptyStateTitle}>No Analytics Data</Text>
          <Text style={styles.emptyStateText}>
            Analytics data will appear here once you have bookings. Start by completing your business profile and receiving your first booking!
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Ionicons name="refresh" size={moderateScale(20)} color="#1C86FF" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

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
        onBackPress={handleBackPress}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Period Selector and Generate Report Section */}
        <View style={styles.topActionsContainer}>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setDropdownVisible(true)}
          >
            <View style={styles.dropdownButtonContent}>
              <Ionicons name="calendar" size={moderateScale(20)} color="#1C86FF" />
              <Text style={styles.dropdownButtonText}>
                {periodOptions.find(opt => opt.value === selectedPeriod)?.label || 'Select Period'}
              </Text>
              <Ionicons name="chevron-down" size={moderateScale(20)} color="#666" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.generateReportButton}
            onPress={() => setFormatModalVisible(true)}
            disabled={isGeneratingReport}
          >
            {isGeneratingReport ? (
              <ActivityIndicator size="small" color="#1C86FF" />
            ) : (
              <Ionicons name="download-outline" size={moderateScale(24)} color="#1C86FF" />
            )}
          </TouchableOpacity>
        </View>

        {/* Dropdown Modal */}
        <Modal
          visible={dropdownVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setDropdownVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setDropdownVisible(false)}
          >
            <View style={styles.dropdownModal}>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownHeaderText}>Select Time Period</Text>
                <TouchableOpacity onPress={() => setDropdownVisible(false)}>
                  <Ionicons name="close" size={moderateScale(24)} color="#666" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.dropdownList}>
                {periodOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.dropdownOption,
                      selectedPeriod === option.value && styles.dropdownOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedPeriod(option.value);
                      setDropdownVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        selectedPeriod === option.value && styles.dropdownOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {selectedPeriod === option.value && (
                      <Ionicons name="checkmark" size={moderateScale(24)} color="#1C86FF" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Key Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: '#E8F5E9' }]}>
            <View style={[styles.metricIcon, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="cash" size={moderateScale(24)} color="#fff" />
            </View>
            <Text style={styles.metricValue}>{formatCurrency(overview?.totalRevenue)}</Text>
            <Text style={styles.metricLabel}>Total Revenue</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: '#E3F2FD' }]}>
            <View style={[styles.metricIcon, { backgroundColor: '#2196F3' }]}>
              <Ionicons name="calendar" size={moderateScale(24)} color="#fff" />
            </View>
            <Text style={styles.metricValue}>{overview?.totalBookings || 0}</Text>
            <Text style={styles.metricLabel}>Total Bookings</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: '#FFF3E0' }]}>
            <View style={[styles.metricIcon, { backgroundColor: '#FF9800' }]}>
              <Ionicons name="checkmark-done" size={moderateScale(24)} color="#fff" />
            </View>
            <Text style={styles.metricValue}>{overview?.completedBookings || 0}</Text>
            <Text style={styles.metricLabel}>Completed</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: '#F3E5F5' }]}>
            <View style={[styles.metricIcon, { backgroundColor: '#9C27B0' }]}>
              <Ionicons name="stats-chart" size={moderateScale(24)} color="#fff" />
            </View>
            <Text style={styles.metricValue}>{formatCurrency(overview?.averageBookingValue)}</Text>
            <Text style={styles.metricLabel}>Avg. Value</Text>
          </View>
        </View>

        {/* Performance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <View style={styles.performanceGrid}>
            <View style={styles.performanceCard}>
              <View style={styles.performanceHeader}>
                <Ionicons name="checkmark-circle" size={moderateScale(28)} color="#4CAF50" />
                <Text style={[styles.performanceValue, { color: '#4CAF50' }]}>
                  {formatPercentage(overview?.completionRate)}
                </Text>
              </View>
              <Text style={styles.performanceLabel}>Completion Rate</Text>
            </View>

            <View style={styles.performanceCard}>
              <View style={styles.performanceHeader}>
                <Ionicons name="close-circle" size={moderateScale(28)} color="#F44336" />
                <Text style={[styles.performanceValue, { color: '#F44336' }]}>
                  {formatPercentage(overview?.cancellationRate)}
                </Text>
              </View>
              <Text style={styles.performanceLabel}>Cancellation Rate</Text>
            </View>
          </View>
        </View>

        {/* Customer Insights Section */}
        {customerStats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Insights</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="people" size={moderateScale(28)} color="#1C86FF" />
                <Text style={styles.statValue}>{customerStats.totalCustomers || 0}</Text>
                <Text style={styles.statLabel}>Total Customers</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="repeat" size={moderateScale(28)} color="#4CAF50" />
                <Text style={styles.statValue}>{customerStats.repeatCustomers || 0}</Text>
                <Text style={styles.statLabel}>Repeat Customers</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="trending-up" size={moderateScale(28)} color="#FF9800" />
                <Text style={styles.statValue}>{formatPercentage(customerStats.retentionRate)}</Text>
                <Text style={styles.statLabel}>Retention Rate</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="bar-chart" size={moderateScale(28)} color="#9C27B0" />
                <Text style={styles.statValue}>
                  {customerStats.averageBookingsPerCustomer?.toFixed(1) || '0.0'}
                </Text>
                <Text style={styles.statLabel}>Avg. Bookings</Text>
              </View>
            </View>
          </View>
        )}

        {/* Top Services Section */}
        {topServices && topServices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Services</Text>
            {topServices.slice(0, 5).map((service, index) => (
              <View key={index} style={styles.serviceCard}>
                <View style={styles.serviceRank}>
                  <Text style={styles.serviceRankText}>{index + 1}</Text>
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName} numberOfLines={1}>
                    {service.serviceName || 'Unknown Service'}
                  </Text>
                  <Text style={styles.serviceStats}>
                    {service.bookings || 0} bookings • {formatCurrency(service.revenue)}
                  </Text>
                </View>
                <View style={styles.serviceRevenue}>
                  <Ionicons name="trending-up" size={moderateScale(20)} color="#4CAF50" />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Booking Status Breakdown */}
        {statusBreakdown && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Booking Status</Text>
            <View style={styles.statusGrid}>
              {Object.entries(statusBreakdown).map(([status, count]) => (
                <View key={status} style={styles.statusCard}>
                  <Text style={styles.statusCount}>{count || 0}</Text>
                  <Text style={styles.statusLabel}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Day of Week Distribution */}
        {dayOfWeekDistribution && dayOfWeekDistribution.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Busiest Days</Text>
            {dayOfWeekDistribution
              .sort((a, b) => b.count - a.count)
              .slice(0, 3)
              .map((day, index) => (
                <View key={index} style={styles.dayCard}>
                  <View style={styles.dayRank}>
                    <Text style={styles.dayRankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.dayInfo}>
                    <Text style={styles.dayName}>{day.day}</Text>
                    <Text style={styles.dayCount}>{day.count} bookings</Text>
                  </View>
                </View>
              ))}
          </View>
        )}

        {/* Revenue Trend */}
        <RevenueTrend data={revenueTrend} formatCurrency={formatCurrency} />

        {/* Time of Day Distribution */}
        <TimeDistribution data={timeOfDayDistribution} />

        {/* Payment Method Breakdown */}
        <PaymentBreakdown data={paymentMethodBreakdown} formatCurrency={formatCurrency} />

        {/* Customer Ratings */}
        <RatingsDisplay data={ratings} />
      </ScrollView>

      {/* Format Selection Modal */}
      <Modal
        visible={formatModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFormatModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFormatModalVisible(false)}
        >
          <View style={styles.formatModal}>
            <View style={styles.formatModalHeader}>
              <Text style={styles.formatModalTitle}>Select Report Format</Text>
              <TouchableOpacity onPress={() => setFormatModalVisible(false)}>
                <Ionicons name="close" size={moderateScale(24)} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.formatModalBody}>
              <Text style={styles.formatModalSubtitle}>
                Period: {periodOptions.find(opt => opt.value === selectedPeriod)?.label}
              </Text>

              <TouchableOpacity
                style={styles.formatOptionCard}
                onPress={() => handleGenerateReport('pdf')}
              >
                <View style={[styles.formatOptionIcon, { backgroundColor: '#F44336' }]}>
                  <Ionicons name="document-text" size={moderateScale(28)} color="#fff" />
                </View>
                <View style={styles.formatOptionInfo}>
                  <Text style={styles.formatOptionLabel}>PDF Document</Text>
                  <Text style={styles.formatOptionDescription}>
                    Formatted report with charts and graphics
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={moderateScale(20)} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.formatOptionCard}
                onPress={() => handleGenerateReport('csv')}
              >
                <View style={[styles.formatOptionIcon, { backgroundColor: '#4CAF50' }]}>
                  <Ionicons name="grid" size={moderateScale(28)} color="#fff" />
                </View>
                <View style={styles.formatOptionInfo}>
                  <Text style={styles.formatOptionLabel}>CSV Spreadsheet</Text>
                  <Text style={styles.formatOptionDescription}>
                    Data in spreadsheet format for analysis
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={moderateScale(20)} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        onClose={hideAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
      />
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
    paddingBottom: moderateScale(40),
  },
  topActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(20),
    gap: moderateScale(12),
  },
  dropdownButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  generateReportButton: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  dropdownButtonText: {
    flex: 1,
    fontSize: scaleFontSize(15),
    fontWeight: '600',
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  dropdownModal: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    width: '100%',
    maxWidth: moderateScale(400),
    maxHeight: '70%',
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(20),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownHeaderText: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#333',
  },
  dropdownList: {
    maxHeight: moderateScale(400),
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownOptionSelected: {
    backgroundColor: '#E3F2FD',
  },
  dropdownOptionText: {
    fontSize: scaleFontSize(15),
    color: '#333',
  },
  dropdownOptionTextSelected: {
    fontWeight: '600',
    color: '#1C86FF',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(12),
    marginBottom: moderateScale(20),
  },
  metricCard: {
    flex: 1,
    minWidth: '47%',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  metricIcon: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  metricValue: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: moderateScale(4),
  },
  metricLabel: {
    fontSize: scaleFontSize(12),
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    marginBottom: moderateScale(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(16),
  },
  performanceGrid: {
    flexDirection: 'row',
    gap: moderateScale(12),
  },
  performanceCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    alignItems: 'center',
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginBottom: moderateScale(8),
  },
  performanceValue: {
    fontSize: scaleFontSize(24),
    fontWeight: 'bold',
  },
  performanceLabel: {
    fontSize: scaleFontSize(12),
    color: '#666',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(12),
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    alignItems: 'center',
  },
  statValue: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#333',
    marginTop: moderateScale(8),
    marginBottom: moderateScale(4),
  },
  statLabel: {
    fontSize: scaleFontSize(11),
    color: '#666',
    textAlign: 'center',
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    marginBottom: moderateScale(8),
  },
  serviceRank: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: '#1C86FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  serviceRankText: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    color: '#fff',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: scaleFontSize(15),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(4),
  },
  serviceStats: {
    fontSize: scaleFontSize(12),
    color: '#666',
  },
  serviceRevenue: {
    marginLeft: moderateScale(8),
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(12),
  },
  statusCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    alignItems: 'center',
  },
  statusCount: {
    fontSize: scaleFontSize(24),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(4),
  },
  statusLabel: {
    fontSize: scaleFontSize(11),
    color: '#666',
    textAlign: 'center',
  },
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    marginBottom: moderateScale(8),
  },
  dayRank: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  dayRankText: {
    fontSize: scaleFontSize(14),
    fontWeight: 'bold',
    color: '#fff',
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: scaleFontSize(15),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(2),
  },
  dayCount: {
    fontSize: scaleFontSize(12),
    color: '#666',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(10),
    paddingVertical: moderateScale(60),
  },
  emptyStateTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#333',
    marginTop: moderateScale(20),
    marginBottom: moderateScale(12),
  },
  emptyStateText: {
    fontSize: scaleFontSize(14),
    color: '#666',
    textAlign: 'center',
    lineHeight: scaleFontSize(20),
    marginBottom: moderateScale(24),
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(12),
    gap: moderateScale(8),
  },
  retryButtonText: {
    fontSize: scaleFontSize(15),
    fontWeight: '600',
    color: '#1C86FF',
  },
  formatModal: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    width: '100%',
    maxWidth: moderateScale(400),
    overflow: 'hidden',
  },
  formatModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(20),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  formatModalTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  formatModalBody: {
    padding: moderateScale(20),
  },
  formatModalSubtitle: {
    fontSize: scaleFontSize(14),
    color: '#666',
    marginBottom: moderateScale(16),
    textAlign: 'center',
  },
  formatOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: moderateScale(12),
    gap: moderateScale(12),
  },
  formatOptionIcon: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  formatOptionInfo: {
    flex: 1,
  },
  formatOptionLabel: {
    fontSize: scaleFontSize(15),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(4),
  },
  formatOptionDescription: {
    fontSize: scaleFontSize(12),
    color: '#666',
  },
});
