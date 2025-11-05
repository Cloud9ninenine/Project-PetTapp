import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { moderateScale } from '@utils/responsive';

// Base Skeleton component with shimmer animation
export const Skeleton = ({ width, height, borderRadius = moderateScale(8), style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Calendar/Appointments Skeleton
export const CalendarSkeleton = () => {
  return (
    <View>
      {/* Calendar Skeleton */}
      <Skeleton width="100%" height={moderateScale(350)} borderRadius={moderateScale(12)} style={styles.calendarSkeleton} />
    </View>
  );
};

// Nearby Services Grid Skeleton
export const NearbyServicesGridSkeleton = () => {
  return (
    <View style={styles.servicesGrid}>
      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.serviceGridItem}>
          <Skeleton width="100%" height={moderateScale(140)} borderRadius={moderateScale(12)} />
          <Skeleton width="80%" height={moderateScale(16)} style={styles.serviceNameSkeleton} />
          <Skeleton width="60%" height={moderateScale(12)} style={styles.serviceRatingSkeleton} />
        </View>
      ))}
    </View>
  );
};

// Featured Business Grid Skeleton
export const FeaturedBusinessGridSkeleton = () => {
  return (
    <View style={styles.servicesGrid}>
      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.serviceGridItem}>
          <Skeleton width="100%" height={moderateScale(140)} borderRadius={moderateScale(12)} />
          <Skeleton width="80%" height={moderateScale(16)} style={styles.serviceNameSkeleton} />
          <Skeleton width="60%" height={moderateScale(12)} style={styles.serviceRatingSkeleton} />
        </View>
      ))}
    </View>
  );
};

// Home Screen Skeleton - Calendar + Cards
export const HomeScreenSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Welcome Text Skeleton */}
      <Skeleton width="60%" height={moderateScale(30)} style={styles.welcomeSkeleton} />

      {/* Carousel Skeleton */}
      <Skeleton width="100%" height={moderateScale(200)} borderRadius={moderateScale(16)} style={styles.carouselSkeleton} />

      {/* Appointments Section Title */}
      <View style={styles.sectionHeader}>
        <Skeleton width="50%" height={moderateScale(24)} />
        <Skeleton width="20%" height={moderateScale(20)} />
      </View>

      {/* Calendar Skeleton */}
      <CalendarSkeleton />

      {/* Categories Section */}
      <Skeleton width="60%" height={moderateScale(24)} style={styles.sectionTitleSkeleton} />
      <View style={styles.categoriesRow}>
        {[1, 2, 3, 4, 5].map((item) => (
          <View key={item} style={styles.categoryItem}>
            <Skeleton width={moderateScale(65)} height={moderateScale(65)} borderRadius={moderateScale(16)} />
            <Skeleton width={moderateScale(50)} height={moderateScale(12)} style={styles.categoryTextSkeleton} />
          </View>
        ))}
      </View>

      {/* Nearby Services Section */}
      <View style={styles.sectionHeader}>
        <Skeleton width="50%" height={moderateScale(24)} />
        <Skeleton width="20%" height={moderateScale(20)} />
      </View>
      <NearbyServicesGridSkeleton />
    </View>
  );
};

// Booking/Appointments List Skeleton
export const BookingListSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Booking Cards Skeleton */}
      {[1, 2, 3, 4, 5].map((item) => (
        <View key={item} style={styles.bookingCard}>
          <Skeleton width={moderateScale(70)} height={moderateScale(70)} borderRadius={moderateScale(35)} />
          <View style={styles.bookingInfo}>
            <Skeleton width="70%" height={moderateScale(16)} style={styles.bookingTitle} />
            <Skeleton width="50%" height={moderateScale(14)} style={styles.bookingSubtitle} />
            <Skeleton width="60%" height={moderateScale(12)} style={styles.bookingDate} />
          </View>
          <Skeleton width={moderateScale(70)} height={moderateScale(24)} borderRadius={moderateScale(12)} />
        </View>
      ))}
    </View>
  );
};

// Services List Skeleton
export const ServicesListSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Service Cards Skeleton */}
      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.serviceCard}>
          <Skeleton width="100%" height={moderateScale(180)} borderRadius={moderateScale(16)} />
          <View style={styles.serviceCardInfo}>
            <Skeleton width="80%" height={moderateScale(18)} style={styles.serviceName} />
            <Skeleton width="60%" height={moderateScale(14)} style={styles.businessName} />
            <Skeleton width="90%" height={moderateScale(12)} style={styles.serviceDescription} />
            <View style={styles.serviceFooter}>
              <Skeleton width="30%" height={moderateScale(18)} />
              <Skeleton width="25%" height={moderateScale(14)} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

