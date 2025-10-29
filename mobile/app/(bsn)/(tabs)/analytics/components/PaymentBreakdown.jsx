import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale, scaleFontSize } from '@utils/responsive';

const PaymentBreakdown = ({ data, formatCurrency }) => {
  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  const getPaymentIcon = (method) => {
    const iconMap = {
      cash: 'cash',
      card: 'card',
      credit_card: 'card',
      debit_card: 'card',
      gcash: 'wallet',
      maya: 'wallet',
      online: 'globe',
      bank_transfer: 'business',
    };
    return iconMap[method.toLowerCase()] || 'cash';
  };

  const getPaymentColor = (index) => {
    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#00BCD4'];
    return colors[index % colors.length];
  };

  const totalAmount = Object.values(data).reduce((sum, item) => sum + (item.total || 0), 0);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Payment Methods</Text>
      {Object.entries(data).map(([method, details], index) => {
        const percentage = totalAmount > 0 ? (details.total / totalAmount) * 100 : 0;
        const color = getPaymentColor(index);

        return (
          <View key={method} style={styles.paymentCard}>
            <View style={styles.paymentLeft}>
              <View style={[styles.paymentIcon, { backgroundColor: color + '20' }]}>
                <Ionicons
                  name={getPaymentIcon(method)}
                  size={moderateScale(24)}
                  color={color}
                />
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentMethod}>
                  {method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ')}
                </Text>
                <Text style={styles.paymentCount}>
                  {details.count || 0} transaction{(details.count || 0) !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <View style={styles.paymentRight}>
              <Text style={styles.paymentAmount}>{formatCurrency(details.total)}</Text>
              <Text style={styles.paymentPercentage}>{percentage.toFixed(1)}%</Text>
            </View>
          </View>
        );
      })}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Payments</Text>
        <Text style={styles.totalAmount}>{formatCurrency(totalAmount)}</Text>
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
  paymentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    marginBottom: moderateScale(8),
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIcon: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  paymentInfo: {
    flex: 1,
  },
  paymentMethod: {
    fontSize: scaleFontSize(15),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(2),
  },
  paymentCount: {
    fontSize: scaleFontSize(12),
    color: '#666',
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: scaleFontSize(15),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: moderateScale(2),
  },
  paymentPercentage: {
    fontSize: scaleFontSize(12),
    color: '#666',
  },
  totalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginTop: moderateScale(8),
  },
  totalLabel: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    color: '#1C86FF',
  },
  totalAmount: {
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
    color: '#1C86FF',
  },
});

export default PaymentBreakdown;
