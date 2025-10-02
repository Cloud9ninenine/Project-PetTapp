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

export default function RevenueScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const revenueStats = {
    total: '₱45,200',
    today: '₱2,150',
    week: '₱12,300',
    month: '₱45,200',
    growth: '+12.5%',
  };

  const revenueBreakdown = [
    {
      id: 1,
      service: 'Veterinary Check-up',
      bookings: 85,
      revenue: '₱18,500',
      icon: 'medical',
      color: '#4CAF50',
      percentage: 41,
    },
    {
      id: 2,
      service: 'Pet Grooming',
      bookings: 62,
      revenue: '₱12,800',
      icon: 'cut',
      color: '#2196F3',
      percentage: 28,
    },
    {
      id: 3,
      service: 'Pet Boarding',
      bookings: 28,
      revenue: '₱10,200',
      icon: 'home',
      color: '#FF9B79',
      percentage: 23,
    },
    {
      id: 4,
      service: 'Vaccination',
      bookings: 38,
      revenue: '₱3,700',
      icon: 'fitness',
      color: '#9C27B0',
      percentage: 8,
    },
  ];

  const recentTransactions = [
    {
      id: 1,
      customerName: 'John Doe',
      service: 'Veterinary Check-up',
      amount: '₱500',
      date: 'Oct 8, 2025',
      status: 'completed',
    },
    {
      id: 2,
      customerName: 'Jane Smith',
      service: 'Pet Grooming',
      amount: '₱800',
      date: 'Oct 7, 2025',
      status: 'completed',
    },
    {
      id: 3,
      customerName: 'Mike Johnson',
      service: 'Pet Boarding',
      amount: '₱1,200',
      date: 'Oct 6, 2025',
      status: 'pending',
    },
    {
      id: 4,
      customerName: 'Sarah Williams',
      service: 'Vaccination',
      amount: '₱300',
      date: 'Oct 5, 2025',
      status: 'completed',
    },
  ];

  const periods = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#FF9B79';
      default:
        return '#999';
    }
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
        backgroundColor="#1C86FF"
        titleColor="#fff"
        title="Revenue"
        showBack={true}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Revenue Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <View>
              <Text style={styles.overviewLabel}>Total Revenue</Text>
              <Text style={styles.overviewValue}>{revenueStats.month}</Text>
            </View>
            <View style={styles.growthBadge}>
              <Ionicons name="trending-up" size={moderateScale(16)} color="#4CAF50" />
              <Text style={styles.growthText}>{revenueStats.growth}</Text>
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
              <Ionicons name="calendar-outline" size={moderateScale(20)} color="#1C86FF" />
              <Text style={styles.quickStatLabel}>Today</Text>
              <Text style={styles.quickStatValue}>{revenueStats.today}</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Ionicons name="calendar" size={moderateScale(20)} color="#1C86FF" />
              <Text style={styles.quickStatLabel}>This Week</Text>
              <Text style={styles.quickStatValue}>{revenueStats.week}</Text>
            </View>
          </View>
        </View>

        {/* Revenue Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue by Service</Text>
          {revenueBreakdown.map((item) => (
            <View key={item.id} style={styles.breakdownCard}>
              <View style={[styles.breakdownIcon, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon} size={moderateScale(24)} color="#fff" />
              </View>
              <View style={styles.breakdownInfo}>
                <Text style={styles.breakdownService}>{item.service}</Text>
                <Text style={styles.breakdownBookings}>{item.bookings} bookings</Text>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${item.percentage}%`, backgroundColor: item.color }]} />
                </View>
              </View>
              <View style={styles.breakdownRevenue}>
                <Text style={styles.breakdownAmount}>{item.revenue}</Text>
                <Text style={styles.breakdownPercentage}>{item.percentage}%</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {recentTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionCustomer}>{transaction.customerName}</Text>
                <Text style={styles.transactionService}>{transaction.service}</Text>
                <Text style={styles.transactionDate}>{transaction.date}</Text>
              </View>
              <View style={styles.transactionRight}>
                <Text style={styles.transactionAmount}>{transaction.amount}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) }]}>
                  <Text style={styles.statusText}>
                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
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
    color: '#1C86FF',
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
    backgroundColor: '#1C86FF',
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
    color: '#1C86FF',
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
  breakdownCard: {
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
  breakdownIcon: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  breakdownInfo: {
    flex: 1,
  },
  breakdownService: {
    fontSize: scaleFontSize(15),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(4),
  },
  breakdownBookings: {
    fontSize: scaleFontSize(12),
    color: '#666',
    marginBottom: moderateScale(6),
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
  breakdownRevenue: {
    alignItems: 'flex-end',
  },
  breakdownAmount: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    color: '#1C86FF',
    marginBottom: moderateScale(4),
  },
  breakdownPercentage: {
    fontSize: scaleFontSize(12),
    color: '#666',
  },
  transactionCard: {
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
    marginBottom: moderateScale(4),
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
    color: '#1C86FF',
  },
  statusBadge: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(10),
  },
  statusText: {
    fontSize: scaleFontSize(10),
    color: '#fff',
    fontWeight: '600',
  },
});
