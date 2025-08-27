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
import { createTransaction } from '../services/transactions';
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
    // If a category is already selected, don't close the modal - just switch categories
    // Reset form fields when switching categories to avoid confusion
    if (selectedCategory && selectedCategory.id !== category.id) {
      resetForm();
    }
    console.log('Selected category:', category.name, category.icon, 'Type:', transactionType);
    
    // Focus on amount field after a short delay to ensure the modal is rendered
    setTimeout(() => {
      // The amount input will auto-focus when the modal appears
    }, 100);
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setIsRecurring(false);
    // Keep currency as is (user preference)
  };

  const handleSaveTransaction = async () => {
    if (!selectedCategory || !amount.trim() || !user) {
      console.log('Missing required fields');
      return;
    }
    
    try {
      const transaction = await createTransaction(
        user.id,
        parseFloat(amount),
        currency,
        description.trim(),
        selectedCategory.id,
        transactionType
      );
      
      if (transaction) {
        console.log('Transaction saved successfully:', transaction);
        
        // Call the callback if provided
        if (onTransactionAdded) {
          onTransactionAdded();
        }
        
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
      } else {
        console.error('Failed to save transaction');
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      // TODO: Show error message to user
    }
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
        onPress={(e) => {
          e.stopPropagation();
          handleCategoryPress(item);
        }}
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
        <TouchableOpacity 
          style={styles.content} 
          activeOpacity={1}
          onPress={() => {
            if (selectedCategory) {
              setSelectedCategory(null);
            }
          }}
        >
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
            <TouchableOpacity style={styles.categoriesContainer} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <FlatList
                data={categories}
                renderItem={renderCategoryItem}
                keyExtractor={(item) => item.id}
                numColumns={4}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.categoriesGrid}
                scrollEnabled={true}
              />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Absolute Form Overlay */}
        {selectedCategory && (
          <View style={[styles.formOverlay, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.formScrollView}>
                {/* Transaction Form */}
                <View style={styles.formContainer}>
                {/* Amount and Description Row */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Description & Amount *</Text>
                  <View style={styles.amountDescriptionRow}>
                    <TextInput
                      style={[
                        styles.compactDescriptionInput,
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
                    <View style={styles.amountSection}>
                      <TextInput
                        style={[
                          styles.compactAmountInput,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                            color: colors.text,
                          }
                        ]}
                        value={amount}
                        onChangeText={(text) => {
                          // Only allow numbers and one decimal point
                          const numericValue = text.replace(/[^0-9.]/g, '');
                          // Prevent multiple decimal points
                          const parts = numericValue.split('.');
                          if (parts.length > 2) {
                            return;
                          }
                          setAmount(numericValue);
                        }}
                        placeholder="0.00"
                        placeholderTextColor={colors.textTertiary}
                        keyboardType="numeric"
                        returnKeyType="done"
                        autoFocus={true}
                        selectTextOnFocus={true}
                      />
                      <TouchableOpacity 
                        style={[styles.compactCurrencyButton, { backgroundColor: colors.surfaceVariant }]}
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
                  <Text style={[styles.characterCount, { color: colors.textTertiary }]}>
                    Description: {description.length}/30
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
            </ScrollView>
          </View>
        )}
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
    paddingBottom: 20,
  },
  // Absolute form overlay styles
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: '45%', // Only cover the top part, not the form area
    backgroundColor: 'transparent',
    zIndex: -1, // Put it behind the categories so categories can be clicked
  },
  formOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formScrollView: {
    flex: 1,
    paddingHorizontal: 20,
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
  // Form styles
  formContainer: {
    paddingBottom: 40,
    paddingHorizontal: 4,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 10,
  },
  amountDescriptionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  amountSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  compactAmountInput: {
    flex: 1,
    height: 50,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  compactCurrencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 4,
  },
  compactDescriptionInput: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    height: 50,
  },
  currencyText: {
    fontSize: 15,
    fontWeight: '600',
  },
  currencyArrow: {
    fontSize: 12,
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
