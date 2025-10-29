import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale, scaleFontSize, wp } from '@utils/responsive';

const RevenueTrend = ({ data, formatCurrency }) => {
  if (!data || data.length === 0) {
    return null;
  }

  // Calculate stats
  const totalRevenue = data.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const totalBookings = data.reduce((sum, item) => sum + (item.bookings || 0), 0);
  const maxRevenue = Math.max(...data.map(item => item.revenue || 0));

  // Calculate trend (comparing first half vs second half)
  const midpoint = Math.floor(data.length / 2);
  const firstHalfAvg = data.slice(0, midpoint).reduce((sum, item) => sum + (item.revenue || 0), 0) / midpoint;
  const secondHalfAvg = data.slice(midpoint).reduce((sum, item) => sum + (item.revenue || 0), 0) / (data.length - midpoint);
  const trendPercentage = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
  const isPositiveTrend = trendPercentage >= 0;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Revenue Trend</Text>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Ionicons name="trending-up" size={moderateScale(24)} color="#4CAF50" />
          <Text style={styles.summaryValue}>{formatCurrency(totalRevenue)}</Text>
          <Text style={styles.summaryLabel}>Total Revenue</Text>
        </View>

        <View style={styles.summaryCard}>
          <Ionicons name="calendar" size={moderateScale(24)} color="#2196F3" />
          <Text style={styles.summaryValue}>{totalBookings}</Text>
          <Text style={styles.summaryLabel}>Total Bookings</Text>
        </View>

        <View style={styles.summaryCard}>
          <Ionicons
            name={isPositiveTrend ? "arrow-up" : "arrow-down"}
            size={moderateScale(24)}
            color={isPositiveTrend ? "#4CAF50" : "#F44336"}
          />
          <Text style={[styles.summaryValue, { color: isPositiveTrend ? "#4CAF50" : "#F44336" }]}>
            {Math.abs(trendPercentage).toFixed(1)}%
          </Text>
          <Text style={styles.summaryLabel}>
            {isPositiveTrend ? 'Growth' : 'Decline'}
          </Text>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartLabel}>Daily Revenue</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.chart}>
            {/* Y-axis labels */}
            <View style={styles.yAxis}>
              <Text style={styles.yAxisLabel}>{formatCurrency(maxRevenue)}</Text>
              <Text style={styles.yAxisLabel}>{formatCurrency(maxRevenue * 0.5)}</Text>
              <Text style={styles.yAxisLabel}>₱0</Text>
            </View>

            {/* Bars */}
            <View style={styles.barsContainer}>
              {data.map((item, index) => {
                const barHeight = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                const isHighRevenue = item.revenue > totalRevenue / data.length;

                return (
                  <View key={index} style={styles.barColumn}>
                    <View style={styles.barWrapper}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: `${barHeight}%`,
                            backgroundColor: isHighRevenue ? '#4CAF50' : '#2196F3',
                          },
                        ]}
                      >
                        {item.revenue > 0 && (
                          <Text style={styles.barValue} numberOfLines={1}>
                            {formatCurrency(item.revenue)}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.barInfo}>
                      <Text style={styles.dateLabel} numberOfLines={1}>
                        {item.date}
                      </Text>
                      <Text style={styles.bookingsLabel}>
                        {item.bookings} {item.bookings === 1 ? 'booking' : 'bookings'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Above Average</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#2196F3' }]} />
          <Text style={styles.legendText}>Below Average</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  summaryContainer: {
    flexDirection: 'row',
    gap: moderateScale(12),
    marginBottom: moderateScale(20),
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    color: '#333',
    marginTop: moderateScale(6),
    marginBottom: moderateScale(2),
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: scaleFontSize(10),
    color: '#666',
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: moderateScale(12),
  },
  chartLabel: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#666',
    marginBottom: moderateScale(12),
  },
  scrollContent: {
    paddingRight: moderateScale(20),
  },
  chart: {
    flexDirection: 'row',
    height: moderateScale(200),
  },
  yAxis: {
    width: moderateScale(60),
    justifyContent: 'space-between',
    paddingRight: moderateScale(8),
    paddingVertical: moderateScale(4),
  },
  yAxisLabel: {
    fontSize: scaleFontSize(10),
    color: '#666',
    textAlign: 'right',
  },
  barsContainer: {
    flexDirection: 'row',
    flex: 1,
    gap: moderateScale(8),
  },
  barColumn: {
    width: moderateScale(60),
    justifyContent: 'flex-end',
  },
  barWrapper: {
    height: moderateScale(140),
    justifyContent: 'flex-end',
    marginBottom: moderateScale(8),
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: moderateScale(4),
    borderTopRightRadius: moderateScale(4),
    minHeight: moderateScale(4),
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: moderateScale(4),
  },
  barValue: {
    fontSize: scaleFontSize(9),
    color: '#fff',
    fontWeight: 'bold',
    transform: [{ rotate: '-90deg' }],
  },
  barInfo: {
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: scaleFontSize(10),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(2),
    textAlign: 'center',
  },
  bookingsLabel: {
    fontSize: scaleFontSize(9),
    color: '#666',
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: moderateScale(16),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  legendColor: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(2),
  },
  legendText: {
    fontSize: scaleFontSize(11),
    color: '#666',
  },
});

export default RevenueTrend;
