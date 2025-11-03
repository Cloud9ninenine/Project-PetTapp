  // app/components/SearchHeader.jsx
  import React, { useState, useEffect, useRef } from "react";
  import { View, TextInput, StyleSheet, TouchableOpacity, Platform, Text, FlatList, Image,
  ActivityIndicator } from "react-native";
  import { Ionicons } from "@expo/vector-icons";
  import { useSafeAreaInsets } from 'react-native-safe-area-context';
  import { useRouter } from "expo-router";
  import { hp, wp, moderateScale, scaleFontSize } from "@utils/responsive";
  import apiClient from "@config/api";
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import { useNotificationCount } from '@utils/useNotificationCount';

  export default function SearchHeader({ onNotifPress,
  showNotificationBadge = true }) {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState(""); // Internal state
    const [searchResults, setSearchResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [profilePicture, setProfilePicture] = useState(null);
    const searchTimeoutRef = useRef(null);
    const abortControllerRef = useRef(null);

    // Use custom hook for notification count
    const { unreadCount: unreadNotificationsCount } = useNotificationCount(showNotificationBadge);

    // Fetch user profile on mount
    useEffect(() => {
      const fetchUserProfile = async () => {
        try {
          const response = await apiClient.get('/users/profile');
          console.log('Profile response:', response.data);
          if (response.data?.success && response.data?.data?.user?.images?.profile) {
            setProfilePicture(response.data.data.user.images.profile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      };

      fetchUserProfile();
    }, []);

    // Search both businesses and services with debounce
    useEffect(() => {
      console.log('🔄 Search query changed:', searchQuery);

      // Cancel previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        setShowDropdown(true); // Show dropdown immediately
        searchTimeoutRef.current = setTimeout(async () => {
          try {
            console.log('🔍 Searching for:', searchQuery.trim());

            // Create new AbortController for this request
            abortControllerRef.current = new AbortController();

            // Search both businesses and services in parallel
            const [businessResponse, serviceResponse] = await Promise.all([
              apiClient.get('/businesses', {
                params: {
                  search: searchQuery.trim(),
                  page: 1,
                  limit: 5
                },
                signal: abortControllerRef.current.signal
              }).catch((err) => {
                if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
                  console.log('🚫 Business search cancelled');
                  return null;
                }
                console.log('❌ Business search error:', err.response?.data || err.message);
                return { data: { success: false, data: [] } };
              }),
              apiClient.get('/services', {
                params: {
                  search: searchQuery.trim(),
                  page: 1,
                  limit: 5
                },
                signal: abortControllerRef.current.signal
              }).catch((err) => {
                if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
                  console.log('🚫 Service search cancelled');
                  return null;
                }
                console.log('❌ Service search error:', err.response?.data || err.message);
                return { data: { success: false, data: [] } };
              })
            ]);

            // If request was cancelled, don't update state
            if (!businessResponse || !serviceResponse) {
              return;
            }

            console.log('📊 Business response:', businessResponse.data);
            console.log('📊 Service response:', serviceResponse.data);

            const businesses = businessResponse.data?.success ? businessResponse.data.data || [] : [];
            const services = serviceResponse.data?.success ? serviceResponse.data.data || [] : [];

            console.log('✅ Businesses found:', businesses.length);
            console.log('✅ Services found:', services.length);

            // Log first business to see available fields
            if (businesses.length > 0) {
              console.log('📸 First business data:', {
                logo: businesses[0].logo,
                imageUrl: businesses[0].imageUrl,
                images: businesses[0].images,
                businessName: businesses[0].businessName
              });
            }

            // Format results with type indicator
            const formattedBusinesses = businesses.map(b => ({
              ...b,
              type: 'business',
              displayName: b.businessName,
              // Business logo comes from images.logo (attached by imageService)
              image: b.images?.logo || b.logo || null
            }));

            const formattedServices = services.map(s => ({
              ...s,
              type: 'service',
              displayName: s.name,
              image: s.imageUrl
            }));

            // Combine and limit total results
            const combinedResults = [...formattedServices, ...formattedBusinesses].slice(0, 10);

            console.log('🎯 Combined results:', combinedResults.length);

            setSearchResults(combinedResults);
            // Keep dropdown visible (will show results or "no results" message)
          } catch (error) {
            console.error('💥 Error searching:', error);
            setSearchResults([]);
            setShowDropdown(true); // Show empty state
          } finally {
            setIsSearching(false);
          }
        }, 300);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
        setIsSearching(false);
      }

      return () => {
        // Cleanup: cancel pending requests and clear timeout
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
      };
    }, [searchQuery]);

    const handleResultPress = (item) => {
      setShowDropdown(false);
      setSearchQuery('');

      if (item.type === 'business') {
        router.push({
          pathname: '/(user)/(tabs)/home/business-details',
          params: { id: item._id }
        });
      } else if (item.type === 'service') {
        router.push({
          pathname: '/(user)/(tabs)/home/service-details',
          params: { id: item._id }
        });
      }
    };

    const handleProfilePress = () => {
      setShowProfileDropdown(!showProfileDropdown);
    };

    const handleProfileMenuPress = () => {
      setShowProfileDropdown(false);
      router.push('/(user)/(tabs)/profile');
    };

    const handleNotificationPress = () => {
      setShowProfileDropdown(false);
      if (onNotifPress) {
        onNotifPress();
      }
    };

    const handleLogoutPress = async () => {
      setShowProfileDropdown(false);
      try {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('userType');
        router.replace('/login');
      } catch (error) {
        console.error('Error during logout:', error);
      }
    };

    const renderSearchItem = ({ item }) => {
      const isService = item.type === 'service';
      const iconName = isService ? 'briefcase-outline' : 'business-outline';
      const iconColor = isService ? '#FF6B6B' : '#1E90FF';
      const placeholderBg = isService ? '#FFE8E8' : '#E3F2FD';

      return (
        <TouchableOpacity
          style={styles.dropdownItem}
          onPress={() => handleResultPress(item)}
          activeOpacity={0.7}
        >
          {/* Left Icon/Image */}
          <View style={styles.iconContainer}>
            {item.image ? (
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: item.image }}
                  style={styles.itemImage}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View style={[styles.iconPlaceholder, { backgroundColor: placeholderBg }]}>
                <Ionicons name={iconName} size={moderateScale(24)} color={iconColor} />
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.displayName}
            </Text>
            <Text style={styles.itemType}>
              {isService ? 'Service' : 'Business'}
            </Text>
          </View>

          {/* Right Icon */}
          <View style={styles.rightIconContainer}>
            <Ionicons
              name={isService ? 'briefcase-outline' : 'business-outline'}
              size={moderateScale(20)}
              color="#BDBDBD"
            />
          </View>
        </TouchableOpacity>
      );
    };

    return (
      <View style={styles.wrapper}>
        <View style={[styles.container, { paddingTop: insets.top + moderateScale(25) }]}>
          {/* Search bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={moderateScale(20)} color="#A0AEC0" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#A0AEC0"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {isSearching && (
              <ActivityIndicator size="small" color="#1E90FF" style={styles.searchLoader} />
            )}
            {searchQuery.length > 0 && !isSearching && (
              <TouchableOpacity onPress={() => {
                setSearchQuery('');
                setShowDropdown(false);
              }}>
                <Ionicons name="close-circle" size={moderateScale(20)} color="#A0AEC0" />
              </TouchableOpacity>
            )}
          </View>

          {/* Profile icon */}
          <TouchableOpacity style={styles.bellContainer} onPress={handleProfilePress}>
            {profilePicture ? (
              <Image
                source={{ uri: profilePicture }}
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person-circle-outline" size={moderateScale(28)} color="#fff" />
            )}
            {showNotificationBadge && unreadNotificationsCount > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>
                  {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Results Dropdown */}
        {showDropdown && (
          <View style={styles.dropdownContainer}>
            {searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                renderItem={renderSearchItem}
                keyExtractor={(item) => `${item.type}-${item._id}`}
                style={styles.dropdown}
                contentContainerStyle={styles.dropdownContent}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.noResultsContainer}>
                <Ionicons name="search-outline" size={moderateScale(40)} color="#ccc" />
                <Text style={styles.noResultsText}>No results found</Text>
                <Text style={styles.noResultsSubtext}>Try different keywords</Text>
              </View>
            )}
          </View>
        )}

        {/* Profile Dropdown Menu */}
        {showProfileDropdown && (
          <View style={styles.profileDropdownContainer}>
            <TouchableOpacity
              style={styles.profileDropdownItem}
              onPress={handleProfileMenuPress}
              activeOpacity={0.7}
            >
              <Ionicons name="person-outline" size={moderateScale(20)} color="#333" />
              <Text style={styles.profileDropdownText}>Profile</Text>
            </TouchableOpacity>

            <View style={styles.profileDropdownDivider} />

            <TouchableOpacity
              style={styles.profileDropdownItem}
              onPress={handleNotificationPress}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={moderateScale(20)} color="#333" />
              <Text style={styles.profileDropdownText}>Notifications</Text>
              {unreadNotificationsCount > 0 && (
                <View style={styles.profileBadge}>
                  <Text style={styles.profileBadgeText}>
                    {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.profileDropdownDivider} />

            <TouchableOpacity
              style={styles.profileDropdownItem}
              onPress={handleLogoutPress}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={moderateScale(20)} color="#FF3B30" />
              <Text style={[styles.profileDropdownText, { color: '#FF3B30' }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  const styles = StyleSheet.create({
    wrapper: {
      position: 'relative',
      zIndex: 1000,
      elevation: 10, // Required for Android zIndex support
    },
    container: {
      backgroundColor: "#1E90FF",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: wp(5),
      paddingBottom: moderateScale(25),
      borderBottomRightRadius: moderateScale(10),
      borderBottomLeftRadius: moderateScale(10),
    },
    searchContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#fff",
      borderRadius: moderateScale(10),
      paddingHorizontal: moderateScale(15),
      marginRight: moderateScale(10),
      height: moderateScale(55),
    },
    searchInput: {
      flex: 1,
      marginLeft: moderateScale(8),
      fontSize: scaleFontSize(16),
      color: "#000",
    },
    searchLoader: {
      marginRight: moderateScale(8),
    },
    bellContainer: {
      padding: moderateScale(8),
      position: 'relative',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: moderateScale(20),
      width: moderateScale(44),
      height: moderateScale(44),
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'visible',
    },
    profileImage: {
      width: moderateScale(44),
      height: moderateScale(44),
      borderRadius: moderateScale(22),
      backgroundColor: '#fff',
    },
    badgeContainer: {
      position: 'absolute',
      top: moderateScale(-6),
      right: moderateScale(-6),
      backgroundColor: '#FF3B30',
      borderRadius: moderateScale(10),
      minWidth: moderateScale(20),
      height: moderateScale(20),
      paddingHorizontal: moderateScale(5),
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#1E90FF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 5,
    },
    badgeText: {
      color: '#fff',
      fontSize: scaleFontSize(10),
      fontWeight: 'bold',
      textAlign: 'center',
    },
    dropdownContainer: {
      position: 'absolute',
      top: moderateScale(85), // Fixed pixel value instead of percentage for Android compatibility
      left: wp(5),
      right: wp(5),
      backgroundColor: '#fff',
      borderRadius: moderateScale(12),
      marginTop: moderateScale(5),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
      maxHeight: hp(50),
      zIndex: 999,
      overflow: 'hidden',
    },
    dropdown: {
      maxHeight: hp(50),
    },
    dropdownContent: {
      paddingVertical: moderateScale(8),
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: moderateScale(12),
      paddingHorizontal: moderateScale(16),
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#F5F5F5',
    },
    iconContainer: {
      marginRight: moderateScale(14),
    },
    imageWrapper: {
      width: moderateScale(50),
      height: moderateScale(50),
      borderRadius: moderateScale(25),
      overflow: 'hidden',
      backgroundColor: '#F5F5F5',
    },
    itemImage: {
      width: '100%',
      height: '100%',
    },
    iconPlaceholder: {
      width: moderateScale(50),
      height: moderateScale(50),
      borderRadius: moderateScale(25),
      justifyContent: 'center',
      alignItems: 'center',
    },
    contentContainer: {
      flex: 1,
      justifyContent: 'center',
      paddingRight: moderateScale(8),
    },
    itemName: {
      fontSize: scaleFontSize(15),
      fontWeight: '600',
      color: '#212121',
      marginBottom: moderateScale(3),
      letterSpacing: 0.2,
    },
    itemType: {
      fontSize: scaleFontSize(12),
      color: '#757575',
      fontWeight: '400',
    },
    rightIconContainer: {
      marginLeft: moderateScale(8),
      justifyContent: 'center',
      alignItems: 'center',
    },
    noResultsContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: moderateScale(40),
      paddingHorizontal: moderateScale(16),
      backgroundColor: '#fff',
    },
    noResultsText: {
      fontSize: scaleFontSize(15),
      fontWeight: '600',
      color: '#666',
      marginTop: moderateScale(12),
    },
    noResultsSubtext: {
      fontSize: scaleFontSize(13),
      color: '#999',
      marginTop: moderateScale(6),
      textAlign: 'center',
    },
    profileDropdownContainer: {
      position: 'absolute',
      top: moderateScale(85),
      right: wp(5),
      backgroundColor: '#fff',
      borderRadius: moderateScale(12),
      marginTop: moderateScale(5),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 999,
      overflow: 'hidden',
      minWidth: moderateScale(180),
    },
    profileDropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: moderateScale(14),
      paddingHorizontal: moderateScale(16),
      backgroundColor: '#fff',
    },
    profileDropdownText: {
      fontSize: scaleFontSize(15),
      fontWeight: '500',
      color: '#333',
      marginLeft: moderateScale(12),
      flex: 1,
    },
    profileDropdownDivider: {
      height: 1,
      backgroundColor: '#F5F5F5',
      marginHorizontal: moderateScale(16),
    },
    profileBadge: {
      backgroundColor: '#FF3B30',
      borderRadius: moderateScale(10),
      minWidth: moderateScale(20),
      height: moderateScale(20),
      paddingHorizontal: moderateScale(5),
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: moderateScale(8),
    },
    profileBadgeText: {
      color: '#fff',
      fontSize: scaleFontSize(10),
      fontWeight: 'bold',
      textAlign: 'center',
    },
  });