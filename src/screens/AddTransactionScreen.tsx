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
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { fetchCategories } from '../services/categories';
import { createTransaction, updateTransaction } from '../services/transactions';
import { createRecurringTemplate } from '../services/recurringTemplates';
import { Category, TransactionType, TransactionWithCategory, RecurringFrequency } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AddTransactionScreenProps {
  onClose: () => void;
  onTransactionAdded?: () => void;
  editingTransaction?: TransactionWithCategory | null;
}

// TODO: Implement caching on categories

export default function AddTransactionScreen({ onClose, onTransactionAdded, editingTransaction }: AddTransactionScreenProps): React.JSX.Element {
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
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>('monthly');

  // Animation values
  const slideAnim = useRef(new Animated.Value(300)).current; // Start 300px below
  const fadeAnim = useRef(new Animated.Value(0)).current; // Start transparent

  // Load categories when component mounts or transaction type changes
  useEffect(() => {
    loadCategories();
  }, [user, transactionType]);

  // Populate form when editing a transaction
  useEffect(() => {
    if (editingTransaction) {
      setAmount(editingTransaction.amount.toString());
      setCurrency(editingTransaction.currency);
      setDescription(editingTransaction.description || '');
      setTransactionType(editingTransaction.type);
      
      // Set the transaction date - parse it in local timezone to avoid UTC conversion issues
      const dateParts = editingTransaction.date.split('-');
      const transactionDateFromDB = new Date(
        parseInt(dateParts[0]), // year
        parseInt(dateParts[1]) - 1, // month (0-indexed)
        parseInt(dateParts[2]) // day
      );
      setTransactionDate(transactionDateFromDB);
      
      // Check if this transaction came from a recurring template
      if (editingTransaction.recurring_template_id) {
        setIsRecurring(true);
        // If we have the recurring template data, set the frequency
        if (editingTransaction.recurring_template?.frequency) {
          setRecurringFrequency(editingTransaction.recurring_template.frequency as RecurringFrequency);
        }
      } else {
        setIsRecurring(false);
        setRecurringFrequency('monthly'); // Reset to default
      }
      
      // The category will be set when categories are loaded
    }
  }, [editingTransaction]);

  // Set selected category when categories are loaded and we're editing
  useEffect(() => {
    if (editingTransaction && categories.length > 0) {
      const category = categories.find(cat => cat.id === editingTransaction.category_id);
      if (category) {
        setSelectedCategory(category);
      }
    }
  }, [editingTransaction, categories]);

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
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setIsRecurring(false);
    // Keep currency as is (user preference)
  };

  // Calculator functions
  const handleCalculatorInput = (input: string) => {
    if (input === 'clear') {
      setAmount('');
    } else if (input === 'backspace') {
      setAmount(prev => prev.slice(0, -1));
    } else if (input === '.') {
      // Only allow one decimal point
      if (!amount.includes('.')) {
        setAmount(prev => prev + input);
      }
    } else {
      // Number input
      if (amount.includes('.')) {
        // If there's already a decimal, only allow 2 digits after it
        const parts = amount.split('.');
        if (parts[1] && parts[1].length >= 2) {
          return; // Don't add more digits after 2 decimal places
        }
      }
      setAmount(prev => prev + input);
    }
  };

  const handleSaveTransaction = async () => {
    if (!selectedCategory || !amount.trim() || !user) {
      console.log('Missing required fields');
      return;
    }
    
    try {
      let transaction;
      
      if (editingTransaction) {
        // Format the selected date for the database
        const year = transactionDate.getFullYear();
        const month = String(transactionDate.getMonth() + 1).padStart(2, '0');
        const day = String(transactionDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        
        // Update existing transaction
        transaction = await updateTransaction(
          editingTransaction.id,
          parseFloat(amount),
          currency,
          description.trim(),
          selectedCategory.id,
          transactionType,
          formattedDate
        );
      } else {
        // If recurring is enabled, create the recurring template first
        let templateId: string | undefined = undefined;
        if (isRecurring) {
          const today = new Date();
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, '0');
          const day = String(today.getDate()).padStart(2, '0');
          const startDate = `${year}-${month}-${day}`;
          
          const recurringTemplate = await createRecurringTemplate(
            user.id,
            selectedCategory.id,
            transactionType,
            parseFloat(amount),
            currency,
            description.trim(),
            startDate,
            recurringFrequency
          );
          
          if (recurringTemplate) {
            templateId = recurringTemplate.id;
            console.log('Recurring template created successfully:', recurringTemplate);
          } else {
            console.error('Failed to create recurring template');
            // Continue with transaction creation anyway
          }
        }
        
        // Format the selected date for the database
        const year = transactionDate.getFullYear();
        const month = String(transactionDate.getMonth() + 1).padStart(2, '0');
        const day = String(transactionDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        
        // Create new transaction (with template ID if recurring)
        transaction = await createTransaction(
          user.id,
          parseFloat(amount),
          currency,
          description.trim(),
          selectedCategory.id,
          transactionType,
          formattedDate, // use selected date
          templateId // pass template ID if recurring
        );
      }
      
      if (transaction) {
        console.log(`Transaction ${editingTransaction ? 'updated' : 'created'} successfully:`, transaction);
        
        // Call the callback if provided
        if (onTransactionAdded) {
          onTransactionAdded();
        }
        
        // Close calculator first
        setSelectedCategory(null);
        
        // Small delay then slide down animation before closing
        setTimeout(() => {
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
        }, 100);
      } else {
        console.error(`Failed to ${editingTransaction ? 'update' : 'save'} transaction`);
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error(`Error ${editingTransaction ? 'updating' : 'saving'} transaction:`, error);
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
          <Text style={styles.headerTitle}>
            {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
          </Text>
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
        </View>


      </Animated.View>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDatePicker(false)}
        >
          <View style={[styles.datePickerContainer, { backgroundColor: colors.surface }]}>
            <TouchableOpacity 
              activeOpacity={1} 
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={[styles.datePickerTitle, { color: colors.text }]}>Select Transaction Date</Text>
              
              {/* Month Navigation */}
              <View style={styles.monthNavigation}>
                <TouchableOpacity 
                  style={[styles.monthButton, { backgroundColor: colors.surfaceVariant }]}
                  onPress={() => {
                    const newDate = new Date(transactionDate);
                    newDate.setMonth(newDate.getMonth() - 1);
                    setTransactionDate(newDate);
                  }}
                >
                  <Text style={[styles.monthButtonText, { color: colors.text }]}>◀</Text>
                </TouchableOpacity>
                
                <Text style={[styles.monthTitle, { color: colors.text }]}>
                  {transactionDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Text>
                
                <TouchableOpacity 
                  style={[styles.monthButton, { backgroundColor: colors.surfaceVariant }]}
                  onPress={() => {
                    const newDate = new Date(transactionDate);
                    newDate.setMonth(newDate.getMonth() + 1);
                    setTransactionDate(newDate);
                  }}
                >
                  <Text style={[styles.monthButtonText, { color: colors.text }]}>▶</Text>
                </TouchableOpacity>
              </View>

              {/* Day Headers */}
              <View style={styles.dayHeaders}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <Text key={day} style={[styles.dayHeader, { color: colors.textSecondary }]}>
                    {day}
                  </Text>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {(() => {
                  const year = transactionDate.getFullYear();
                  const month = transactionDate.getMonth();
                  const firstDay = new Date(year, month, 1);
                  const startDate = new Date(firstDay);
                  startDate.setDate(startDate.getDate() - firstDay.getDay());
                  
                  const days = [];
                  const today = new Date();
                  
                  for (let i = 0; i < 42; i++) {
                    const currentDate = new Date(startDate);
                    currentDate.setDate(startDate.getDate() + i);
                    
                    const isCurrentMonth = currentDate.getMonth() === month;
                    const isToday = currentDate.toDateString() === today.toDateString();
                    const isSelected = currentDate.toDateString() === transactionDate.toDateString();
                    
                    days.push(
                      <TouchableOpacity
                        key={i}
                        style={[
                          styles.calendarDay,
                          isSelected && { backgroundColor: colors.primary },
                          isToday && !isSelected && { backgroundColor: colors.primaryLight },
                        ]}
                        onPress={() => {
                          setTransactionDate(new Date(currentDate));
                          setShowDatePicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.calendarDayText,
                            { color: isCurrentMonth ? colors.text : colors.textTertiary },
                            isSelected && { color: '#ffffff', fontWeight: 'bold' },
                            isToday && !isSelected && { color: colors.primaryDark, fontWeight: 'bold' },
                          ]}
                        >
                          {currentDate.getDate()}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                  
                  return days;
                })()}
              </View>

              {/* Today Button */}
              <TouchableOpacity
                style={[styles.todayButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setTransactionDate(new Date());
                  setShowDatePicker(false);
                }}
              >
                <Text style={styles.todayButtonText}>Today</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Calculator Modal with Integrated Form */}
      <Modal
        visible={selectedCategory !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedCategory(null)}
      >
        <TouchableOpacity 
          style={styles.calculatorOverlay}
          activeOpacity={1}
          onPress={() => setSelectedCategory(null)}
        >
          <View style={[styles.calculatorContainer, { backgroundColor: colors.surface }]}>
            <TouchableOpacity 
              activeOpacity={1} 
              onPress={(e) => e.stopPropagation()}
            >
              {/* Calculator Display with Selected Category */}
              <View style={[styles.calculatorDisplay, { backgroundColor: colors.surfaceVariant }]}>
                {selectedCategory && (
                  <View style={styles.calculatorCategoryInfo}>
                    <Text style={[styles.calculatorCategoryText, { color: colors.text }]}>
                      {selectedCategory.icon} {selectedCategory.name}
                    </Text>
                  </View>
                )}
                <Text style={[styles.calculatorAmount, { color: colors.text }]}>
                  ${amount || '0.00'}
                </Text>
              </View>

              {/* Form Fields Row */}
              <View style={[styles.calculatorFormSection, { backgroundColor: colors.background }]}>
                {/* Description - full width multiline, moved below the amount display */}
                <View style={styles.descriptionContainer}>
                  <TextInput
                    style={[
                      styles.descriptionInput,
                      {
                        backgroundColor: colors.background,
                        borderWidth: 0,
                        color: colors.text,
                      }
                    ]}
                    value={description}
                    onChangeText={(text) => {
                      if (text.length <= 100) {
                        setDescription(text);
                      }
                    }}
                    placeholder="Enter description"
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                    maxLength={100}
                  />
                </View>

                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.formFieldsRow}
                >
                  {/* Date Field */}
                  <TouchableOpacity 
                    style={styles.formFieldContainer}
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.formFieldLabel, { color: colors.textSecondary }]}>Date</Text>
                    <View style={[
                      styles.formFieldInputNoBorder,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        justifyContent: 'center',
                      }
                    ]}>
                      <Text style={[styles.formFieldText, { color: colors.text }]}> 
                        {transactionDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Currency Field */}
                  <TouchableOpacity 
                    style={styles.formFieldContainer}
                    onPress={() => {
                      // TODO: Add currency picker
                      console.log('Currency picker not implemented yet');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.formFieldLabel, { color: colors.textSecondary }]}>Currency</Text>
                    <View style={[
                      styles.formFieldInputNoBorder,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }
                    ]}>
                      <Text style={[styles.formFieldText, { color: colors.text }]}>{currency}</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Recurring Toggle */}
                  <TouchableOpacity 
                    style={styles.formFieldContainer}
                    onPress={() => setIsRecurring(!isRecurring)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.formFieldLabel, { color: colors.textSecondary }]}>Recurring</Text>
                    <View style={[
                      styles.formFieldInputNoBorder,
                      {
                        backgroundColor: isRecurring ? colors.primary : colors.surface,
                        borderColor: isRecurring ? colors.primary : colors.border,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }
                    ]}>
                      <Text style={[
                        styles.formFieldText, 
                        { color: isRecurring ? '#ffffff' : colors.text }
                      ]}>
                        {isRecurring ? '✓' : '○'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Frequency Field - only show if recurring is enabled */}
                  {isRecurring && (
                    <TouchableOpacity 
                      style={styles.formFieldContainer}
                      onPress={() => {
                        // Cycle through frequencies
                        const frequencies: RecurringFrequency[] = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually'];
                        const currentIndex = frequencies.indexOf(recurringFrequency);
                        const nextIndex = (currentIndex + 1) % frequencies.length;
                        setRecurringFrequency(frequencies[nextIndex]);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.formFieldLabel, { color: colors.textSecondary }]}>Frequency</Text>
                      <View style={[
                        styles.formFieldInputNoBorder,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          justifyContent: 'center',
                          alignItems: 'center',
                          minWidth: 100,
                        }
                      ]}>
                        <Text style={[styles.formFieldText, { color: colors.text, fontSize: 12 }]}> 
                          {recurringFrequency.charAt(0).toUpperCase() + recurringFrequency.slice(1)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </View>

              {/* Calculator Buttons */}
              <View style={styles.calculatorButtons}>
                {/* Row 1: Clear, Backspace, Close */}
                <View style={styles.calculatorRow}>
                  <TouchableOpacity 
                    style={[styles.calculatorButton, styles.calculatorButtonSecondary, { backgroundColor: colors.surfaceVariant }]}
                    onPress={() => handleCalculatorInput('clear')}
                  >
                    <Text style={[styles.calculatorButtonText, { color: colors.text }]}>C</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.calculatorButton, styles.calculatorButtonSecondary, { backgroundColor: colors.surfaceVariant }]}
                    onPress={() => handleCalculatorInput('backspace')}
                  >
                    <Text style={[styles.calculatorButtonText, { color: colors.text }]}>⌫</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.calculatorButton, styles.calculatorButtonSecondary, { backgroundColor: colors.surfaceVariant }]}
                    onPress={() => setSelectedCategory(null)}
                  >
                    <Text style={[styles.calculatorButtonText, { color: colors.text }]}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Row 2: 7 8 9 */}
                <View style={styles.calculatorRow}>
                  <TouchableOpacity 
                    style={[styles.calculatorButton, { backgroundColor: colors.background }]}
                    onPress={() => handleCalculatorInput('7')}
                  >
                    <Text style={[styles.calculatorButtonText, { color: colors.text }]}>7</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.calculatorButton, { backgroundColor: colors.background }]}
                    onPress={() => handleCalculatorInput('8')}
                  >
                    <Text style={[styles.calculatorButtonText, { color: colors.text }]}>8</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.calculatorButton, { backgroundColor: colors.background }]}
                    onPress={() => handleCalculatorInput('9')}
                  >
                    <Text style={[styles.calculatorButtonText, { color: colors.text }]}>9</Text>
                  </TouchableOpacity>
                </View>

                {/* Row 3: 4 5 6 */}
                <View style={styles.calculatorRow}>
                  <TouchableOpacity 
                    style={[styles.calculatorButton, { backgroundColor: colors.background }]}
                    onPress={() => handleCalculatorInput('4')}
                  >
                    <Text style={[styles.calculatorButtonText, { color: colors.text }]}>4</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.calculatorButton, { backgroundColor: colors.background }]}
                    onPress={() => handleCalculatorInput('5')}
                  >
                    <Text style={[styles.calculatorButtonText, { color: colors.text }]}>5</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.calculatorButton, { backgroundColor: colors.background }]}
                    onPress={() => handleCalculatorInput('6')}
                  >
                    <Text style={[styles.calculatorButtonText, { color: colors.text }]}>6</Text>
                  </TouchableOpacity>
                </View>

                {/* Row 4: 1 2 3 */}
                <View style={styles.calculatorRow}>
                  <TouchableOpacity 
                    style={[styles.calculatorButton, { backgroundColor: colors.background }]}
                    onPress={() => handleCalculatorInput('1')}
                  >
                    <Text style={[styles.calculatorButtonText, { color: colors.text }]}>1</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.calculatorButton, { backgroundColor: colors.background }]}
                    onPress={() => handleCalculatorInput('2')}
                  >
                    <Text style={[styles.calculatorButtonText, { color: colors.text }]}>2</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.calculatorButton, { backgroundColor: colors.background }]}
                    onPress={() => handleCalculatorInput('3')}
                  >
                    <Text style={[styles.calculatorButtonText, { color: colors.text }]}>3</Text>
                  </TouchableOpacity>
                </View>

                {/* Row 5: 0 , . , spacer */}
                <View style={styles.calculatorRow}>
                  <TouchableOpacity 
                    style={[styles.calculatorButton, { backgroundColor: colors.background }]}
                    onPress={() => handleCalculatorInput('0')}
                  >
                    <Text style={[styles.calculatorButtonText, { color: colors.text }]}>0</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.calculatorButton, { backgroundColor: colors.background }]}
                    onPress={() => handleCalculatorInput('.')}
                  >
                    <Text style={[styles.calculatorButtonText, { color: colors.text }]}>.</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.calculatorButton, styles.calculatorButtonPrimary, { backgroundColor: colors.primary }]}
                    onPress={handleSaveTransaction}
                    disabled={!amount.trim()}
                  >
                    <Text style={[styles.calculatorButtonText, { color: '#ffffff' }]}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  // Date picker styles
  datePickerButton: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    minHeight: 50,
  },
  datePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerTextContainer: {
    flex: 1,
  },
  datePickerLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  datePickerValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  datePickerArrow: {
    fontSize: 14,
  },
  // Date Picker Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    width: '90%',
    maxWidth: 350,
    borderRadius: 16,
    padding: 20,
  },
  datePickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  monthButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 6,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    marginBottom: 2,
  },
  calendarDayText: {
    fontSize: 14,
  },
  todayButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  todayButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Calculator styles
  calculatorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  calculatorContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  calculatorDisplay: {
    padding: 20,
    alignItems: 'flex-end',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  calculatorAmount: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  calculatorButtons: {
    padding: 20,
    paddingTop: 10,
  },
  calculatorRow: {
    flexDirection: 'row',
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  calculatorButton: {
    flex: 1,
    height: 60,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: 4,
  },
  calculatorButtonEmpty: {
    flex: 1,
    height: 60,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  calculatorButtonWide: {
    flex: 2,
  },
  calculatorButtonSecondary: {
    // Additional styling for secondary buttons like Clear, Backspace
  },
  calculatorButtonPrimary: {
    // Additional styling for primary button like Done
  },
  calculatorButtonText: {
    fontSize: 24,
    fontWeight: '600',
  },
  // Calculator form integration styles
  calculatorCategoryInfo: {
    marginBottom: 8,
    alignItems: 'center',
  },
  calculatorCategoryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  calculatorFormSection: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  formFieldsRow: {
    gap: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  formFieldContainer: {
    minWidth: 120,
    alignItems: 'center',
  },
  formFieldInputNoBorder: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 0,
    minWidth: 80,
  },
  formFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  formFieldInput: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
  },
  formFieldText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Description specific styles
  descriptionContainer: {
    width: '100%',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  descriptionInput: {
    width: '100%',
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 0,
    fontSize: 16,
    textAlign: 'right',
    textAlignVertical: 'top',
  },
});
