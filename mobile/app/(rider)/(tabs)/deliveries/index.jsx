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

export default function DeliveriesScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('active');

  const deliveries = {
    active: [
      {
        id: 1,
        orderId: '#DEL-001',
        customerName: 'Sarah Johnson',
        petName: 'Max',
        pickupAddress: 'PetStore Central, Quezon City',
        deliveryAddress: '123 Main St, Quezon City',
        status: 'picked_up',
        earnings: '₱80',
        distance: '2.5 km',
        time: '10:30 AM',
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
        time: '11:00 AM',
      },
    ],
    completed: [
      {
        id: 3,
        orderId: '#DEL-098',
        customerName: 'Emma Garcia',
        petName: 'Charlie',
        pickupAddress: 'Pet Paradise Store, QC',
        deliveryAddress: '789 Elm St, Quezon City',
        status: 'completed',
        earnings: '₱80',
        distance: '1.8 km',
        time: '9:45 AM',
        completedTime: 'Oct 8, 2025 • 10:15 AM',
      },
      {
        id: 4,
        orderId: '#DEL-097',
        customerName: 'David Martinez',
        petName: 'Whiskers',
        pickupAddress: 'Furry Friends Shop, QC',
        deliveryAddress: '321 Pine Ave, Quezon City',
        status: 'completed',
        earnings: '₱80',
        distance: '2.1 km',
        time: '8:30 AM',
        completedTime: 'Oct 8, 2025 • 9:00 AM',
      },
    ],
  };

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

  const renderDeliveryCard = (delivery) => (
    <TouchableOpacity
      key={delivery.id}
      style={styles.deliveryCard}
      onPress={() => router.push({
        pathname: './delivery-details',
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
        <View style={styles.footerLeft}>
          <View style={styles.distanceContainer}>
            <Ionicons name="navigate" size={moderateScale(16)} color="#666" />
            <Text style={styles.distanceText}>{delivery.distance}</Text>
          </View>
          <View style={styles.timeContainer}>
            <Ionicons name="time" size={moderateScale(16)} color="#666" />
            <Text style={styles.timeText}>{delivery.time}</Text>
          </View>
        </View>
        <Text style={styles.earningsText}>{delivery.earnings}</Text>
      </View>

      {delivery.completedTime && (
        <View style={styles.completedTimeContainer}>
          <Ionicons name="checkmark-circle" size={moderateScale(14)} color="#4CAF50" />
          <Text style={styles.completedTimeText}>{delivery.completedTime}</Text>
        </View>
      )}
    </TouchableOpacity>
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
        title="My Deliveries"
        showBack={false}
      />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'active' && styles.tabActive]}
          onPress={() => setSelectedTab('active')}
        >
          <Text style={[styles.tabText, selectedTab === 'active' && styles.tabTextActive]}>
            Active ({deliveries.active.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'completed' && styles.tabActive]}
          onPress={() => setSelectedTab('completed')}
        >
          <Text style={[styles.tabText, selectedTab === 'completed' && styles.tabTextActive]}>
            Completed ({deliveries.completed.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {deliveries[selectedTab].length > 0 ? (
          deliveries[selectedTab].map(renderDeliveryCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="bicycle-outline" size={moderateScale(80)} color="#ccc" />
            <Text style={styles.emptyStateText}>
              {selectedTab === 'active' ? 'No active deliveries' : 'No completed deliveries'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {selectedTab === 'active'
                ? 'New deliveries will appear here'
                : 'Your completed deliveries will show here'}
            </Text>
          </View>
        )}
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: moderateScale(10),
  },
  tab: {
    flex: 1,
    paddingVertical: moderateScale(10),
    alignItems: 'center',
    borderRadius: moderateScale(8),
    backgroundColor: '#F8F9FA',
  },
  tabActive: {
    backgroundColor: '#FFE5DB',
  },
  tabText: {
    fontSize: scaleFontSize(14),
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FF6B35',
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: wp(5),
    paddingVertical: moderateScale(15),
    paddingBottom: moderateScale(100),
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
  footerLeft: {
    flexDirection: 'row',
    gap: moderateScale(15),
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
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  timeText: {
    fontSize: scaleFontSize(13),
    color: '#666',
  },
  earningsText: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  completedTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    marginTop: moderateScale(10),
    paddingTop: moderateScale(10),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  completedTimeText: {
    fontSize: scaleFontSize(12),
    color: '#4CAF50',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: moderateScale(60),
  },
  emptyStateText: {
    fontSize: scaleFontSize(18),
    fontWeight: '600',
    color: '#666',
    marginTop: moderateScale(20),
  },
  emptyStateSubtext: {
    fontSize: scaleFontSize(14),
    color: '#999',
    textAlign: 'center',
    marginTop: moderateScale(8),
    paddingHorizontal: wp(10),
  },
});
