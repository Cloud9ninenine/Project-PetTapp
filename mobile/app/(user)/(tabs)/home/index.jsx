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
  ActivityIndicator,
  FlatList,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from 'react-native-calendars';
import SearchHeader from "@components/SearchHeader";
import CompleteProfileModal from "@components/CompleteProfileModal";
import { wp, hp, moderateScale, scaleFontSize } from "@utils/responsive";
import { useProfileCompletion } from "../../../_hooks/useProfileCompletion";
import { fetchCarouselServices, fetchNearbyServices } from "@services/api/serviceService";
import { fetchUserBookings } from "@services/api/bookingService";
import apiClient from "@config/api";
import { getUserLocation } from "@services/locationService";
import { formatPrice } from "@utils/formatters";
import { getServiceCategoryIcon, renderStars, getDefaultCarouselImages } from "@utils/serviceHelpers";
import { isBusinessOpen } from "@utils/businessHelpers";

export default function HomeScreen() {
  // activeSlide shown to user: 0..n-1
  const [activeSlide, setActiveSlide] = useState(0);
  const [showProfileIncompleteModal, setShowProfileIncompleteModal] = useState(false);
  const [nearbyServices, setNearbyServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [location, setLocation] = useState(null);
  const [featuredBusinesses, setFeaturedBusinesses] = useState([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [userName, setUserName] = useState('');

  // Appointments states
  const [allAppointments, setAllAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

  // Carousel states
  const [carouselImages, setCarouselImages] = useState([]);
  const [loadingCarousel, setLoadingCarousel] = useState(true);

  const { isProfileComplete } = useProfileCompletion();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const SLIDE_WIDTH = Math.round(width - moderateScale(32));
  const translateX = useRef(new Animated.Value(0)).current;

  // Default carousel fallback images
  const defaultCarouselImages = getDefaultCarouselImages();

  // build extended array: [last, ...images, first] for looping
  const imagesToUse = carouselImages.length > 0 ? carouselImages : defaultCarouselImages;
  const extendedImages = [
    imagesToUse[imagesToUse.length - 1],
    ...imagesToUse,
    imagesToUse[0],
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

    // Proper cleanup: clear interval when component unmounts
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
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

  // Services categories array (limited to 5 categories)
  const services = [
    {
      id: 1,
      title: "Veterinary",
      icon: require("@assets/images/service_icon/10.png"),
      color: "#FF6B6B",
      category: "veterinary",
    },
    {
      id: 2,
      title: "Grooming",
      icon: require("@assets/images/service_icon/11.png"),
      color: "#4ECDC4",
      category: "grooming",
    },
    {
      id: 3,
      title: "Accommodation",
      icon: require("@assets/images/service_icon/12.png"),
      color: "#95E1D3",
      category: "accommodation",
    },
    {
      id: 4,
      title: "Transport",
      icon: require("@assets/images/service_icon/13.png"),
      color: "#FFD93D",
      category: "transport",
    },
    {
      id: 5,
      title: "Pet Supplies",
      icon: require("@assets/images/service_icon/14.png"),
      color: "#6C5CE7",
      category: "pet-supplies",
    },
  ];

  // Fetch user location
  useEffect(() => {
    (async () => {
      const userLocation = await getUserLocation();
      if (userLocation) {
        setLocation(userLocation);
      }
    })();
  }, []);

  // Fetch carousel images from different service categories and nearby services
  useEffect(() => {
    const loadCarouselServices = async () => {
      try {
        setLoadingCarousel(true);
        const carouselData = await fetchCarouselServices(location);

        // If we have at least 2 services from API, use them. Otherwise use defaults
        if (carouselData.length >= 2) {
          setCarouselImages(carouselData);
        } else {
          setCarouselImages(defaultCarouselImages);
        }
      } catch (error) {
        console.error('Error fetching carousel services:', error);
        setCarouselImages(defaultCarouselImages);
      } finally {
        setLoadingCarousel(false);
      }
    };

    loadCarouselServices();
  }, [location]);

  // Fetch nearby services from API
  useEffect(() => {
    let isMounted = true;

    const loadNearbyServices = async () => {
      try {
        setLoadingServices(true);
        // First try to get nearby services with location
        let services = await fetchNearbyServices(location, 10, 3);

        // If we get less than 3 services, fetch more without strict location filter
        if (services.length < 3) {
          const response = await apiClient.get('/services', {
            params: {
              page: 1,
              limit: 3,
              sort: '-createdAt',
            }
          });

          if (response.data && response.data.success) {
            services = response.data.data || [];
          }
        }

        // Only update state if component is still mounted
        if (isMounted) {
          // Display maximum 3 services, prioritizing nearest if location available
          setNearbyServices(services.slice(0, 3));
        }
      } catch (error) {
        console.error('Error fetching nearby services:', error);
        if (isMounted) {
          setNearbyServices([]);
        }
      } finally {
        if (isMounted) {
          setLoadingServices(false);
        }
      }
    };

    // Only load if we haven't already loaded services or location changed significantly
    if (nearbyServices.length === 0 || location) {
      loadNearbyServices();
    }

    return () => {
      isMounted = false;
    };
  }, []); // Remove location dependency to prevent frequent refreshes

  // Fetch user profile for welcome message
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await apiClient.get('/users/profile');
        if (response.data && response.data.data && response.data.data.user) {
          setUserName(response.data.data.user.firstName || 'User');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setUserName('User');
      }
    };

    fetchUserProfile();
  }, []);

  // Fetch featured businesses
  useEffect(() => {
    const loadFeaturedBusinesses = async () => {
      try {
        setLoadingBusinesses(true);
        const response = await apiClient.get('/businesses', {
          params: {
            page: 1,
            limit: 3,
            sort: '-averageRating',
          }
        });

        if (response.data && response.data.success) {
          setFeaturedBusinesses(response.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching featured businesses:', error);
      } finally {
        setLoadingBusinesses(false);
      }
    };

    loadFeaturedBusinesses();
  }, []);

  // Fetch appointments
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setLoadingAppointments(true);
        const bookings = await fetchUserBookings({ status: 'confirmed,pending' });

        // Sort by appointment time
        bookings.sort((a, b) => {
          return new Date(a.appointmentDateTime) - new Date(b.appointmentDateTime);
        });

        setAllAppointments(bookings);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setAllAppointments([]);
      } finally {
        setLoadingAppointments(false);
      }
    };

    loadAppointments();
  }, []);

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
      pathname: 'home/service-details',
      params: {
        id: service._id,
        name: service.name,
        serviceType: service.category,
      },
    });
  };

  const handleCarouselItemPress = (item) => {
    // Don't navigate if it's a default carousel item or profile is incomplete
    if (item.isDefault) return;

    if (!isProfileComplete) {
      setShowProfileIncompleteModal(true);
      return;
    }

    // Navigate to service details
    router.push({
      pathname: 'home/service-details',
      params: {
        id: item.serviceId,
        name: item.title,
        serviceType: item.category,
      },
    });
  };

  const handleBusinessPress = (business) => {
    // Check if profile is complete before allowing access
    if (!isProfileComplete) {
      setShowProfileIncompleteModal(true);
      return;
    }
    router.push({
      pathname: 'home/business-details',
      params: {
        id: business._id,
      },
    });
  };


  // Create marked dates object for calendar
  const getMarkedDates = () => {
    const marked = {};
    const today = new Date().toISOString().split('T')[0];

    // Mark dates with appointments
    allAppointments.forEach(appointment => {
      if (appointment.appointmentDateTime) {
        const dateStr = new Date(appointment.appointmentDateTime).toISOString().split('T')[0];
        if (!marked[dateStr]) {
          marked[dateStr] = { marked: true, dotColor: '#FF9B79' };
        }
      }
    });

    // Mark selected date
    if (marked[selectedDate]) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#1C86FF',
      };
    } else {
      marked[selectedDate] = {
        selected: true,
        selectedColor: '#1C86FF',
      };
    }

    // Mark today (if not selected)
    if (today !== selectedDate) {
      if (marked[today]) {
        marked[today] = {
          ...marked[today],
          today: true,
        };
      } else {
        marked[today] = {
          today: true,
        };
      }
    }

    return marked;
  };

  const markedDates = getMarkedDates();

  return (
    <SafeAreaView style={styles.container}>
      <SearchHeader
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
            {/* Welcome Message */}
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>
                Welcome back! 👋 {userName}!
              </Text>
            </View>

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
                  <TouchableOpacity
                    key={`slide-${idx}-${item.id}`}
                    style={[
                      styles.carouselSlide,
                      { width: SLIDE_WIDTH }
                    ]}
                    onPress={() => handleCarouselItemPress(item)}
                    activeOpacity={item.isDefault ? 1 : 0.9}
                  >
                    <Image
                      source={item.image || require("@assets/images/serviceimages/19.png")}
                      style={styles.featuredImage}
                      resizeMode="cover"
                    />
                    <View style={styles.carouselTextContainer}>
                      <Text style={styles.featuredTitle}>{item.title}</Text>
                      <Text style={styles.featuredSubtitle}>{item.subtitle}</Text>
                    </View>
                  </TouchableOpacity>
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

            {/* Appointments Calendar Section */}
            <View style={styles.appointmentSection}>
              <View style={styles.appointmentHeader}>
                <Text style={styles.appointmentTitle}>My Appointments</Text>
                <TouchableOpacity onPress={() => router.push('/(user)/(tabs)/booking')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>

              {loadingAppointments ? (
                <View style={styles.appointmentLoadingContainer}>
                  <ActivityIndicator size="small" color="#1C86FF" />
                  <Text style={styles.appointmentLoadingText}>Loading calendar...</Text>
                </View>
              ) : (
                <>
                  {/* Calendar */}
                  <View style={styles.calendarContainer}>
                    <Calendar
                      markedDates={markedDates}
                      onDayPress={(day) => {
                        setSelectedDate(day.dateString);
                        // Check if the selected date has appointments
                        const hasAppointments = allAppointments.some(appointment => {
                          if (!appointment.appointmentDateTime) return false;
                          const appointmentDate = new Date(appointment.appointmentDateTime).toISOString().split('T')[0];
                          return appointmentDate === day.dateString;
                        });

                        // Navigate to booking tab if there are appointments
                        if (hasAppointments) {
                          router.push('/(user)/(tabs)/booking');
                        }
                      }}
                      theme={{
                        backgroundColor: '#ffffff',
                        calendarBackground: '#ffffff',
                        textSectionTitleColor: '#666',
                        selectedDayBackgroundColor: '#1C86FF',
                        selectedDayTextColor: '#ffffff',
                        todayTextColor: '#1C86FF',
                        dayTextColor: '#333',
                        textDisabledColor: '#d9e1e8',
                        dotColor: '#FF9B79',
                        selectedDotColor: '#ffffff',
                        arrowColor: '#1C86FF',
                        monthTextColor: '#1C86FF',
                        indicatorColor: '#1C86FF',
                        textDayFontFamily: 'SFProReg',
                        textMonthFontFamily: 'SFProBold',
                        textDayHeaderFontFamily: 'SFProSB',
                        textDayFontSize: scaleFontSize(14),
                        textMonthFontSize: scaleFontSize(18),
                        textDayHeaderFontSize: scaleFontSize(12),
                      }}
                    />
                  </View>
                </>
              )}
            </View>

            {/* Categories Label */}
            <Text style={styles.categoriesLabel}>Browse by Categories</Text>

            {/* Services Horizontal Scroll */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.servicesScrollContent}
              style={styles.servicesScroll}
            >
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
            </ScrollView>

            {/* Nearby Services Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Nearby Services</Text>
              <TouchableOpacity onPress={() => router.push('/(user)/(tabs)/services')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

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
                {nearbyServices.map((service) => (
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

            {/* Featured Business Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Business</Text>
              <TouchableOpacity onPress={() => router.push('/(user)/(tabs)/home/businesses')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {loadingBusinesses ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading featured businesses...</Text>
              </View>
            ) : featuredBusinesses.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="business-outline" size={moderateScale(48)} color="#ccc" />
                <Text style={styles.emptyText}>No featured businesses found</Text>
                <Text style={styles.emptySubtext}>Check back later for featured businesses</Text>
              </View>
            ) : (
              <View style={styles.featuredBusinessGrid}>
                {featuredBusinesses.map((business) => (
                  <TouchableOpacity
                    key={business._id}
                    style={styles.businessCardWrapper}
                    onPress={() => handleBusinessPress(business)}
                  >
                    <View style={styles.businessCard}>
                      <View style={styles.businessImageContainer}>
                        <Image
                          source={
                            business.images?.logo
                              ? { uri: business.images.logo }
                              : require("@assets/images/serviceimages/18.png")
                          }
                          style={styles.businessImage}
                        />
                        {business.businessHours && (() => {
                          const { isOpen, status } = isBusinessOpen(business.businessHours);
                          return (
                            <View style={[styles.businessStatusBadge, isOpen ? styles.businessStatusOpen : styles.businessStatusClosed]}>
                              <Text style={styles.businessStatusText}>{status}</Text>
                            </View>
                          );
                        })()}
                      </View>
                    </View>
                    <View style={styles.businessCardInfo}>
                      <Text style={styles.businessName} numberOfLines={2}>
                        {business.businessName}
                      </Text>
                      {business.averageRating && (
                        <View style={styles.businessStarsContainer}>
                          {renderStars(business.averageRating)}
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
    paddingBottom: moderateScale(10),
  },
  welcomeContainer: {
    width: "100%",
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(5),
  },
  welcomeText: {
    fontSize: scaleFontSize(20),
    color: "#1C86FF",
    fontFamily: "SFProBold",
    lineHeight: scaleFontSize(50),
  },
  // Calendar Styles
  calendarContainer: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    overflow: "hidden",
    paddingBottom: moderateScale(10),
    marginBottom: moderateScale(8),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoriesLabel: {
    fontSize: scaleFontSize(20),
    color: "#1C86FF",
    fontFamily: "SFProBold",
    alignSelf: "flex-start",
    marginBottom: moderateScale(18),
    marginTop: moderateScale(5),
  },
  servicesScroll: {
    width: "100%",
    marginBottom: moderateScale(20),
  },
  servicesScrollContent: {
    paddingRight: wp(4),
    gap: moderateScale(12),
  },
  featuredCard: {
    position: "relative",
    height: hp(28),
    width: "100%",
    marginTop: 0,
    marginBottom: moderateScale(15),
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
    fontFamily: "SFProBold",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  featuredSubtitle: {
    fontSize: scaleFontSize(14),
    color: "#fff",
    fontFamily: "SFProReg",
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
    // Today's Appointment Styles
  appointmentSection: {
    width: "100%",
    marginBottom: moderateScale(10),
  },
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(12),
  },
  appointmentTitle: {
    fontSize: scaleFontSize(20),
    fontFamily: "SFProBold",
    color: "#1C86FF",
  },
  appointmentLoadingContainer: {
    paddingVertical: moderateScale(30),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(5),
  },
  appointmentLoadingText: {
    marginTop: moderateScale(10),
    fontSize: scaleFontSize(13),
    color: "#666",
    fontFamily: "SFProReg",
  },
  serviceCard: {
    alignItems: "center",
    marginRight: moderateScale(4),
    width: moderateScale(70),
  },
  serviceIconContainer: {
    width: moderateScale(65),
    height: moderateScale(65),
    borderRadius: moderateScale(16),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: moderateScale(8),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  serviceIcon: {
    width: moderateScale(32),
    height: moderateScale(32),
    tintColor: "#fff",
  },
  serviceTitle: {
    fontSize: scaleFontSize(11),
    color: "#333",
    textAlign: "center",
    fontFamily: "SFProSB",
    lineHeight: scaleFontSize(14),
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: moderateScale(15),
    marginTop: moderateScale(10),
  },
  sectionTitle: {
    fontSize: scaleFontSize(20),
    fontFamily: "SFProBold",
    color: "#1C86FF",
  },
  viewAllText: {
    fontSize: scaleFontSize(14),
    color: "#1C86FF",
    fontFamily: "SFProSB",
  },
  nearbyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
    gap: moderateScale(10),
  },
  nearbyCardWrapper: {
    width: "31%",
    marginBottom: moderateScale(10),
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
    fontFamily: "SFProBold",
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
    fontFamily: "SFProBold",
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
    fontFamily: "SFProBold",
    marginTop: moderateScale(12),
  },
  emptySubtext: {
    fontSize: scaleFontSize(12),
    color: "#999",
    marginTop: moderateScale(4),
    textAlign: "center",
  },
  // Search Results Overlay Styles
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998,
  },
  searchResultsContainer: {
    position: 'absolute',
    top: hp(12), // Below SearchHeader
    left: wp(4),
    right: wp(4),
    maxHeight: hp(60),
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
    overflow: 'hidden',
  },
  searchLoadingContainer: {
    paddingVertical: moderateScale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchLoadingText: {
    marginTop: moderateScale(12),
    fontSize: scaleFontSize(14),
    color: '#666',
  },
  searchEmptyContainer: {
    paddingVertical: moderateScale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchEmptyText: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: '#333',
    marginTop: moderateScale(12),
  },
  searchEmptySubtext: {
    fontSize: scaleFontSize(13),
    color: '#666',
    marginTop: moderateScale(4),
    textAlign: 'center',
  },
  searchResultsList: {
    paddingVertical: moderateScale(8),
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchResultIcon: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  searchResultDetails: {
    flex: 1,
    marginRight: moderateScale(8),
  },
  searchResultName: {
    fontSize: scaleFontSize(15),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(2),
  },
  searchResultBusiness: {
    fontSize: scaleFontSize(13),
    color: '#1C86FF',
    marginBottom: moderateScale(4),
  },
  searchResultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchResultCategory: {
    fontSize: scaleFontSize(12),
    color: '#666',
  },
  searchResultDot: {
    fontSize: scaleFontSize(12),
    color: '#999',
  },
  searchResultPrice: {
    fontSize: scaleFontSize(12),
    color: '#4CAF50',
    fontWeight: '600',
  },
  featuredBusinessGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
    gap: moderateScale(10),
    marginBottom: moderateScale(20),
  },
  businessCardWrapper: {
    width: "31%",
    marginBottom: moderateScale(10),
  },
  businessCard: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    borderWidth: 2,
    borderColor: "#1C86FF",
    overflow: "hidden",
    height: hp(18),
  },
  businessImageContainer: {
    flex: 1,
    width: "100%",
  },
  businessImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  businessCardInfo: {
    backgroundColor: "transparent",
    paddingTop: moderateScale(8),
    alignItems: "center",
  },
  businessName: {
    fontSize: scaleFontSize(13),
    fontWeight: "600",
    color: "#1C86FF",
    textAlign: "center",
    marginBottom: moderateScale(4),
  },
  businessStarsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: moderateScale(2),
  },
  businessStatusBadge: {
    position: "absolute",
    top: moderateScale(8),
    right: moderateScale(8),
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
  },
  businessStatusOpen: {
    backgroundColor: "#4CAF50",
  },
  businessStatusClosed: {
    backgroundColor: "#F44336",
  },
  businessStatusText: {
    color: "#fff",
    fontSize: scaleFontSize(10),
    fontWeight: "600",
  },
});
