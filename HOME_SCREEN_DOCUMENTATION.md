# PetTapp Home Screen - Technical Documentation

**File:** `mobile/app/(user)/(tabs)/home/index.jsx`
**Component:** `HomeScreen`
**Version:** 1.0
**Last Updated:** 2025-10-10

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture & Dependencies](#architecture--dependencies)
3. [State Management](#state-management)
4. [Core Features](#core-features)
5. [API Integration](#api-integration)
6. [Functions Reference](#functions-reference)
7. [Navigation Flows](#navigation-flows)
8. [UI Components](#ui-components)
9. [Usage Examples](#usage-examples)
10. [Best Practices](#best-practices)

---

## Overview

### Purpose
The Home Screen is the main landing page for authenticated pet owners in the PetTapp mobile application. It provides:
- Featured services carousel with infinite scrolling
- Real-time service search functionality
- Category-based service browsing
- Location-based nearby services discovery
- Profile completion enforcement

### User-Facing Features
- **Auto-playing Carousel**: Showcases featured services from various categories
- **Search Bar**: Debounced search with live results overlay
- **Service Categories**: Quick access to Veterinary, Grooming, Boarding, and Delivery services
- **Nearby Services**: Location-based service recommendations
- **Profile Guard**: Ensures users complete their profile before accessing services

---

## Architecture & Dependencies

### External Libraries
```javascript
import React, { useState, useRef, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Location from 'expo-location';
```

### Custom Dependencies
```javascript
import SearchHeader from "@components/SearchHeader";
import CompleteProfileModal from "@components/CompleteProfileModal";
import { wp, hp, moderateScale, scaleFontSize } from "@utils/responsive";
import apiClient from "../../../config/api";
import { useProfileCompletion } from "../../../hooks/useProfileCompletion";
```

### Key Integrations
- **Expo Router**: Navigation management
- **Expo Location**: Geolocation services
- **API Client**: Backend service communication
- **Profile Completion Hook**: User verification

---

## State Management

### Component State Variables

| State Variable | Type | Purpose |
|---------------|------|---------|
| `searchQuery` | string | Stores user's search input |
| `activeSlide` | number | Current visible carousel slide (0-indexed) |
| `showProfileIncompleteModal` | boolean | Controls profile completion modal visibility |
| `nearbyServices` | array | Stores nearby services from API |
| `loadingServices` | boolean | Loading state for nearby services |
| `location` | object | User's geolocation coordinates |
| `searchResults` | array | Search results from API |
| `isSearching` | boolean | Loading state for search operation |
| `showSearchResults` | boolean | Controls search overlay visibility |
| `carouselImages` | array | Dynamic carousel data from API |
| `loadingCarousel` | boolean | Loading state for carousel data |

### useRef Variables

| Ref Variable | Type | Purpose |
|-------------|------|---------|
| `searchTimeoutRef` | timeout | Manages search debouncing timer |
| `translateX` | Animated.Value | Controls carousel slide position |
| `internalIndexRef` | number | Tracks actual carousel position (includes clones) |
| `intervalRef` | interval | Manages carousel autoplay timer |
| `panResponder` | PanResponder | Handles swipe gestures on carousel |

### Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `SLIDE_WIDTH` | `width - moderateScale(32)` | Calculated carousel slide width |
| `defaultCarouselImages` | array | Fallback carousel images when API fails |
| `services` | array | Static service category buttons |

---

## Core Features

### 1. Infinite Carousel with Autoplay

#### How It Works
The carousel implements an **infinite loop** pattern using cloned slides:

```
Array Structure: [last clone, ...real slides, first clone]
Internal Index:   0            1 ... n        n+1
User Sees:                     slide 0 ... n-1
```

**Key Mechanisms:**
- **Extended Array**: `[last, ...images, first]` enables seamless looping
- **Internal Index**: Ranges from 0 to n+1 (includes clones)
- **Active Slide**: User-facing index 0 to n-1 (only real slides)
- **Autoplay**: Advances every 5000ms automatically
- **Infinite Loop**: When reaching clones, instantly jumps to corresponding real slide

#### Implementation Details

```javascript
// Lines 86-92: Create extended array with clones
const imagesToUse = carouselImages.length > 0 ? carouselImages : defaultCarouselImages;
const extendedImages = [
  imagesToUse[imagesToUse.length - 1],  // Last image clone
  ...imagesToUse,                        // Real images
  imagesToUse[0],                        // First image clone
];
```

**Animation Flow:**
1. User swipes or autoplay triggers
2. Animate to target index (including clones)
3. If landed on clone, instantly jump to real counterpart
4. Update user-facing active slide indicator

#### Gesture Handling
- **Swipe Threshold**: 20% of slide width
- **Pause on Interaction**: Autoplay stops during manual swipes
- **Resume Delay**: 800ms after gesture release

### 2. Debounced Search

#### Search Flow
```
User Types → Wait 500ms → API Call → Display Results
```

**Benefits:**
- Reduces unnecessary API calls
- Improves performance
- Better user experience

#### Implementation

```javascript
// Lines 393-417: Debounced search effect
useEffect(() => {
  if (searchTimeoutRef.current) {
    clearTimeout(searchTimeoutRef.current);
  }

  if (!searchQuery || searchQuery.trim().length === 0) {
    setSearchResults([]);
    setShowSearchResults(false);
    return;
  }

  searchTimeoutRef.current = setTimeout(() => {
    searchServices(searchQuery);
  }, 500);  // 500ms debounce delay

  return () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };
}, [searchQuery]);
```

**Search Parameters:**
- Minimum length: 2 characters
- Debounce delay: 500ms
- Results limit: 20 services
- Real-time updates as user types

### 3. Location-Based Services

#### Location Permission Flow
```
App Launch → Request Permission → Get Coordinates → Fetch Nearby Services
```

#### Implementation

```javascript
// Lines 254-269: Location permission and fetching
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
```

**Nearby Services Parameters:**
- **Radius**: 10km from user's location
- **Limit**: 6 services
- **Sorting**: Automatically sorted by distance (backend)

### 4. Dynamic Carousel Content

#### Fetching Strategy
The carousel fetches services using a **multi-strategy approach**:

**Strategy 1: Category-based**
- Fetch one service from each of 7 categories
- Categories: `veterinary`, `grooming`, `boarding`, `training`, `daycare`, `emergency`, `consultation`

**Strategy 2: Nearby Services (Optional)**
- If location available AND carousel has < 6 items
- Add up to 3 nearby services
- Maximum total: 8 carousel items

**Duplicate Prevention:**
- Uses `Set` data structure to track `usedServiceIds`
- Ensures no service appears twice

```javascript
// Lines 272-360: Carousel fetching logic
const fetchCarouselServices = async () => {
  const categories = ['veterinary', 'grooming', 'boarding', ...];
  const carouselData = [];
  const usedServiceIds = new Set();

  // Fetch one per category
  for (const category of categories) {
    // API call per category
  }

  // Optionally add nearby services
  if (location && carouselData.length < 6) {
    // Fetch and add nearby services
  }

  // Use API data if >= 2 items, otherwise fallback
  if (carouselData.length >= 2) {
    setCarouselImages(carouselData);
  } else {
    setCarouselImages(defaultCarouselImages);
  }
};
```

### 5. Profile Completion Guard

#### Purpose
Prevents users with incomplete profiles from accessing services.

#### Required Fields
- First name
- Last name
- Address
- Contact number

#### Implementation
All navigation handlers check profile completion:

```javascript
const handleNearbyServicePress = (service) => {
  if (!isProfileComplete) {
    setShowProfileIncompleteModal(true);
    return;  // Block navigation
  }
  // Proceed with navigation
  router.push({ ... });
};
```

**Guarded Actions:**
- Service category navigation
- Nearby service details
- Carousel item clicks
- Search result clicks

---

## API Integration

### Endpoints Used

#### 1. GET `/services` - Service Search
**Parameters:**
```javascript
{
  search: string,    // Search query
  limit: number      // Results limit (20 for search)
}
```

**Response:**
```javascript
{
  success: boolean,
  data: [
    {
      _id: string,
      name: string,
      category: string,
      businessId: { businessName: string },
      pricing: { amount: number, currency: string },
      imageUrl: string,
      rating: number
    }
  ]
}
```

#### 2. GET `/services` - Category Filter
**Parameters:**
```javascript
{
  category: string,  // 'veterinary', 'grooming', 'boarding', etc.
  limit: number      // 1 for carousel
}
```

#### 3. GET `/services` - Location-based
**Parameters:**
```javascript
{
  latitude: number,
  longitude: number,
  radius: number,    // 10 (kilometers)
  limit: number      // 6 for nearby, 3 for carousel supplement
}
```

**Response includes:**
- `distance`: Distance from user in kilometers
- Sorted by proximity (closest first)

### API Call Locations

| Feature | API Endpoint | Trigger | Lines |
|---------|-------------|---------|-------|
| Search | `/services?search=...` | User types (debounced) | 374-389 |
| Carousel | `/services?category=...` | Component mount, location change | 272-360 |
| Nearby Services | `/services?latitude=...` | Location acquired | 420-448 |

---

## Functions Reference

### Carousel Functions

#### `syncActiveSlide(internalIdx)`
**Purpose:** Converts internal carousel index to user-facing slide number

**Parameters:**
- `internalIdx` (number): Internal index including clones (0 to n+1)

**Returns:** void

**Logic:**
```javascript
const n = carouselImages.length;
const logical = ((internalIdx - 1) % n + n) % n;
setActiveSlide(logical);
```

---

#### `animateToInternalIndex(toIndex, options)`
**Purpose:** Animates carousel to target index with infinite loop handling

**Parameters:**
- `toIndex` (number): Target internal index
- `options` (object): `{ animated: boolean }` - default true

**Behavior:**
1. Animates to target position
2. If landed on clone (index 0 or max), instantly jump to real slide
3. Updates state and sync active slide

**Lines:** 110-151

---

#### `startAutoPlay(ms)`
**Purpose:** Starts carousel autoplay

**Parameters:**
- `ms` (number): Interval in milliseconds (default: 5000)

**Behavior:**
- Clears existing interval
- Advances to next slide every `ms` milliseconds
- Uses `internalIndexRef.current + 1` for next slide

**Lines:** 154-160

---

#### `stopAutoPlay()`
**Purpose:** Stops carousel autoplay

**Lines:** 161-166

---

### Search Functions

#### `searchServices(query)`
**Purpose:** Performs API search for services

**Parameters:**
- `query` (string): Search query

**Behavior:**
1. Validates query (min 2 characters)
2. Sets loading state
3. Calls `/services` API with search param
4. Updates search results state
5. Shows error alert on failure

**Lines:** 363-390

---

### Navigation Handlers

#### `handleServicePress(service)`
**Purpose:** Navigates to services tab filtered by category

**Parameters:**
- `service` (object): Service category object

**Guards:** Profile completion check

**Navigation:**
```javascript
pathname: '/(user)/(tabs)/services'
params: { category: service.category }
```

**Lines:** 450-463

---

#### `handleNearbyServicePress(service)`
**Purpose:** Navigates to nearby service details

**Parameters:**
- `service` (object): Service object from API

**Guards:** Profile completion check

**Navigation:**
```javascript
pathname: 'home/service-details'
params: {
  id: service._id,
  name: service.name,
  serviceType: service.category
}
```

**Lines:** 465-479

---

#### `handleCarouselItemPress(item)`
**Purpose:** Navigates to carousel item details

**Parameters:**
- `item` (object): Carousel item

**Guards:**
- Skip if `isDefault: true` (fallback images)
- Profile completion check

**Navigation:**
```javascript
pathname: 'home/service-details'
params: {
  id: item.serviceId,
  name: item.title,
  serviceType: item.category
}
```

**Lines:** 481-499

---

#### `handleSearchResultPress(service)`
**Purpose:** Navigates to search result details

**Parameters:**
- `service` (object): Search result service object

**Guards:** Profile completion check

**Behavior:**
1. Clears search query
2. Hides search overlay
3. Navigates to service details

**Lines:** 501-521

---

### Helper Functions

#### `getServiceCategoryIcon(category)`
**Purpose:** Maps service category to appropriate Ionicon name

**Parameters:**
- `category` (string): Service category

**Returns:** (string) Ionicon name

**Mapping:**
| Category | Icon |
|----------|------|
| veterinary | medical-outline |
| grooming | cut-outline |
| boarding, daycare | home-outline |
| training | school-outline |
| emergency | alert-circle-outline |
| consultation | chatbubble-outline |
| default | paw-outline |

**Lines:** 524-542

---

#### `formatPrice(price)`
**Purpose:** Formats price for display

**Parameters:**
- `price` (number | object): Price value or object with `amount` property

**Returns:** (string) Formatted price string

**Examples:**
```javascript
formatPrice(150) → "₱150"
formatPrice({ amount: 1500 }) → "₱1,500"
formatPrice(null) → "Price not available"
```

**Lines:** 545-551

---

#### `renderStars(rating)`
**Purpose:** Renders star rating visualization

**Parameters:**
- `rating` (number): Rating value (0-5)

**Returns:** (array) Array of Ionicon star components

**Logic:**
- Full stars: `Math.floor(rating)`
- Half star: If `rating % 1 !== 0`
- Empty stars: Remaining to complete 5 stars

**Lines:** 555-574

---

## Navigation Flows

### Navigation Map

```
HomeScreen
├─ Service Category Button
│  └─ /(user)/(tabs)/services?category={category}
│
├─ Carousel Item (API data)
│  └─ home/service-details?id={id}&name={name}&serviceType={category}
│
├─ Nearby Service Card
│  └─ home/service-details?id={id}&name={name}&serviceType={category}
│
├─ Search Result Item
│  └─ home/service-details?id={id}&name={name}&serviceType={category}
│
└─ Search Header (Notification)
   └─ /(user)/(tabs)/notification
```

### Navigation Parameters

#### To `service-details`
```javascript
{
  id: string,          // Service MongoDB _id
  name: string,        // Service name
  serviceType: string  // Category (veterinary, grooming, etc.)
}
```

#### To `services` tab
```javascript
{
  category: string     // Filter services by category
}
```

---

## UI Components

### 1. Search Results Overlay

**Location:** Lines 584-662

**Structure:**
```
SearchOverlay (backdrop)
└─ SearchResultsContainer
   ├─ Loading State (ActivityIndicator)
   ├─ Empty State (Icon + Message)
   └─ Results List (FlatList)
      └─ SearchResultItem
         ├─ Icon (category-based)
         ├─ Details (name, business, category, price)
         └─ Chevron
```

**Features:**
- Positioned absolutely below search header
- Semi-transparent backdrop (50% opacity)
- Max height: 60% of screen
- Scrollable results
- Dismissible by clicking backdrop

**States:**
- **Loading**: Shows spinner
- **Empty**: "No services found" message
- **Results**: Scrollable list of services

---

### 2. Featured Carousel

**Location:** Lines 673-716

**Structure:**
```
FeaturedCard (container)
├─ Animated.View (horizontal scroll)
│  └─ CarouselSlide (TouchableOpacity)
│     ├─ Image (service image)
│     └─ TextContainer (overlay)
│        ├─ Title
│        └─ Subtitle
└─ Pagination Dots
```

**Features:**
- **Auto-play**: 5 second intervals
- **Swipe Gestures**: PanResponder for manual navigation
- **Infinite Loop**: Seamless wrapping
- **Pagination Indicators**: Shows current slide
- **Image Sources**: API URLs or local fallbacks
- **Click to Navigate**: Opens service details

**Dimensions:**
- Height: 28% of screen height
- Width: Screen width - 32px padding

---

### 3. Service Categories Grid

**Location:** Lines 718-737

**Structure:**
```
ServicesGrid
└─ ServiceCard (TouchableOpacity)
   ├─ IconContainer (colored circle)
   │  └─ Icon (service image)
   └─ Title (text)
```

**Layout:**
- Horizontal grid
- 4 equal columns
- Icons: 60x60px circles
- Color: #FF9B79 (orange)

**Categories:**
1. Veterinary
2. Grooming
3. Boarding
4. Delivery

---

### 4. Nearby Services Grid

**Location:** Lines 740-780

**Structure:**
```
NearbyGrid
└─ NearbyCardWrapper (flex container)
   ├─ NearbyCard (image container)
   │  └─ Image (service photo)
   └─ CardInfo
      ├─ Name
      └─ Stars (rating)
```

**Features:**
- Shows top 3 nearby services
- **Loading State**: "Loading nearby services..."
- **Empty State**: Location icon + message
- **Card Height**: 18% of screen height
- **Star Rating**: Visual rating display

**Layout:**
- Horizontal arrangement
- Equal spacing
- Flexible width distribution

---

## Usage Examples

### Example 1: Adding a New Service Category

```javascript
// In services array (Line 222-251)
const services = [
  // ... existing categories
  {
    id: 5,
    title: "Training",
    icon: require("@assets/images/service_icon/14.png"),
    color: "#FF9B79",
    category: "training",
  },
];
```

**Also update:**
1. Icon mapping in `getServiceCategoryIcon()` (Line 524)
2. Backend API category filter

---

### Example 2: Changing Search Debounce Delay

```javascript
// Line 407-409
searchTimeoutRef.current = setTimeout(() => {
  searchServices(searchQuery);
}, 1000);  // Changed from 500ms to 1000ms
```

---

### Example 3: Adjusting Carousel Autoplay Speed

```javascript
// Line 182
startAutoPlay(3000);  // Changed from 5000ms to 3000ms

// Line 216
setTimeout(() => startAutoPlay(3000), 800);
```

---

### Example 4: Modifying Nearby Services Radius

```javascript
// Line 432
params.radius = 20;  // Changed from 10km to 20km
```

---

### Example 5: Adding Custom Fallback Images

```javascript
// Lines 54-84
const defaultCarouselImages = [
  {
    id: 'default-5',
    image: require("@assets/images/serviceimages/NewService.png"),
    title: "Pet Daycare",
    subtitle: "Happy Pets Center",
    isDefault: true,
  },
  // ... existing defaults
];
```

---

## Best Practices

### Performance Optimization

1. **Debounce Search Inputs**
   - Prevents excessive API calls
   - Current: 500ms delay
   - Adjust based on backend response time

2. **Limit API Results**
   - Search: 20 results max
   - Nearby: 6 services max
   - Carousel categories: 1 per category

3. **Use Native Driver for Animations**
   ```javascript
   useNativeDriver: true  // Line 124
   ```
   - Offloads animations to native thread
   - Smoother 60fps animations

4. **Cleanup Side Effects**
   - Clear timeouts on unmount
   - Stop autoplay on navigation away
   - Cancel pending API requests if needed

### User Experience

1. **Profile Completion Guard**
   - Show modal instead of silent failure
   - Clear call-to-action
   - Consistent across all navigation points

2. **Loading States**
   - Show loading indicators during API calls
   - Prevent multiple simultaneous requests
   - Provide feedback for long operations

3. **Error Handling**
   - Graceful fallbacks (default carousel images)
   - User-friendly error messages
   - Log errors for debugging

4. **Empty States**
   - Helpful messages when no data
   - Suggestions for user action
   - Visual icons for better UX

### Code Maintainability

1. **Separation of Concerns**
   - Data fetching in useEffect hooks
   - Event handlers as separate functions
   - UI rendering in return statement

2. **Consistent Naming**
   - `handle*` for event handlers
   - `fetch*` for API calls
   - `render*` for UI components

3. **Comments & Documentation**
   - Complex logic explained inline
   - State purposes documented
   - API contracts clear

### Security & Privacy

1. **Location Permissions**
   - Request only when needed
   - Handle denial gracefully
   - Respect user privacy

2. **API Error Handling**
   - Don't expose sensitive error details
   - Validate API responses
   - Handle malformed data

3. **Profile Data Validation**
   - Check profile completion before navigation
   - Validate required fields
   - Prevent unauthorized access

---

## Troubleshooting

### Common Issues

#### 1. Carousel Not Auto-playing
**Symptoms:** Carousel stays on first slide

**Solutions:**
- Check if `startAutoPlay()` is called in useEffect (Line 182)
- Verify `intervalRef.current` is not null
- Ensure component is not unmounted prematurely

---

#### 2. Search Not Working
**Symptoms:** No results appear when typing

**Solutions:**
- Verify API endpoint is correct
- Check minimum character requirement (2 chars)
- Inspect network requests in DevTools
- Validate `searchTimeoutRef` cleanup

---

#### 3. Location Not Loading
**Symptoms:** Nearby services empty despite permission granted

**Solutions:**
- Check location permission status
- Verify device location services enabled
- Test on physical device (emulator may have issues)
- Check backend API location filter logic

---

#### 4. Carousel Images Not Loading
**Symptoms:** Fallback images displayed instead of API images

**Solutions:**
- Verify API returns `imageUrl` field
- Check image URL format (must be valid URI)
- Test image URLs in browser
- Ensure `carouselData.length >= 2` (Line 346)

---

#### 5. Profile Modal Keeps Appearing
**Symptoms:** Modal shows repeatedly even after completion

**Solutions:**
- Verify `useProfileCompletion` hook logic
- Check backend profile validation
- Clear app cache/storage
- Re-fetch user profile data

---

## Code Metrics

| Metric | Value |
|--------|-------|
| Total Lines | 1,078 |
| Component Functions | 8 |
| Helper Functions | 3 |
| useEffect Hooks | 5 |
| State Variables | 11 |
| useRef Variables | 5 |
| API Endpoints | 1 (with 3 param variations) |
| Navigation Routes | 3 |
| UI Sections | 4 |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-10 | Initial implementation with carousel, search, and nearby services |

---

## Related Documentation

- [Backend Services API](../petTapp-be/src/routes/services.ts)
- [Profile Completion Hook](../hooks/useProfileCompletion.md)
- [Responsive Utils](../utils/responsive.md)
- [Service Details Screen](./service-details.md)

---

## Support

For questions or issues:
- Check [Troubleshooting](#troubleshooting) section
- Review [Best Practices](#best-practices)
- Contact development team

---

**Document End**
