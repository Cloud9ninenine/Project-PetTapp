import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale, scaleFontSize } from '@utils/responsive';

export default function AnalyticsCard({ analytics, loading }) {
  if (loading) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Business Analytics</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1C86FF" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </View>
    );
  }

  if (!analytics) {
    return null;
  }

  const { overview, topServices, customerStats } = analytics;

  const formatCurrency = (amount) => {
    return `₱${amount?.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`;
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Business Analytics</Text>

      {/* Key Metrics */}
      <View style={styles.metricsGrid}>
        {/* Total Revenue */}
        <View style={[styles.metricCard, { backgroundColor: '#E8F5E9' }]}>
          <View style={[styles.metricIcon, { backgroundColor: '#4CAF50' }]}>
            <Ionicons name="cash" size={moderateScale(20)} color="#fff" />
          </View>
          <Text style={styles.metricValue}>{formatCurrency(overview?.totalRevenue)}</Text>
          <Text style={styles.metricLabel}>Total Revenue</Text>
        </View>

        {/* Total Bookings */}
        <View style={[styles.metricCard, { backgroundColor: '#E3F2FD' }]}>
          <View style={[styles.metricIcon, { backgroundColor: '#2196F3' }]}>
            <Ionicons name="calendar" size={moderateScale(20)} color="#fff" />
          </View>
          <Text style={styles.metricValue}>{overview?.totalBookings || 0}</Text>
          <Text style={styles.metricLabel}>Total Bookings</Text>
        </View>

        {/* Completed Bookings */}
        <View style={[styles.metricCard, { backgroundColor: '#FFF3E0' }]}>
          <View style={[styles.metricIcon, { backgroundColor: '#FF9800' }]}>
            <Ionicons name="checkmark-done" size={moderateScale(20)} color="#fff" />
          </View>
          <Text style={styles.metricValue}>{overview?.completedBookings || 0}</Text>
          <Text style={styles.metricLabel}>Completed</Text>
        </View>

        {/* Average Booking Value */}
        <View style={[styles.metricCard, { backgroundColor: '#F3E5F5' }]}>
          <View style={[styles.metricIcon, { backgroundColor: '#9C27B0' }]}>
            <Ionicons name="stats-chart" size={moderateScale(20)} color="#fff" />
          </View>
          <Text style={styles.metricValue}>{formatCurrency(overview?.averageBookingValue)}</Text>
          <Text style={styles.metricLabel}>Avg. Value</Text>
        </View>
      </View>

      {/* Performance Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance</Text>
        <View style={styles.performanceRow}>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Completion Rate</Text>
            <Text style={[styles.performanceValue, { color: '#4CAF50' }]}>
              {formatPercentage(overview?.completionRate)}
            </Text>
          </View>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Cancellation Rate</Text>
            <Text style={[styles.performanceValue, { color: '#F44336' }]}>
              {formatPercentage(overview?.cancellationRate)}
            </Text>
          </View>
        </View>
      </View>

      {/* Customer Stats */}
      {customerStats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Insights</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={moderateScale(18)} color="#1C86FF" />
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{customerStats.totalCustomers || 0}</Text>
                <Text style={styles.statLabel}>Total Customers</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="repeat" size={moderateScale(18)} color="#4CAF50" />
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{customerStats.repeatCustomers || 0}</Text>
                <Text style={styles.statLabel}>Repeat Customers</Text>
              </View>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="trending-up" size={moderateScale(18)} color="#FF9800" />
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{formatPercentage(customerStats.retentionRate)}</Text>
                <Text style={styles.statLabel}>Retention Rate</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="bar-chart" size={moderateScale(18)} color="#9C27B0" />
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{customerStats.averageBookingsPerCustomer?.toFixed(1) || '0.0'}</Text>
                <Text style={styles.statLabel}>Avg. Bookings/Customer</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Top Services */}
      {topServices && topServices.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Services</Text>
          {topServices.slice(0, 3).map((service, index) => (
            <View key={index} style={styles.serviceItem}>
              <View style={styles.serviceRank}>
                <Text style={styles.serviceRankText}>{index + 1}</Text>
              </View>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName} numberOfLines={1}>{service.serviceName || 'Unknown Service'}</Text>
                <Text style={styles.serviceStats}>
                  {service.bookings || 0} bookings • {formatCurrency(service.revenue)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    marginBottom: moderateScale(20),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(15),
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: moderateScale(30),
  },
  loadingText: {
    marginTop: moderateScale(10),
    fontSize: scaleFontSize(14),
    color: '#666',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(10),
    marginBottom: moderateScale(15),
  },
  metricCard: {
    flex: 1,
    minWidth: '47%',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    alignItems: 'center',
  },
  metricIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  metricValue: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: moderateScale(4),
  },
  metricLabel: {
    fontSize: scaleFontSize(11),
    color: '#666',
    textAlign: 'center',
  },
  section: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: moderateScale(15),
    marginTop: moderateScale(10),
  },
  sectionTitle: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(12),
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  performanceItem: {
    alignItems: 'center',
  },
  performanceLabel: {
    fontSize: scaleFontSize(12),
    color: '#666',
    marginBottom: moderateScale(4),
  },
  performanceValue: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(12),
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(8),
    padding: moderateScale(10),
    marginHorizontal: moderateScale(4),
  },
  statContent: {
    marginLeft: moderateScale(8),
  },
  statValue: {
    fontSize: scaleFontSize(14),
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: scaleFontSize(10),
    color: '#666',
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  serviceRank: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: '#1C86FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  serviceRankText: {
    fontSize: scaleFontSize(14),
    fontWeight: 'bold',
    color: '#fff',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(2),
  },
  serviceStats: {
    fontSize: scaleFontSize(12),
    color: '#666',
  },
});