// Messages List Skeleton
export const MessagesListSkeleton = () => {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <View key={item} style={styles.messageCard}>
          <Skeleton width={moderateScale(50)} height={moderateScale(50)} borderRadius={moderateScale(25)} />
          <View style={styles.messageInfo}>
            <Skeleton width="70%" height={moderateScale(16)} style={styles.messageName} />
            <Skeleton width="90%" height={moderateScale(14)} style={styles.messageText} />
            <Skeleton width="40%" height={moderateScale(12)} style={styles.messageTime} />
          </View>
        </View>
      ))}
    </View>
  );
};

// My Pets Grid Skeleton (2-Column Grid with Image Fill)
export const MyPetsGridSkeleton = () => {
  return (
    <View style={styles.petsSkeletonContainer}>
      <View style={styles.petsGridSkeleton}>
        {/* Add Pet Card Skeleton */}
        <View style={styles.addPetCardGridSkeleton}>
          <Skeleton width={moderateScale(60)} height={moderateScale(60)} borderRadius={moderateScale(30)} style={styles.addIconSkeleton} />
          <Skeleton width={moderateScale(100)} height={moderateScale(16)} />
        </View>

        {/* Pet Cards Skeleton - Image Fill with Text Overlay */}
        {[1, 2, 3, 4, 5].map((item) => (
          <View key={item} style={styles.petCardImageFillSkeleton}>
            {/* Full Image Background */}
            <Skeleton width="100%" height="100%" borderRadius={0} style={styles.petImageFullSkeleton} />

            {/* Dark Gradient Overlay at Bottom */}
            <View style={styles.petCardGradientSkeleton} />

            {/* Text Overlay at Bottom - Compact 2 Lines */}
            <View style={styles.petInfoOverlaySkeleton}>
              <Skeleton width="75%" height={moderateScale(14)} style={styles.petNameOverlaySkeleton} />
              <View style={styles.petDetailsRowSkeleton}>
                <Skeleton width={moderateScale(100)} height={moderateScale(11)} />
                <Skeleton width={moderateScale(20)} height={moderateScale(20)} borderRadius={moderateScale(10)} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

// My Services List Skeleton (for business)
export const MyServicesListSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Search Bar Skeleton */}
      <Skeleton width="100%" height={moderateScale(50)} borderRadius={moderateScale(12)} style={styles.searchBarSkeleton} />

      {/* Filter Chips Skeleton */}
      <View style={styles.filterChipsRow}>
        {[1, 2, 3, 4].map((item) => (
          <Skeleton key={item} width={moderateScale(90)} height={moderateScale(36)} borderRadius={moderateScale(20)} style={styles.filterChip} />
        ))}
      </View>

      {/* Service Cards Skeleton */}
      {[1, 2, 3, 4].map((item) => (
        <View key={item} style={styles.serviceRowCard}>
          <Skeleton width={moderateScale(55)} height={moderateScale(55)} borderRadius={moderateScale(28)} />
          <View style={styles.serviceRowInfo}>
            <Skeleton width="70%" height={moderateScale(16)} style={styles.serviceName} />
            <Skeleton width="50%" height={moderateScale(13)} style={styles.serviceCategory} />
            <Skeleton width="40%" height={moderateScale(14)} style={styles.servicePrice} />
          </View>
          <Skeleton width={moderateScale(70)} height={moderateScale(28)} borderRadius={moderateScale(12)} />
        </View>
      ))}
    </View>
  );
};

// Business Dashboard Skeleton
export const BusinessDashboardSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Metrics Grid Skeleton */}
      <View style={styles.metricsGrid}>
        {[1, 2, 3, 4].map((item) => (
          <View key={item} style={styles.metricCard}>
            <Skeleton width={moderateScale(45)} height={moderateScale(45)} borderRadius={moderateScale(22.5)} style={styles.metricIcon} />
            <Skeleton width="70%" height={moderateScale(20)} style={styles.metricValue} />
            <Skeleton width="90%" height={moderateScale(12)} style={styles.metricTitle} />
          </View>
        ))}
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Skeleton width="50%" height={moderateScale(24)} />
        <Skeleton width="20%" height={moderateScale(20)} />
      </View>

      {/* Pending Bookings List Skeleton */}
      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.bookingCard}>
          <Skeleton width={moderateScale(50)} height={moderateScale(50)} borderRadius={moderateScale(25)} />
          <View style={styles.bookingInfo}>
            <Skeleton width="70%" height={moderateScale(15)} style={styles.bookingTitle} />
            <Skeleton width="50%" height={moderateScale(13)} style={styles.bookingSubtitle} />
            <Skeleton width="40%" height={moderateScale(12)} style={styles.bookingDate} />
          </View>
          <Skeleton width={moderateScale(60)} height={moderateScale(28)} borderRadius={moderateScale(12)} />
        </View>
      ))}

      {/* Another Section */}
      <View style={styles.sectionHeader}>
        <Skeleton width="50%" height={moderateScale(24)} />
        <Skeleton width="20%" height={moderateScale(20)} />
      </View>

      {/* Services List Skeleton */}
      {[1, 2].map((item) => (
        <View key={item} style={styles.serviceRowCard}>
          <Skeleton width={moderateScale(55)} height={moderateScale(55)} borderRadius={moderateScale(28)} />
          <View style={styles.serviceRowInfo}>
            <Skeleton width="70%" height={moderateScale(16)} style={styles.serviceName} />
            <Skeleton width="50%" height={moderateScale(13)} style={styles.serviceCategory} />
            <Skeleton width="40%" height={moderateScale(14)} style={styles.servicePrice} />
          </View>
          <Skeleton width={moderateScale(70)} height={moderateScale(28)} borderRadius={moderateScale(12)} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E1E9EE',
  },
  container: {
    flex: 1,
    padding: moderateScale(16),
  },
  welcomeSkeleton: {
    marginBottom: moderateScale(15),
  },
  carouselSkeleton: {
    marginBottom: moderateScale(15),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(15),
    marginTop: moderateScale(10),
  },
  calendarSkeleton: {
    marginBottom: moderateScale(15),
  },
  sectionTitleSkeleton: {
    marginBottom: moderateScale(18),
    marginTop: moderateScale(5),
  },
  categoriesRow: {
    flexDirection: 'row',
    marginBottom: moderateScale(20),
    gap: moderateScale(12),
  },
  categoryItem: {
    alignItems: 'center',
  },
  categoryTextSkeleton: {
    marginTop: moderateScale(8),
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: moderateScale(10),
    marginBottom: moderateScale(20),
  },
  serviceGridItem: {
    width: '31%',
  },
  serviceNameSkeleton: {
    marginTop: moderateScale(8),
  },
  serviceRatingSkeleton: {
    marginTop: moderateScale(4),
  },
  searchBarSkeleton: {
    marginBottom: moderateScale(15),
  },
  filterChipsRow: {
    flexDirection: 'row',
    marginBottom: moderateScale(15),
    gap: moderateScale(8),
  },
  filterChip: {
    marginRight: moderateScale(4),
  },
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: moderateScale(10),
    padding: moderateScale(15),
    marginBottom: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E1E9EE',
  },
  bookingInfo: {
    flex: 1,
    marginLeft: moderateScale(12),
  },
  bookingTitle: {
    marginBottom: moderateScale(4),
  },
  bookingSubtitle: {
    marginBottom: moderateScale(4),
  },
  bookingDate: {
    marginTop: moderateScale(2),
  },
  searchWithLocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(15),
    gap: moderateScale(10),
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    marginBottom: moderateScale(16),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  serviceCardInfo: {
    padding: moderateScale(16),
  },
  serviceName: {
    marginBottom: moderateScale(6),
  },
  businessName: {
    marginBottom: moderateScale(8),
  },
  serviceDescription: {
    marginBottom: moderateScale(12),
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: moderateScale(30),
    gap: moderateScale(10),
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: moderateScale(14),
    padding: moderateScale(14),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricIcon: {
    marginBottom: moderateScale(8),
  },
  metricValue: {
    marginBottom: moderateScale(4),
  },
  metricTitle: {
    marginTop: moderateScale(2),
  },
  serviceRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    marginBottom: moderateScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  serviceRowInfo: {
    flex: 1,
    marginLeft: moderateScale(12),
  },
  serviceCategory: {
    marginTop: moderateScale(4),
  },
  servicePrice: {
    marginTop: moderateScale(4),
  },
  petsSkeletonContainer: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(20),
  },
  petsGridSkeleton: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: moderateScale(12),
  },
  addPetCardGridSkeleton: {
    backgroundColor: '#E3F2FD',
    width: '48%',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: moderateScale(180),
    borderWidth: 2,
    borderColor: '#D0E8FF',
    marginBottom: moderateScale(8),
  },
  addIconSkeleton: {
    marginBottom: moderateScale(12),
  },
  petCardImageFillSkeleton: {
    width: '48%',
    height: moderateScale(200),
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: moderateScale(8),
  },
  petImageFullSkeleton: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  petCardGradientSkeleton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  petInfoOverlaySkeleton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: moderateScale(8),
    paddingBottom: moderateScale(10),
    alignItems: 'center',
  },
  petNameOverlaySkeleton: {
    marginBottom: moderateScale(4),
  },
  petDetailsRowSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    marginBottom: moderateScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  messageInfo: {
    flex: 1,
    marginLeft: moderateScale(12),
  },
  messageName: {
    marginBottom: moderateScale(6),
  },
  messageText: {
    marginBottom: moderateScale(4),
  },
  messageTime: {
    marginTop: moderateScale(4),
  },
});
