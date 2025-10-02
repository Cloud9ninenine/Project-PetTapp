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
import { useRouter } from 'expo-router';
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';

export default function RiderHomeScreen() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);

  const riderStats = [
    {
      id: 1,
      title: 'Today Deliveries',
      value: '8',
      icon: 'checkmark-circle',
      color: '#4CAF50',
    },
    {
      id: 2,
      title: "Today's Earnings",
      value: '₱640',
      icon: 'cash',
      color: '#FF6B35',
    },
    {
      id: 3,
      title: 'Pending',
      value: '2',
      icon: 'time',
      color: '#FFC107',
    },
    {
      id: 4,
      title: 'Rating',
      value: '4.8⭐',
      icon: 'star',
      color: '#FFD700',
    },
  ];

  const activeDeliveries = [
    {
      id: 1,
      orderId: '#DEL-001',
      customerName: 'Sarah Johnson',
      petName: 'Max',
      pickupAddress: 'PetStore Central, QC',
      deliveryAddress: '123 Main St, Quezon City',
      status: 'picked_up',
      earnings: '₱80',
      distance: '2.5 km',
    },
    {
      id: 2,
      orderId: '#DEL-002',
      customerName: 'Mike Chen',
      petName: 'Luna',
      pickupAddress: 'Pawsome Pet Care, QC',
      deliveryAddress: '456 Oak Ave, Quezon City',
      status: 'assigned',
      earnings: '₱80',
      distance: '3.2 km',
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'picked_up':
        return '#FF6B35';
      case 'assigned':
        return '#2196F3';
      case 'completed':
        return '#4CAF50';
      default:
        return '#999';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'picked_up':
        return 'In Transit';
      case 'assigned':
        return 'Assigned';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const renderCustomTitle = () => (
    <View style={styles.headerContent}>
      <View style={styles.headerLeftContent}>
        <View style={styles.riderAvatar}>
          <Ionicons name="person" size={moderateScale(24)} color="#fff" />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.riderName}>Juan Dela Cruz</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.onlineToggle, isOnline ? styles.onlineActive : styles.onlineInactive]}
        onPress={() => setIsOnline(!isOnline)}
      >
        <View style={[styles.onlineDot, isOnline && styles.onlineDotActive]} />
        <Text style={styles.onlineText}>{isOnline ? 'Online' : 'Offline'}</Text>
      </TouchableOpacity>
    </View>
  );

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
        customTitle={renderCustomTitle()}
        showBack={false}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.mainContent}>
          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {riderStats.map((stat) => (
              <TouchableOpacity
                key={stat.id}
                style={styles.statCard}
                onPress={() => {
                  if (stat.title === "Today's Earnings") {
                    router.push('../earnings');
                  } else if (stat.title === 'Today Deliveries' || stat.title === 'Pending') {
                    router.push('../deliveries');
                  }
                }}
              >
                <View style={[styles.statIconContainer, { backgroundColor: stat.color }]}>
                  <Ionicons name={stat.icon} size={moderateScale(24)} color="#fff" />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Active Deliveries */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Deliveries</Text>
              <TouchableOpacity onPress={() => router.push('../deliveries')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {activeDeliveries.length > 0 ? (
              activeDeliveries.map((delivery) => (
                <TouchableOpacity
                  key={delivery.id}
                  style={styles.deliveryCard}
                  onPress={() => router.push({
                    pathname: '../deliveries/delivery-details',
                    params: { ...delivery }
                  })}
                >
                  <View style={styles.deliveryHeader}>
                    <Text style={styles.orderId}>{delivery.orderId}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(delivery.status) }]}>
                      <Text style={styles.statusText}>{getStatusLabel(delivery.status)}</Text>
                    </View>
                  </View>

                  <View style={styles.deliveryCustomer}>
                    <Ionicons name="person-circle" size={moderateScale(20)} color="#FF6B35" />
                    <Text style={styles.customerName}>{delivery.customerName}</Text>
                    <Text style={styles.petName}>• {delivery.petName}</Text>
                  </View>

                  <View style={styles.deliveryRoute}>
                    <View style={styles.routeItem}>
                      <Ionicons name="location" size={moderateScale(16)} color="#4CAF50" />
                      <Text style={styles.routeText} numberOfLines={1}>{delivery.pickupAddress}</Text>
                    </View>
                    <View style={styles.routeDivider}>
                      <Ionicons name="arrow-down" size={moderateScale(14)} color="#999" />
                    </View>
                    <View style={styles.routeItem}>
                      <Ionicons name="location" size={moderateScale(16)} color="#FF6B35" />
                      <Text style={styles.routeText} numberOfLines={1}>{delivery.deliveryAddress}</Text>
                    </View>
                  </View>

                  <View style={styles.deliveryFooter}>
                    <View style={styles.distanceContainer}>
                      <Ionicons name="navigate" size={moderateScale(16)} color="#666" />
                      <Text style={styles.distanceText}>{delivery.distance}</Text>
                    </View>
                    <Text style={styles.earningsText}>{delivery.earnings}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="bicycle-outline" size={moderateScale(60)} color="#ccc" />
                <Text style={styles.emptyStateText}>No active deliveries</Text>
                <Text style={styles.emptyStateSubtext}>
                  {isOnline ? 'Waiting for new orders...' : 'Go online to receive orders'}
                </Text>
              </View>
            )}
          </View>
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
    opacity: 0.05,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  headerLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  riderAvatar: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  headerTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: scaleFontSize(12),
    color: '#fff',
    fontFamily: 'SFProReg',
  },
  riderName: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'SFProBold',
  },
  onlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(20),
    gap: moderateScale(6),
  },
  onlineActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
  },
  onlineInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  onlineDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#fff',
  },
  onlineDotActive: {
    backgroundColor: '#4CAF50',
  },
  onlineText: {
    fontSize: scaleFontSize(12),
    fontWeight: '600',
    color: '#fff',
  },
  mainContent: {
    paddingHorizontal: wp(5),
    paddingTop: moderateScale(20),
    paddingBottom: moderateScale(30),
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: moderateScale(25),
    gap: moderateScale(12),
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIconContainer: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  statValue: {
    fontSize: scaleFontSize(24),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: moderateScale(4),
  },
  statTitle: {
    fontSize: scaleFontSize(12),
    color: '#666',
    textAlign: 'center',
  },
  section: {
    marginBottom: moderateScale(20),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(15),
  },
  sectionTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  viewAllText: {
    fontSize: scaleFontSize(14),
    color: '#FF6B35',
    fontWeight: '600',
  },
  deliveryCard: {
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
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  orderId: {
    fontSize: scaleFontSize(15),
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(10),
  },
  statusText: {
    fontSize: scaleFontSize(11),
    color: '#fff',
    fontWeight: '600',
  },
  deliveryCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(12),
    gap: moderateScale(6),
  },
  customerName: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#333',
  },
  petName: {
    fontSize: scaleFontSize(13),
    color: '#666',
  },
  deliveryRoute: {
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(10),
    padding: moderateScale(12),
    marginBottom: moderateScale(12),
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  routeDivider: {
    paddingLeft: moderateScale(8),
    paddingVertical: moderateScale(4),
  },
  routeText: {
    flex: 1,
    fontSize: scaleFontSize(13),
    color: '#666',
  },
  deliveryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  distanceText: {
    fontSize: scaleFontSize(13),
    color: '#666',
  },
  earningsText: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: moderateScale(40),
  },
  emptyStateText: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: '#666',
    marginTop: moderateScale(15),
  },
  emptyStateSubtext: {
    fontSize: scaleFontSize(13),
    color: '#999',
    marginTop: moderateScale(6),
  },
});
