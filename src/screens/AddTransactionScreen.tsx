import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  useColorScheme,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Animated,
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
  
  // Transaction form fields
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  // Animation values
  const slideAnim = useRef(new Animated.Value(300)).current; // Start 300px below
  const fadeAnim = useRef(new Animated.Value(0)).current; // Start transparent

  // Load categories when component mounts or transaction type changes
  useEffect(() => {
    loadCategories();
  }, [user, transactionType]);

  // Separate effect for initial animation only
  useEffect(() => {
    // Start slide-up animation when component mounts
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []); // Empty dependency array - only run on mount

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
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setIsRecurring(false);
    // Keep currency as is (user preference)
  };

  const handleSaveTransaction = () => {
    if (!selectedCategory || !amount.trim()) {
      console.log('Missing required fields');
      return;
    }
    
    const transactionData = {
      category: selectedCategory,
      type: transactionType,
      amount: parseFloat(amount),
      currency,
      description: description.trim(),
      isRecurring,
    };
    
    console.log('Saving transaction:', transactionData);
    // TODO: Implement actual transaction saving
    
    // Slide down animation before closing
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleClose = () => {
    // Slide down animation before closing
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
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
      
      <Animated.View 
        style={[
          styles.animatedContainer,
          {
            transform: [{ translateY: slideAnim }],
            opacity: fadeAnim,
          }
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Transaction</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
            <View style={styles.categoriesContainer}>
              <FlatList
                data={categories}
                renderItem={renderCategoryItem}
                keyExtractor={(item) => item.id}
                numColumns={4}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.categoriesGrid}
                scrollEnabled={false}
              />
              
              {selectedCategory && (
                <View style={styles.formSection}>
                  {/* Selected Category Display */}
                  <View style={[styles.selectedCategoryInfo, { backgroundColor: colors.surfaceVariant }]}>
                    <Text style={[styles.selectedCategoryText, { color: colors.text }]}>
                      {selectedCategory.icon} {selectedCategory.name}
                    </Text>
                  </View>

                  {/* Transaction Form */}
                  <View style={styles.formContainer}>
                    {/* Amount Input */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.text }]}>Amount *</Text>
                      <View style={styles.amountContainer}>
                        <TextInput
                          style={[
                            styles.amountInput,
                            {
                              backgroundColor: colors.surface,
                              borderColor: colors.border,
                              color: colors.text,
                            }
                          ]}
                          value={amount}
                          onChangeText={setAmount}
                          placeholder="0.00"
                          placeholderTextColor={colors.textTertiary}
                          keyboardType="decimal-pad"
                          autoFocus
                        />
                        <TouchableOpacity 
                          style={[styles.currencyButton, { backgroundColor: colors.surfaceVariant }]}
                          onPress={() => {
                            // TODO: Add currency picker
                            console.log('Currency picker not implemented yet');
                          }}
                        >
                          <Text style={[styles.currencyText, { color: colors.text }]}>{currency}</Text>
                          <Text style={[styles.currencyArrow, { color: colors.textSecondary }]}>▼</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Description Input */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.text }]}>Description</Text>
                      <TextInput
                        style={[
                          styles.descriptionInput,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                            color: colors.text,
                          }
                        ]}
                        value={description}
                        onChangeText={(text) => {
                          // Limit to 30 characters
                          if (text.length <= 30) {
                            setDescription(text);
                          }
                        }}
                        placeholder="Quick note (optional)"
                        placeholderTextColor={colors.textTertiary}
                        maxLength={30}
                      />
                      <Text style={[styles.characterCount, { color: colors.textTertiary }]}>
                        {description.length}/30
                      </Text>
                    </View>

                    {/* Recurring Checkbox */}
                    <TouchableOpacity 
                      style={styles.checkboxContainer}
                      onPress={() => setIsRecurring(!isRecurring)}
                      activeOpacity={0.7}
                    >
                      <View 
                        style={[
                          styles.checkbox,
                          {
                            backgroundColor: isRecurring ? colors.primary : 'transparent',
                            borderColor: isRecurring ? colors.primary : colors.border,
                          }
                        ]}
                      >
                        {isRecurring && (
                          <Text style={styles.checkmark}>✓</Text>
                        )}
                      </View>
                      <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                        Recurring transaction
                      </Text>
                    </TouchableOpacity>

                    {/* Save Button */}
                    <TouchableOpacity
                      style={[
                        styles.saveButton,
                        {
                          backgroundColor: colors.primary,
                          opacity: (!amount.trim()) ? 0.5 : 1,
                        }
                      ]}
                      onPress={handleSaveTransaction}
                      disabled={!amount.trim()}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.saveButtonText}>
                        Save {transactionType.charAt(0).toUpperCase() + transactionType.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  animatedContainer: {
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
    paddingTop: 15,
  },
  transactionTypeContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 15,
  },
  transactionTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionTypeText: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
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
  categoriesContainer: {
    flex: 1,
  },
  categoriesGrid: {
    paddingBottom: 10,
  },
  formSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(167, 139, 250, 0.2)',
    minHeight: 400,
  },
  categoryItem: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    marginHorizontal: '1%',
    padding: 6,
  },
  categoryIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  categoryName: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedCategoryInfo: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  selectedCategoryText: {
    fontSize: 18,
    fontWeight: '600',
  },
  // Form styles
  formContainer: {
    paddingBottom: 30,
    paddingHorizontal: 4,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 10,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amountInput: {
    flex: 1,
    height: 60,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 18,
    fontSize: 20,
    fontWeight: '600',
  },
  currencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: 12,
    gap: 8,
  },
  currencyText: {
    fontSize: 17,
    fontWeight: '600',
  },
  currencyArrow: {
    fontSize: 14,
  },
  descriptionInput: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 17,
    height: 56,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    gap: 14,
    paddingVertical: 8,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 17,
    flex: 1,
  },
  saveButton: {
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: 18,
    textAlign: 'center',
  },
});
