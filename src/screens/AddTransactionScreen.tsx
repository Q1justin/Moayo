import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  useColorScheme,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { fetchCategories } from '../services/categories';
import { Category, TransactionType } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AddTransactionScreenProps {
  onClose: () => void;
  onTransactionAdded?: () => void;
}

export default function AddTransactionScreen({ onClose, onTransactionAdded }: AddTransactionScreenProps): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');

  // Load categories when component mounts or transaction type changes
  useEffect(() => {
    loadCategories();
  }, [user, transactionType]);

  const loadCategories = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const fetchedCategories = await fetchCategories(user.id, transactionType);
      setCategories(fetchedCategories);
      // Reset selected category when switching transaction types
      setSelectedCategory(null);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionTypeChange = (type: TransactionType) => {
    setTransactionType(type);
  };

  const handleCategoryPress = (category: Category) => {
    setSelectedCategory(category);
    console.log('Selected category:', category.name, category.icon, 'Type:', transactionType);
    // TODO: We'll implement the rest of the transaction form later
  };

  // Purple theme colors (consistent with HomePage)
  const colors = {
    primary: '#A78BFA', // Lighter main purple
    primaryDark: '#8B5CF6', // Medium purple for accents
    primaryLight: '#C4B5FD', // Very light purple
    background: isDarkMode ? '#1a1a1a' : '#F8F6FF',
    surface: isDarkMode ? '#2a2a2a' : '#ffffff',
    surfaceVariant: isDarkMode ? '#3a3a3a' : '#EDE9FE',
    border: isDarkMode ? '#4a4a4a' : '#C4B5FD',
    text: isDarkMode ? '#ffffff' : '#000000',
    textSecondary: isDarkMode ? '#cccccc' : '#666666',
    textTertiary: isDarkMode ? '#888888' : '#999999',
    expense: '#FF4757',
    income: '#2ED573',
  };

  const renderCategoryItem = ({ item }: { item: Category }) => {
    const isSelected = selectedCategory?.id === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          {
            backgroundColor: isSelected ? colors.primary : colors.surface,
            borderColor: isSelected ? colors.primaryDark : colors.border,
          }
        ]}
        onPress={() => handleCategoryPress(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.categoryIcon}>{item.icon || '📦'}</Text>
        <Text
          style={[
            styles.categoryName,
            {
              color: isSelected ? '#ffffff' : colors.text,
            }
          ]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Transaction</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Transaction Type Toggle */}
        <View style={[styles.transactionTypeContainer, { backgroundColor: colors.surfaceVariant }]}>
          <TouchableOpacity
            style={[
              styles.transactionTypeButton,
              {
                backgroundColor: transactionType === 'expense' ? colors.primaryDark : 'transparent',
              }
            ]}
            onPress={() => handleTransactionTypeChange('expense')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.transactionTypeText,
                {
                  color: transactionType === 'expense' ? '#ffffff' : colors.text,
                  fontWeight: transactionType === 'expense' ? '600' : '500',
                }
              ]}
            >
              Expense
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.transactionTypeButton,
              {
                backgroundColor: transactionType === 'income' ? colors.primaryDark : 'transparent',
              }
            ]}
            onPress={() => handleTransactionTypeChange('income')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.transactionTypeText,
                {
                  color: transactionType === 'income' ? '#ffffff' : colors.text,
                  fontWeight: transactionType === 'income' ? '600' : '500',
                }
              ]}
            >
              Income
            </Text>
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Select Category
        </Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading categories...
            </Text>
          </View>
        ) : (
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            numColumns={4}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.categoriesGrid}
          />
        )}
        
        {selectedCategory && (
          <View style={[styles.selectedCategoryInfo, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={[styles.selectedCategoryText, { color: colors.text }]}>
              Selected: {selectedCategory.icon} {selectedCategory.name}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  transactionTypeContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  transactionTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionTypeText: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  categoriesGrid: {
    paddingBottom: 20,
  },
  categoryItem: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginHorizontal: '1%',
    padding: 8,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedCategoryInfo: {
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    alignItems: 'center',
  },
  selectedCategoryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: 18,
    textAlign: 'center',
  },
});
