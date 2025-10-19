import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Header from "@components/Header";
import { wp, hp, moderateScale, scaleFontSize } from '@utils/responsive';
import apiClient from '@config/api';

export default function FAQScreen() {
  const router = useRouter();
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadCategories();
    loadFAQs();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await apiClient.get('/faqs/categories');
      if (response.data.success) {
        setCategories(['all', ...(response.data.data || [])]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadFAQs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/faqs');
      if (response.data.success) {
        setFaqs(response.data.data?.faqs || []);
      }
    } catch (error) {
      console.error('Error loading FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFAQsByCategory = async (category) => {
    try {
      setLoading(true);
      if (category === 'all') {
        await loadFAQs();
        return;
      }

      const response = await apiClient.get(`/faqs/category/${category}`);
      if (response.data.success) {
        setFaqs(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading FAQs by category:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchFAQs = async (query) => {
    try {
      setSearching(true);
      const response = await apiClient.get('/faqs/search', {
        params: {
          query,
          ...(selectedCategory !== 'all' && { category: selectedCategory })
        }
      });

      if (response.data.success) {
        setFaqs(response.data.data || []);
      }
    } catch (error) {
      console.error('Error searching FAQs:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleCategoryPress = (category) => {
    setSelectedCategory(category);
    setSearchQuery('');
    loadFAQsByCategory(category);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim().length >= 2) {
      searchFAQs(text.trim());
    } else if (text.trim().length === 0) {
      loadFAQsByCategory(selectedCategory);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getCategoryLabel = (category) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      general: 'help-circle-outline',
      bookings: 'calendar-outline',
      payments: 'card-outline',
      pets: 'paw-outline',
      services: 'briefcase-outline',
      all: 'apps-outline',
    };
    return icons[category] || 'help-circle-outline';
  };

  const renderCategory = ({ item }) => {
    const isSelected = selectedCategory === item;
    return (
      <TouchableOpacity
        style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
        onPress={() => handleCategoryPress(item)}
      >
        <Ionicons
          name={getCategoryIcon(item)}
          size={moderateScale(16)}
          color={isSelected ? '#fff' : '#1C86FF'}
          style={styles.categoryIcon}
        />
        <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
          {getCategoryLabel(item)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderFAQItem = ({ item }) => {
    const isExpanded = expandedId === item._id;

    return (
      <TouchableOpacity
        style={styles.faqItem}
        onPress={() => toggleExpand(item._id)}
        activeOpacity={0.7}
      >
        <View style={styles.faqHeader}>
          <View style={styles.faqIconContainer}>
            <Ionicons
              name={isExpanded ? 'remove-circle' : 'add-circle'}
              size={moderateScale(24)}
              color="#1C86FF"
            />
          </View>
          <Text style={styles.faqQuestion}>{item.question}</Text>
        </View>

        {isExpanded && (
          <View style={styles.faqAnswerContainer}>
            <Text style={styles.faqAnswer}>{item.answer}</Text>

            {item.relatedQuestions && item.relatedQuestions.length > 0 && (
              <View style={styles.relatedSection}>
                <Text style={styles.relatedTitle}>Related Questions:</Text>
                {item.relatedQuestions.map((relatedQ, index) => (
                  <Text key={index} style={styles.relatedQuestion}>
                    • {relatedQ}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText}>Help & FAQs</Text>
    </View>
  );

  if (loading && faqs.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          backgroundColor="#1C86FF"
          titleColor="#fff"
          customTitle={renderTitle()}
          showBack={true}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1C86FF" />
          <Text style={styles.loadingText}>Loading FAQs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        backgroundColor="#1C86FF"
        titleColor="#fff"
        customTitle={renderTitle()}
        showBack={true}
      />

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={moderateScale(20)} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for help..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#999"
          />
          {searching && <ActivityIndicator size="small" color="#1C86FF" />}
          {searchQuery.length > 0 && !searching && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={moderateScale(20)} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* FAQs List */}
        {faqs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="help-circle-outline" size={moderateScale(80)} color="#ccc" />
            <Text style={styles.emptyTitle}>No FAQs Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try different keywords'
                : 'No FAQs available in this category'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={faqs}
            renderItem={renderFAQItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.faqsList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  titleContainer: {
    flex: 1,
  },
  titleText: {
    color: '#fff',
    fontSize: scaleFontSize(24),
    fontFamily: 'SFProBold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: wp(4),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(12),
    marginTop: moderateScale(15),
    marginBottom: moderateScale(15),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: moderateScale(10),
    fontSize: scaleFontSize(15),
    color: '#333',
  },
  categoriesSection: {
    marginBottom: moderateScale(15),
  },
  sectionTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(10),
  },
  categoriesList: {
    paddingRight: wp(4),
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(8),
    backgroundColor: '#E3F2FD',
    borderRadius: moderateScale(20),
    marginRight: moderateScale(10),
    borderWidth: 1,
    borderColor: '#1C86FF',
  },
  categoryChipActive: {
    backgroundColor: '#1C86FF',
    borderColor: '#1C86FF',
  },
  categoryIcon: {
    marginRight: moderateScale(6),
  },
  categoryText: {
    fontSize: scaleFontSize(14),
    color: '#1C86FF',
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#fff',
  },
  faqsList: {
    paddingBottom: moderateScale(20),
  },
  faqItem: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    marginBottom: moderateScale(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  faqIconContainer: {
    marginRight: moderateScale(12),
    marginTop: moderateScale(2),
  },
  faqQuestion: {
    flex: 1,
    fontSize: scaleFontSize(15),
    fontWeight: '600',
    color: '#333',
    lineHeight: scaleFontSize(22),
  },
  faqAnswerContainer: {
    marginTop: moderateScale(12),
    paddingLeft: moderateScale(36),
  },
  faqAnswer: {
    fontSize: scaleFontSize(14),
    color: '#666',
    lineHeight: scaleFontSize(21),
  },
  relatedSection: {
    marginTop: moderateScale(15),
    paddingTop: moderateScale(15),
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  relatedTitle: {
    fontSize: scaleFontSize(13),
    fontWeight: '600',
    color: '#1C86FF',
    marginBottom: moderateScale(8),
  },
  relatedQuestion: {
    fontSize: scaleFontSize(13),
    color: '#666',
    marginBottom: moderateScale(5),
    lineHeight: scaleFontSize(19),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: moderateScale(15),
    fontSize: scaleFontSize(14),
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(10),
  },
  emptyTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    color: '#333',
    marginTop: moderateScale(20),
    marginBottom: moderateScale(8),
  },
  emptySubtitle: {
    fontSize: scaleFontSize(14),
    color: '#666',
    textAlign: 'center',
  },
});
