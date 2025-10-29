import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { moderateScale, scaleFontSize } from '@utils/responsive';

const TimeDistribution = ({ data }) => {
  if (!data || data.length === 0) {
    return null;
  }

  // Find max count for scaling bars
  const maxCount = Math.max(...data.map(item => item.count));

  // Sort by hour
  const sortedData = [...data].sort((a, b) => a.hour - b.hour);

  // Get peak hours (top 3)
  const peakHours = [...data]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Booking Times</Text>

      {/* Peak Hours Summary */}
      <View style={styles.peakHoursContainer}>
        <Text style={styles.peakHoursLabel}>Peak Hours</Text>
        <View style={styles.peakHoursGrid}>
          {peakHours.map((item, index) => (
            <View key={item.hour} style={styles.peakHourCard}>
              <Text style={styles.peakHourRank}>#{index + 1}</Text>
              <Text style={styles.peakHourTime}>{item.timeSlot}</Text>
              <Text style={styles.peakHourCount}>{item.count} bookings</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Hourly Distribution */}
      <Text style={styles.distributionLabel}>Hourly Distribution</Text>
      <View style={styles.chartContainer}>
        {sortedData.map((item) => {
          const barWidth = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
          const isPeak = peakHours.some(peak => peak.hour === item.hour);

          return (
            <View key={item.hour} style={styles.barRow}>
              <Text style={styles.timeLabel}>{item.timeSlot}</Text>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    { width: `${barWidth}%` },
                    isPeak && styles.barPeak
                  ]}
                />
              </View>
              <Text style={styles.countLabel}>{item.count}</Text>
            </View>
          );
        })}
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
  peakHoursContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: moderateScale(20),
  },
  peakHoursLabel: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#666',
    marginBottom: moderateScale(12),
  },
  peakHoursGrid: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },
  peakHourCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  peakHourRank: {
    fontSize: scaleFontSize(12),
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: moderateScale(4),
  },
  peakHourTime: {
    fontSize: scaleFontSize(13),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(2),
    textAlign: 'center',
  },
  peakHourCount: {
    fontSize: scaleFontSize(11),
    color: '#666',
  },
  distributionLabel: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#666',
    marginBottom: moderateScale(12),
  },
  chartContainer: {
    gap: moderateScale(8),
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  timeLabel: {
    fontSize: scaleFontSize(11),
    color: '#666',
    width: moderateScale(80),
    textAlign: 'right',
  },
  barContainer: {
    flex: 1,
    height: moderateScale(24),
    backgroundColor: '#F0F0F0',
    borderRadius: moderateScale(4),
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: moderateScale(4),
    minWidth: moderateScale(2),
  },
  barPeak: {
    backgroundColor: '#FF9800',
  },
  countLabel: {
    fontSize: scaleFontSize(12),
    fontWeight: '600',
    color: '#333',
    width: moderateScale(32),
    textAlign: 'right',
  },
});

export default TimeDistribution;
