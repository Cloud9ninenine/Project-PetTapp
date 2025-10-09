import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ImageBackground,
  useWindowDimensions,
  Animated,
  Easing,
  PanResponder,
  Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Location from 'expo-location';
import SearchHeader from "@components/SearchHeader";
import CompleteProfileModal from "@components/CompleteProfileModal";
import { wp, hp, moderateScale, scaleFontSize } from "@utils/responsive";
import apiClient from "../../../config/api";
import { useProfileCompletion } from "../../../hooks/useProfileCompletion";

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  // activeSlide shown to user: 0..n-1
  const [activeSlide, setActiveSlide] = useState(0);
  const [showProfileIncompleteModal, setShowProfileIncompleteModal] = useState(false);
  const [nearbyServices, setNearbyServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [location, setLocation] = useState(null);

  const { isProfileComplete } = useProfileCompletion();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const SLIDE_WIDTH = Math.round(width - moderateScale(32));
  const translateX = useRef(new Animated.Value(0)).current;

  // real carousel images
  const carouselImages = [
    {
      id: 1,
      image: require("@assets/images/serviceimages/Vet Care.png"),
      title: "Wellness Check-up",
      subtitle: "PetCo Clinic",
    },
    {
      id: 2,
      image: require("@assets/images/serviceimages/21.png"),
      title: "Professional Grooming",
      subtitle: "Pet Spa",
    },
    {
      id: 3,
      image: require("@assets/images/serviceimages/22.png"),
      title: "Pet Boarding",
      subtitle: "Pet Hotel",
    },
    {
      id: 4,
      image: require("@assets/images/serviceimages/23.png"),
      title: "Pet Training",
      subtitle: "Training Center",
    },
  ];

  // build extended array: [last, ...images, first] for looping
  const extendedImages = [
    carouselImages[carouselImages.length - 1],
    ...carouselImages,
    carouselImages[0],
  ];

  // internal index points into extendedImages (start at 1 => first real slide)
  const internalIndexRef = useRef(1);
  const [internalIndex, setInternalIndex] = useState(1);

  // autoplay interval ref so we can stop / restart during drag
  const intervalRef = useRef(null);

  // helper to update user-facing activeSlide from internal index
  const syncActiveSlide = (internalIdx) => {
    const n = carouselImages.length;
    // map internalIndex (1..n) -> 0..n-1
    const logical = ((internalIdx - 1) % n + n) % n;
    setActiveSlide(logical);
  };

  // move to extended index (with animation). handles wrap jump after animation.
  const animateToInternalIndex = (toIndex, { animated = true } = {}) => {
    const maxIndex = extendedImages.length - 1;
    if (!animated) {
      translateX.setValue(-toIndex * SLIDE_WIDTH);
      internalIndexRef.current = toIndex;
      setInternalIndex(toIndex);
      syncActiveSlide(toIndex);
      return;
    }

    Animated.timing(translateX, {
      toValue: -toIndex * SLIDE_WIDTH,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      // If we moved to the first cloned slide (index 0) -> jump to real last
      if (toIndex === 0) {
        const jumpTo = carouselImages.length;
        translateX.setValue(-jumpTo * SLIDE_WIDTH);
        internalIndexRef.current = jumpTo;
        setInternalIndex(jumpTo);
        syncActiveSlide(jumpTo);
        return;
      }
      // If we moved to the last cloned slide -> jump to real first
      if (toIndex === maxIndex) {
        const jumpTo = 1;
        translateX.setValue(-jumpTo * SLIDE_WIDTH);
        internalIndexRef.current = jumpTo;
        setInternalIndex(jumpTo);
        syncActiveSlide(jumpTo);
        return;
      }

      // normal case: landed on a real slide
      internalIndexRef.current = toIndex;
      setInternalIndex(toIndex);
      syncActiveSlide(toIndex);
    });
  };

  // autoplay controls
  const startAutoPlay = (ms = 5000) => {
    stopAutoPlay();
    intervalRef.current = setInterval(() => {
      const next = internalIndexRef.current + 1;
      animateToInternalIndex(next);
    }, ms);
  };
  const stopAutoPlay = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Show modal if profile is incomplete
  useEffect(() => {
    if (!isProfileComplete) {
      setShowProfileIncompleteModal(true);
    }
  }, [isProfileComplete]);

  // set initial position and start autoplay
  useEffect(() => {
    // ensure starting at internal index = 1 (first real slide)
    translateX.setValue(-1 * SLIDE_WIDTH);
    internalIndexRef.current = 1;
    setInternalIndex(1);
    syncActiveSlide(1);
    startAutoPlay(5000);
    return () => stopAutoPlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // PanResponder for manual swipes (uses same animateToInternalIndex)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 8,
      onPanResponderGrant: () => {
        // pause autoplay while interacting
        stopAutoPlay();
      },
      onPanResponderMove: (_, gesture) => {
        // drag visually: base position is -internalIndexRef.current * SLIDE_WIDTH
        const base = -internalIndexRef.current * SLIDE_WIDTH;
        translateX.setValue(base + gesture.dx);
      },
      onPanResponderRelease: (_, gesture) => {
        const threshold = SLIDE_WIDTH * 0.2; // swipe threshold (20% width)
        const dx = gesture.dx;
        let target = internalIndexRef.current;

        if (dx < -threshold && internalIndexRef.current < extendedImages.length - 1) {
          target = internalIndexRef.current + 1;
        } else if (dx > threshold && internalIndexRef.current > 0) {
          target = internalIndexRef.current - 1;
        } else {
          target = internalIndexRef.current;
        }

        animateToInternalIndex(target);
        // resume autoplay after a short delay
        setTimeout(() => startAutoPlay(5000), 800);
      },
    })
  ).current;

  // Services + nearby arrays (unchanged)
  const services = [
    {
      id: 1,
      title: "Veterinary",
      icon: require("@assets/images/service_icon/10.png"),
      color: "#FF9B79",
      category: "veterinary",
    },
    {
      id: 2,
      title: "Grooming",
      icon: require("@assets/images/service_icon/11.png"),
      color: "#FF9B79",
      category: "grooming",
    },
    {
      id: 3,
      title: "Boarding",
      icon: require("@assets/images/service_icon/12.png"),
      color: "#FF9B79",
      category: "boarding",
    },
    {
      id: 4,
      title: "Delivery",
      icon: require("@assets/images/service_icon/13.png"),
      color: "#FF9B79",
      category: "other",
    },
  ];

  // Fetch user location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const currentLocation = await Location.getCurrentPositionAsync({});
          setLocation({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          });
        }
      } catch (error) {
        console.error('Error getting location:', error);
      }
    })();
  }, []);

  // Fetch nearby services from API
  useEffect(() => {
    const fetchNearbyServices = async () => {
      try {
        setLoadingServices(true);
        const params = {
          limit: 6, // Fetch 6 services
        };

        // Add location if available
        if (location) {
          params.latitude = location.latitude;
          params.longitude = location.longitude;
          params.radius = 10; // 10km radius
        }

        const response = await apiClient.get('/services', { params });

        if (response.data.success) {
          setNearbyServices(response.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching nearby services:', error);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchNearbyServices();
  }, [location]);

  const handleServicePress = (service) => {
    // Check if profile is complete before allowing access
    if (!isProfileComplete) {
      setShowProfileIncompleteModal(true);
      return;
    }
    // Navigate to services page with category filter
    router.push({
      pathname: '/(user)/(tabs)/services',
      params: {
        category: service.category,
      },
    });
  };

  const handleNearbyServicePress = (service) => {
    // Check if profile is complete before allowing access
    if (!isProfileComplete) {
      setShowProfileIncompleteModal(true);
      return;
    }
    router.push({
      pathname: 'home/nearby-service-map',
      params: {
        id: service._id,
        name: service.name,
        type: service.category || service.type,
        rating: service.rating || 0,
        address: service.location?.address || service.address || 'Address not available',
        distance: service.distance || 'N/A',
        latitude: service.location?.coordinates?.[1] || 0,
        longitude: service.location?.coordinates?.[0] || 0,
      },
    });
  };

  

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={moderateScale(12)} color="#ff9b79" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Ionicons key={i} name="star-half" size={moderateScale(12)} color="#ff9b79" />
        );
      } else {
        stars.push(
          <Ionicons key={i} name="star-outline" size={moderateScale(12)} color="#E0E0E0" />
        );
      }
    }
    return stars;
  };

  return (
    <SafeAreaView style={styles.container}>
      <SearchHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onNotifPress={() => router.push("/(user)/(tabs)/notification")}
      />
      <ImageBackground
        source={require("@assets/images/PetTapp pattern.png")}
        style={styles.backgroundimg}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="repeat"
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.mainContent}>
            {/* Featured Carousel */}
            <View style={styles.featuredCard} {...panResponder.panHandlers}>
              <Animated.View
                style={{
                  flexDirection: "row",
                  width: SLIDE_WIDTH * extendedImages.length,
                  transform: [{ translateX }],
                }}
              >
                {extendedImages.map((item, idx) => (
                  <View
                    key={`slide-${idx}-${item.id}`}
                    style={[
                      styles.carouselSlide,
                      { width: SLIDE_WIDTH }
                    ]}
                  >
                    <Image source={item.image} style={styles.featuredImage} resizeMode="cover" />
                    <View style={styles.carouselTextContainer}>
                      <Text style={styles.featuredTitle}>{item.title}</Text>
                      <Text style={styles.featuredSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                ))}
              </Animated.View>

              {/* Pagination */}
              <View style={styles.pagination}>
                {carouselImages.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === activeSlide && styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Services Grid */}
            <View style={styles.servicesGrid}>
              {services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceCard}
                  onPress={() => handleServicePress(service)}
                >
                  <View
                    style={[
                      styles.serviceIconContainer,
                      { backgroundColor: service.color },
                    ]}
                  >
                    <Image source={service.icon} style={styles.serviceIcon} />
                  </View>
                  <Text style={styles.serviceTitle}>{service.title}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Nearby Services Title */}
            <Text style={styles.sectionTitle}>Nearby Services</Text>

            {/* Nearby Services Grid */}
            {loadingServices ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading nearby services...</Text>
              </View>
            ) : nearbyServices.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="location-outline" size={moderateScale(48)} color="#ccc" />
                <Text style={styles.emptyText}>No nearby services found</Text>
                <Text style={styles.emptySubtext}>Try adjusting your location or check back later</Text>
              </View>
            ) : (
              <View style={styles.nearbyGrid}>
                {nearbyServices.slice(0, 3).map((service) => (
                  <TouchableOpacity
                    key={service._id}
                    style={styles.nearbyCardWrapper}
                    onPress={() => handleNearbyServicePress(service)}
                  >
                    <View style={styles.nearbyCard}>
                      <View style={styles.nearbyImageContainer}>
                        <Image
                          source={service.imageUrl ? { uri: service.imageUrl } : require("@assets/images/serviceimages/18.png")}
                          style={styles.nearbyImage}
                        />
                      </View>
                    </View>
                    <View style={styles.nearbyCardInfo}>
                      <Text style={styles.nearbyName} numberOfLines={2}>{service.name}</Text>
                      {service.rating && (
                        <View style={styles.nearbyStarsContainer}>
                          {renderStars(service.rating)}
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </ImageBackground>

      {/* Profile Incomplete Modal */}
      <CompleteProfileModal
        visible={showProfileIncompleteModal}
        onClose={() => setShowProfileIncompleteModal(false)}
        message="Please complete your profile information before availing services. You need to provide your first name, last name, address, and contact number."
      />
    </SafeAreaView>
  );
}

// ===================== styles =====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  backgroundimg: { flex: 1 },
  backgroundImageStyle: { opacity: 0.1 },
  mainContent: {
    alignItems: "center",
    paddingHorizontal: wp(4),
    paddingBottom: moderateScale(20),
  },
  featuredCard: {
    position: "relative",
    height: hp(28),
    width: "100%",
    marginTop: moderateScale(20),
    marginBottom: moderateScale(30),
    overflow: "hidden",
  },
  carouselSlide: {
    height: hp(28),
    borderRadius: moderateScale(16),
    overflow: "hidden",
    marginHorizontal: 0,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
  },
  carouselTextContainer: {
    position: "absolute",
    bottom: moderateScale(16),
    left: moderateScale(16),
    right: moderateScale(16),
  },
  featuredTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: "bold",
    color: "#fff",
    marginBottom: moderateScale(4),
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  featuredSubtitle: {
    fontSize: scaleFontSize(14),
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  pagination: {
    position: "absolute",
    bottom: moderateScale(12),
    alignSelf: "center",
    flexDirection: "row",
    gap: moderateScale(6),
  },
  paginationDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  paginationDotActive: {
    backgroundColor: "#fff",
    width: moderateScale(24),
  },
  servicesGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: moderateScale(15),
  },
  serviceCard: {
    alignItems: "center",
    flex: 1,
  },
  serviceIconContainer: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(15),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: moderateScale(8),
  },
  serviceIcon: {
    width: moderateScale(30),
    height: moderateScale(30),
    tintColor: "#fff",
  },
  serviceTitle: {
    fontSize: scaleFontSize(12),
    color: "#333",
    textAlign: "center",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: scaleFontSize(30),
    fontFamily: "SFProBold",
    color: "#1C86FF",
    textAlign: "center",
  },
  nearbyGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: moderateScale(10),
  },
  nearbyCardWrapper: {
    flex: 1,
  },
  nearbyCard: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    borderWidth: 2,
    borderColor: "#1C86FF",
    overflow: "hidden",
    height: hp(18),
  },
  nearbyImageContainer: {
    flex: 1,
    width: "100%",
  },
  nearbyImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  nearbyCardInfo: {
    backgroundColor: "transparent",
    paddingTop: moderateScale(8),
    alignItems: "center",
  },
  nearbyName: {
    fontSize: scaleFontSize(13),
    fontWeight: "600",
    color: "#1C86FF",
    textAlign: "center",
    marginBottom: moderateScale(4),
  },
  nearbyStarsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: moderateScale(2),
  },
  loadingContainer: {
    width: "100%",
    paddingVertical: moderateScale(40),
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: scaleFontSize(14),
    color: "#1C86FF",
    fontWeight: "600",
  },
  emptyContainer: {
    width: "100%",
    paddingVertical: moderateScale(40),
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: scaleFontSize(16),
    color: "#666",
    fontWeight: "600",
    marginTop: moderateScale(12),
  },
  emptySubtext: {
    fontSize: scaleFontSize(12),
    color: "#999",
    marginTop: moderateScale(4),
    textAlign: "center",
  },
});
