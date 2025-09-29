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
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import SearchHeader from "@components/SearchHeader";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prevSlide) => {
        const nextSlide = (prevSlide + 1) % carouselImages.length;
        const offset = nextSlide * (width - 32);
        carouselRef.current?.scrollToOffset({
          offset,
          animated: true,
        });
        return nextSlide;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const carouselImages = [
    {
      id: 1,
      image: require("@assets/images/serviceimages/Vet Care.png"),
      title: "Wellness Check-up",
      subtitle: "PetCo Clinic",
      rating: 4.9,
    },
    {
      id: 2,
      image: require("@assets/images/serviceimages/21.png"),
      title: "Professional Grooming",
      subtitle: "Pet Spa",
      rating: 4.8,
    },
    {
      id: 3,
      image: require("@assets/images/serviceimages/22.png"),
      title: "Pet Boarding",
      subtitle: "Pet Hotel",
      rating: 4.7,
    },
    {
      id: 4,
      image: require("@assets/images/serviceimages/23.png"),
      title: "Pet Training",
      subtitle: "Training Center",
      rating: 4.9,
    },
  ];

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
    if (service.route) {
      router.push(service.route);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={12} color="#ff9b79" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Ionicons key={i} name="star-half" size={12} color="#ff9b79" />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={12} color="#E0E0E0" />);
      }
    }
    return stars;
  };

  const onScroll = (event) => {
    const slideSize = width - 32;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    setActiveSlide(index);
  };

  const onScrollBeginDrag = () => {
    // User is manually scrolling, so we don't interfere
  };

  const renderCarouselItem = ({ item }) => (
    <View style={styles.carouselSlide}>
      <Image source={item.image} style={styles.featuredImage} />
      <View style={styles.carouselTextContainer}>
        <Text style={styles.featuredTitle}>{item.title}</Text>
        <Text style={styles.featuredSubtitle}>{item.subtitle}</Text>
      </View>
    </View>
  );

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
          <View style={styles.featuredCard}>
            <Animated.FlatList
              ref={carouselRef}
              data={carouselImages}
              renderItem={renderCarouselItem}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: new Animated.Value(0) } } }],
                {
                  useNativeDriver: true,
                  listener: onScroll,
                }
              )}
              onScrollBeginDrag={onScrollBeginDrag}
              scrollEventThrottle={16}
              snapToInterval={width - 32}
              snapToAlignment="center"
              decelerationRate={0.1}
              contentContainerStyle={styles.carouselContent}
            />
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
    paddingBottom: 100,
  },
  featuredCard: {
    position: "relative",
    height: 240,
    width: "100%",
    marginTop: 20,
    marginBottom: 30,
  },
  carouselContent: {
    paddingHorizontal: 0,
  },
  carouselSlide: {
    width: width - 32,
    height: 240,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    marginHorizontal: 0,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
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
    fontFamily:"SFProBold",
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
    height: "40%",
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
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  ratingText: {
    fontSize: 10,
    color: "#666",
    marginLeft: 4,
    fontWeight: "500",
  },
});
