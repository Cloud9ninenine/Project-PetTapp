import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';

export default function EarningsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const earningsStats = {
    total: '₱3,840',
    today: '₱640',
    week: '₱3,840',
    month: '₱15,360',
    growth: '+18.5%',
  };

  const periods = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
  ];

  const earningsBreakdown = [
    {
      id: 1,
      date: 'Oct 8, 2025',
      deliveries: 8,
      earnings: '₱640',
      hours: '6.5 hrs',
      icon: 'calendar',
    },
    {
      id: 2,
      date: 'Oct 7, 2025',
      deliveries: 12,
      earnings: '₱960',
      hours: '8 hrs',
      icon: 'calendar',
    },
    {
      id: 3,
      date: 'Oct 6, 2025',
      deliveries: 10,
      earnings: '₱800',
      hours: '7 hrs',
      icon: 'calendar',
    },
    {
      id: 4,
      date: 'Oct 5, 2025',
      deliveries: 6,
      earnings: '₱480',
      hours: '5 hrs',
      icon: 'calendar',
    },
  ];

  const recentPayments = [
    {
      id: 1,
      date: 'Oct 1, 2025',
      amount: '₱15,360',
      method: 'GCash',
      status: 'completed',
      period: 'Sept 25 - Sept 30',
    },
    {
      id: 2,
      date: 'Sept 25, 2025',
      amount: '₱14,240',
      method: 'Bank Transfer',
      status: 'completed',
      period: 'Sept 18 - Sept 24',
    },
  ];

  const getStatusColor = (status) => {
    return status === 'completed' ? '#4CAF50' : '#FFC107';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("@assets/images/PetTapp pattern.png")}
        style={styles.backgroundimg}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="repeat"
      />
      <Header
        backgroundColor="#FF6B35"
        titleColor="#fff"
        title="Earnings"
        showBack={false}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Earnings Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <View>
              <Text style={styles.overviewLabel}>Total Earnings</Text>
              <Text style={styles.overviewValue}>
                {selectedPeriod === 'today' ? earningsStats.today :
                 selectedPeriod === 'week' ? earningsStats.week :
                 earningsStats.month}
              </Text>
            </View>
            <View style={styles.growthBadge}>
              <Ionicons name="trending-up" size={moderateScale(16)} color="#4CAF50" />
              <Text style={styles.growthText}>{earningsStats.growth}</Text>
            </View>
          </View>

          {/* Period Selector */}
          <View style={styles.periodSelector}>
            {periods.map((period) => (
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

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <Ionicons name="bicycle" size={moderateScale(20)} color="#FF6B35" />
              <Text style={styles.quickStatLabel}>Deliveries</Text>
              <Text style={styles.quickStatValue}>36</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Ionicons name="time" size={moderateScale(20)} color="#FF6B35" />
              <Text style={styles.quickStatLabel}>Avg/Delivery</Text>
              <Text style={styles.quickStatValue}>₱80</Text>
            </View>
          </View>
        </View>

        {/* Daily Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Breakdown</Text>
          {earningsBreakdown.map((item) => (
            <View key={item.id} style={styles.breakdownCard}>
              <View style={styles.breakdownLeft}>
                <View style={styles.dateIconContainer}>
                  <Ionicons name={item.icon} size={moderateScale(20)} color="#FF6B35" />
                </View>
                <View style={styles.breakdownInfo}>
                  <Text style={styles.breakdownDate}>{item.date}</Text>
                  <View style={styles.breakdownStats}>
                    <Text style={styles.breakdownDeliveries}>{item.deliveries} deliveries</Text>
                    <Text style={styles.breakdownHours}> • {item.hours}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.breakdownEarnings}>{item.earnings}</Text>
            </View>
          ))}
        </View>

        {/* Payment History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          {recentPayments.map((payment) => (
            <View key={payment.id} style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentDate}>{payment.date}</Text>
                  <Text style={styles.paymentPeriod}>{payment.period}</Text>
                </View>
                <View style={[styles.paymentStatusBadge, { backgroundColor: getStatusColor(payment.status) }]}>
                  <Text style={styles.paymentStatusText}>
                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                  </Text>
                </View>
              </View>
              <View style={styles.paymentFooter}>
                <View style={styles.paymentMethod}>
                  <Ionicons name="wallet" size={moderateScale(16)} color="#666" />
                  <Text style={styles.paymentMethodText}>{payment.method}</Text>
                </View>
                <Text style={styles.paymentAmount}>{payment.amount}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Withdrawal Button */}
        <TouchableOpacity style={styles.withdrawButton}>
          <Ionicons name="cash-outline" size={moderateScale(22)} color="#fff" />
          <Text style={styles.withdrawButtonText}>Request Withdrawal</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  backgroundimg: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.5 }],
  },
  backgroundImageStyle: {
    opacity: 0.1,
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
    marginBottom: moderateScale(20),
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
    fontSize: scaleFontSize(36),
    fontWeight: 'bold',
    color: '#FF6B35',
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
    marginBottom: moderateScale(20),
  },
  periodButton: {
    flex: 1,
    paddingVertical: moderateScale(10),
    alignItems: 'center',
    borderRadius: moderateScale(8),
  },
  periodButtonActive: {
    backgroundColor: '#FF6B35',
  },
  periodButtonText: {
    fontSize: scaleFontSize(14),
    color: '#666',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: moderateScale(6),
  },
  quickStatDivider: {
    width: 1,
    height: moderateScale(60),
    backgroundColor: '#E0E0E0',
  },
  quickStatLabel: {
    fontSize: scaleFontSize(12),
    color: '#666',
  },
  quickStatValue: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  section: {
    marginBottom: moderateScale(20),
  },
  sectionTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: moderateScale(15),
  },
  breakdownCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    marginBottom: moderateScale(12),
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateIconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#FFE5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  breakdownInfo: {
    flex: 1,
  },
  breakdownDate: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(4),
  },
  breakdownStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownDeliveries: {
    fontSize: scaleFontSize(12),
    color: '#666',
  },
  breakdownHours: {
    fontSize: scaleFontSize(12),
    color: '#999',
  },
  breakdownEarnings: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    marginBottom: moderateScale(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(12),
  },
  paymentInfo: {
    flex: 1,
  },
  paymentDate: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(4),
  },
  paymentPeriod: {
    fontSize: scaleFontSize(12),
    color: '#666',
  },
  paymentStatusBadge: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(10),
  },
  paymentStatusText: {
    fontSize: scaleFontSize(10),
    color: '#fff',
    fontWeight: '600',
  },
  paymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  paymentMethodText: {
    fontSize: scaleFontSize(13),
    color: '#666',
  },
  paymentAmount: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  withdrawButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    elevation: 3,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  withdrawButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
});
