import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { moderateScale, scaleFontSize } from '@utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

  const isThinScreen = SCREEN_WIDTH < 400;

  // Debug log to check screen width
  console.log('TimeDistribution - SCREEN_WIDTH:', SCREEN_WIDTH, 'isThinScreen:', isThinScreen);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Booking Times</Text>

      {/* Peak Hours Summary */}
      <View style={styles.peakHoursContainer}>
        <Text style={styles.peakHoursLabel}>Peak Hours</Text>
        {isThinScreen ? (
          <View style={styles.peakHoursGridBento}>
            {/* Top row: #1 full width */}
            <View style={[styles.peakHourCard, styles.bentoPeakFullCard]}>
              <Text style={styles.peakHourRank}>#{1}</Text>
              <Text style={styles.peakHourTime}>{peakHours[0]?.timeSlot}</Text>
              <Text style={styles.peakHourCount}>{peakHours[0]?.count} bookings</Text>
            </View>

            {/* Bottom row: #2 and #3 side by side */}
            <View style={styles.bentoPeakBottomRow}>
              {peakHours[1] && (
                <View style={[styles.peakHourCard, styles.bentoPeakSmallCard]}>
                  <Text style={styles.peakHourRank}>#{2}</Text>
                  <Text style={styles.peakHourTime}>{peakHours[1]?.timeSlot}</Text>
                  <Text style={styles.peakHourCount}>{peakHours[1]?.count} bookings</Text>
                </View>
              )}

              {peakHours[2] && (
                <View style={[styles.peakHourCard, styles.bentoPeakSmallCard]}>
                  <Text style={styles.peakHourRank}>#{3}</Text>
                  <Text style={styles.peakHourTime}>{peakHours[2]?.timeSlot}</Text>
                  <Text style={styles.peakHourCount}>{peakHours[2]?.count} bookings</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.peakHoursGrid}>
            {peakHours.map((item, index) => (
              <View key={item.hour} style={styles.peakHourCard}>
                <Text style={styles.peakHourRank}>#{index + 1}</Text>
                <Text style={styles.peakHourTime}>{item.timeSlot}</Text>
                <Text style={styles.peakHourCount}>{item.count} bookings</Text>
              </View>
            ))}
          </View>
        )}
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
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  peakHoursGridBento: {
    gap: moderateScale(10),
  },
  bentoPeakBottomRow: {
    flexDirection: 'row',
    gap: moderateScale(10),
  },
  bentoPeakSmallCard: {
    flex: 1,
    minWidth: 0,
  },
  bentoPeakFullCard: {
    width: '100%',
    flex: 0,
    marginBottom: moderateScale(10),
  },
  peakHourCard: {
    flex: 1,
    minWidth: '28%',
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
    textAlign: 'center',
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
    gap: SCREEN_WIDTH < 350 ? moderateScale(6) : moderateScale(8),
  },
  timeLabel: {
    fontSize: SCREEN_WIDTH < 350 ? scaleFontSize(9) : scaleFontSize(11),
    color: '#666',
    width: SCREEN_WIDTH < 350 ? moderateScale(65) : moderateScale(80),
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
    fontSize: SCREEN_WIDTH < 350 ? scaleFontSize(10) : scaleFontSize(12),
    fontWeight: '600',
    color: '#333',
    width: SCREEN_WIDTH < 350 ? moderateScale(28) : moderateScale(32),
    textAlign: 'right',
  },
});

export default TimeDistribution;
