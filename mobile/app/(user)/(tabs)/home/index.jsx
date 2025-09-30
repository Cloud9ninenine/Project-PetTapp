import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  ImageBackground,
  Dimensions,
  Animated,
  Easing,
  PanResponder,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import SearchHeader from "@components/SearchHeader";

const { width } = Dimensions.get("window");
// Use a rounded integer slide width to avoid sub-pixel gaps
const SLIDE_WIDTH = Math.round(width - 32);

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  // activeSlide shown to user: 0..n-1
  const [activeSlide, setActiveSlide] = useState(0);

  const router = useRouter();
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
      duration: 700,
      easing: Easing.inOut(Easing.ease),
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
      route: "home/veterinary-services",
    },
    {
      id: 2,
      title: "Grooming",
      icon: require("@assets/images/service_icon/11.png"),
      color: "#FF9B79",
      route: "grooming-services",
    },
    {
      id: 3,
      title: "Boarding",
      icon: require("@assets/images/service_icon/12.png"),
      color: "#FF9B79",
      route: "boarding-services",
    },
    {
      id: 4,
      title: "Delivery",
      icon: require("@assets/images/service_icon/13.png"),
      color: "#FF9B79",
      route: "delivery-services",
    },
  ];

  const nearbyServices = [
    {
      id: 1,
      name: "PetCity Daycare",
      image: require("@assets/images/serviceimages/16.png"),
      rating: 4.8,
    },
    {
      id: 2,
      name: "Prinz Aviary",
      image: require("@assets/images/serviceimages/14.png"),
      rating: 4.9,
    },
    {
      id: 3,
      name: "Petkeeper Co.",
      image: require("@assets/images/serviceimages/15.png"),
      rating: 4.7,
    },
  ];

  const handleServicePress = (service) => {
    if (service.route) router.push(service.route);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={12} color="#ff9b79" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Ionicons key={i} name="star-half" size={12} color="#ff9b79" />
        );
      } else {
        stars.push(
          <Ionicons key={i} name="star-outline" size={12} color="#E0E0E0" />
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
        onNotifPress={() => console.log("🔔 Notification tapped")}
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
                  <View key={`slide-${idx}-${item.id}`} style={styles.carouselSlide}>
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
            <View style={styles.nearbyGrid}>
              {nearbyServices.map((service) => (
                <View key={service.id} style={styles.nearbyCardWrapper}>
                  <View style={styles.nearbyCard}>
                    <View style={styles.nearbyImageContainer}>
                      <Image source={service.image} style={styles.nearbyImage} />
                    </View>
                  </View>
                  <View style={styles.nearbyCardInfo}>
                    <Text style={styles.nearbyName}>{service.name}</Text>
                    <View style={styles.nearbyStarsContainer}>
                      {renderStars(service.rating)}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

// ===================== styles (unchanged except kept for context) =====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  backgroundimg: { flex: 1 },
  backgroundImageStyle: { opacity: 0.1 },
  mainContent: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  featuredCard: {
    position: "relative",
    height: 240,
    width: "100%",
    marginTop: 20,
    marginBottom: 30,
    overflow: "hidden",
  },
  carouselSlide: {
    width: SLIDE_WIDTH,
    height: 240,
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 0,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
  },
  carouselTextContainer: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  featuredSubtitle: {
    fontSize: 14,
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  pagination: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  paginationDotActive: {
    backgroundColor: "#fff",
    width: 24,
  },
  servicesGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 15,
  },
  serviceCard: {
    alignItems: "center",
    flex: 1,
  },
  serviceIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  serviceIcon: {
    width: 30,
    height: 30,
    tintColor: "#fff",
  },
  serviceTitle: {
    fontSize: 12,
    color: "#333",
    textAlign: "center",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 30,
    fontFamily: "SFProBold",
    color: "#1C86FF",
    textAlign: "center",
  },
  nearbyGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 10,
  },
  nearbyCardWrapper: {
    flex: 1,
  },
  nearbyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#1C86FF",
    overflow: "hidden",
    height: 150,
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
    paddingTop: 8,
    alignItems: "center",
  },
  nearbyName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1C86FF",
    textAlign: "center",
    marginBottom: 4,
  },
  nearbyStarsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 2,
  },
});
