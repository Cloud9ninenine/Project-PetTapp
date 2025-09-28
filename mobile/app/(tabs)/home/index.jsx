import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import SearchHeader from "../../components/SearchHeader"; // ✅ import the new header

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

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
        stars.push(<Text key={i} style={styles.fullStar}>★</Text>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Text key={i} style={styles.halfStar}>★</Text>);
      } else {
        stars.push(<Text key={i} style={styles.emptyStar}>☆</Text>);
      }
    }
    return stars;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <SearchHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onNotifPress={() => console.log("🔔 Notification tapped")}
        />

        <View style={styles.mainContent}>
          {/* Featured Card */}
          <View style={styles.featuredCard}>
            <Image
              source={require("@assets/images/serviceimages/Vet Care.png")}
              style={styles.featuredImage}
            />
            <View style={styles.overlay}>
              <Text style={styles.featuredTitle}>Wellness Check-up</Text>
              <Text style={styles.featuredSubtitle}>Pet Clinic</Text>
              <View style={styles.starsContainer}>{renderStars(4.9)}</View>
            </View>
            <View style={styles.playButton}>
              <Text style={styles.playText}>▶</Text>
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
              <View key={service.id} style={styles.nearbyCard}>
                <Image source={service.image} style={styles.nearbyImage} />
                <View style={styles.nearbyInfo}>
                  <Text style={styles.nearbyName}>{service.name}</Text>
                  <View style={styles.starsContainer}>
                    {renderStars(service.rating)}
                    <Text style={styles.ratingText}>({service.rating})</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  mainContent: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  featuredCard: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
    height: 200,
    width: "100%",
    marginTop: 20,
    marginBottom: 30,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 16,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  featuredSubtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    marginBottom: 8,
  },
  playButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  playText: {
    color: "#fff",
    fontSize: 16,
  },
  servicesGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 30,
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#1C86FF",
    marginBottom: 20,
    textAlign: "center",
  },
  nearbyGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 10,
  },
  nearbyCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  nearbyImage: {
    width: "100%",
    height: 80,
  },
  nearbyInfo: {
    padding: 10,
    alignItems: "center",
  },
  nearbyName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
  },
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  fullStar: {
    color: "#FFD700",
    fontSize: 12,
  },
  halfStar: {
    color: "#FFD700",
    fontSize: 12,
    opacity: 0.6,
  },
  emptyStar: {
    color: "#E0E0E0",
    fontSize: 12,
  },
  ratingText: {
    fontSize: 10,
    color: "#666",
    marginLeft: 4,
    fontWeight: "500",
  },
});
