import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Header from "@components/Header";
import { hp, wp, moderateScale, scaleFontSize } from '@utils/responsive';

export default function RevenueScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText} numberOfLines={1}>
        Revenue
      </Text>
    </View>
  );

  // Mock revenue data
  const revenueData = {
    total: "₱45,250",
    thisMonth: "₱12,500",
    lastMonth: "₱10,800",
    growth: "+15.7%",
  };

  const recentTransactions = [
    {
      id: 1,
      customerName: "John Doe",
      service: "Veterinary Checkup",
      amount: "₱500",
      date: "Oct 08, 2025",
      status: "completed",
    },
    {
      id: 2,
      customerName: "Jane Smith",
      service: "Pet Grooming",
      amount: "₱800",
      date: "Oct 07, 2025",
      status: "completed",
    },
    {
      id: 3,
      customerName: "Mike Johnson",
      service: "Boarding",
      amount: "₱1,200",
      date: "Oct 06, 2025",
      status: "completed",
    },
  ];

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
      >
        {/* Coming Soon Banner */}
        <View style={styles.comingSoonBanner}>
          <Ionicons name="analytics-outline" size={moderateScale(64)} color="#B3D9FF" />
          <Text style={styles.comingSoonTitle}>Revenue Analytics</Text>
          <Text style={styles.comingSoonSubtitle}>Coming Soon</Text>
          <Text style={styles.comingSoonText}>
            Track your earnings, view detailed analytics, and manage your business finances all in one place
          </Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
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
            <Text style={styles.summaryCardLabel}>Total Revenue</Text>
            <Text style={styles.summaryCardValue}>{revenueData.total}</Text>
          </View>

          <View style={styles.summaryCardsRow}>
            <View style={styles.summaryCardSmall}>
              <Ionicons name="trending-up-outline" size={moderateScale(24)} color="#4CAF50" />
              <Text style={styles.summaryCardLabelSmall}>This Month</Text>
              <Text style={styles.summaryCardValueSmall}>{revenueData.thisMonth}</Text>
              <Text style={styles.growthBadge}>{revenueData.growth}</Text>
            </View>

            <View style={styles.summaryCardSmall}>
              <Ionicons name="calendar-outline" size={moderateScale(24)} color="#FF9B79" />
              <Text style={styles.summaryCardLabelSmall}>Last Month</Text>
              <Text style={styles.summaryCardValueSmall}>{revenueData.lastMonth}</Text>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {recentTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionIcon}>
                <Ionicons name="person-circle-outline" size={moderateScale(32)} color="#1C86FF" />
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionCustomer}>{transaction.customerName}</Text>
                <Text style={styles.transactionService}>{transaction.service}</Text>
                <Text style={styles.transactionDate}>{transaction.date}</Text>
              </View>
              <View style={styles.transactionRight}>
                <Text style={styles.transactionAmount}>{transaction.amount}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>Completed</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Placeholder for future features */}
        <View style={styles.featurePreviewContainer}>
          <View style={styles.featurePreview}>
            <Ionicons name="bar-chart-outline" size={moderateScale(32)} color="#1C86FF" />
            <Text style={styles.featurePreviewTitle}>Revenue Charts</Text>
            <Text style={styles.featurePreviewText}>Visual analytics coming soon</Text>
          </View>
          <View style={styles.featurePreview}>
            <Ionicons name="download-outline" size={moderateScale(32)} color="#1C86FF" />
            <Text style={styles.featurePreviewTitle}>Export Reports</Text>
            <Text style={styles.featurePreviewText}>Download financial reports</Text>
          </View>
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
  comingSoonBanner: {
    backgroundColor: "#E3F2FD",
    borderRadius: moderateScale(16),
    padding: moderateScale(32),
    alignItems: "center",
    marginBottom: moderateScale(24),
    borderWidth: 2,
    borderColor: "#B3D9FF",
  },
  comingSoonTitle: {
    fontSize: scaleFontSize(24),
    fontWeight: "bold",
    color: "#1C86FF",
    marginTop: moderateScale(16),
  },
  comingSoonSubtitle: {
    fontSize: scaleFontSize(16),
    fontWeight: "600",
    color: "#FF9B79",
    marginTop: moderateScale(8),
  },
  comingSoonText: {
    fontSize: scaleFontSize(14),
    color: "#666",
    textAlign: "center",
    marginTop: moderateScale(12),
    lineHeight: moderateScale(20),
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
    color: "#4CAF50",
    marginTop: moderateScale(4),
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
    backgroundColor: "#E8F5E9",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
  },
  statusBadgeText: {
    fontSize: scaleFontSize(11),
    color: "#4CAF50",
    fontWeight: "600",
  },
  featurePreviewContainer: {
    flexDirection: "row",
    gap: moderateScale(12),
  },
  featurePreview: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderRadius: moderateScale(12),
    padding: moderateScale(20),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  featurePreviewTitle: {
    fontSize: scaleFontSize(14),
    fontWeight: "600",
    color: "#1C86FF",
    marginTop: moderateScale(12),
    textAlign: "center",
  },
  featurePreviewText: {
    fontSize: scaleFontSize(12),
    color: "#666",
    marginTop: moderateScale(4),
    textAlign: "center",
  },
});
