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
  const [showCalculator, setShowCalculator] = useState(false);
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
    } else if (input === 'done') {
      setShowCalculator(false);
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
                      placeholder="Description"
                      placeholderTextColor={colors.textTertiary}
                      maxLength={30}
                    />
                    <View style={styles.amountSection}>
                      <TouchableOpacity
                        style={[
                          styles.compactAmountInput,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                          }
                        ]}
                        onPress={() => setShowCalculator(true)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.amountInputText,
                          { 
                            color: amount ? colors.text : colors.textTertiary 
                          }
                        ]}>
                          {amount || '0.00'}
                        </Text>
                      </TouchableOpacity>
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

                {/* Date Picker */}
                <View style={styles.inputGroup}>
                  <TouchableOpacity
                    style={[
                      styles.datePickerButton,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      }
                    ]}
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.datePickerContent}>
                      <View style={styles.datePickerTextContainer}>
                        <Text style={[styles.datePickerLabel, { color: colors.textSecondary }]}>
                          Date
                        </Text>
                        <Text style={[styles.datePickerValue, { color: colors.text }]}>
                          {transactionDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </Text>
                      </View>
                      <Text style={[styles.datePickerArrow, { color: colors.textTertiary }]}>▶</Text>
                    </View>
                  </TouchableOpacity>
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

                {/* Recurring Frequency Selector - Always show but disable when recurring is not enabled */}
                <View style={styles.frequencyContainer}>
                  <Text style={[
                    styles.frequencyLabel, 
                    { 
                      color: isRecurring ? colors.text : colors.textTertiary,
                    }
                  ]}>
                    Frequency
                  </Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.frequencyOptions}
                  >
                    {['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually'].map((freq) => (
                      <TouchableOpacity
                        key={freq}
                        style={[
                          styles.frequencyOption,
                          {
                            backgroundColor: (isRecurring && recurringFrequency === freq) ? colors.primary : colors.surface,
                            borderColor: (isRecurring && recurringFrequency === freq) ? colors.primary : colors.border,
                            opacity: isRecurring ? 1 : 0.4,
                          }
                        ]}
                        onPress={() => {
                          if (isRecurring) {
                            setRecurringFrequency(freq as RecurringFrequency);
                          }
                        }}
                        activeOpacity={isRecurring ? 0.7 : 1}
                        disabled={!isRecurring}
                      >
                        <Text style={[
                          styles.frequencyOptionText,
                          { 
                            color: (isRecurring && recurringFrequency === freq) ? '#ffffff' : (isRecurring ? colors.text : colors.textTertiary),
                            fontWeight: (isRecurring && recurringFrequency === freq) ? '600' : '400'
                          }
                        ]}>
                          {freq.charAt(0).toUpperCase() + freq.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

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
                    {editingTransaction ? 'Update' : 'Save'} {transactionType.charAt(0).toUpperCase() + transactionType.slice(1)}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
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

      {/* Calculator Modal */}
      <Modal
        visible={showCalculator}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCalculator(false)}
      >
        <TouchableOpacity 
          style={styles.calculatorOverlay}
          activeOpacity={1}
          onPress={() => setShowCalculator(false)}
        >
          <View style={[styles.calculatorContainer, { backgroundColor: colors.surface }]}>
            <TouchableOpacity 
              activeOpacity={1} 
              onPress={(e) => e.stopPropagation()}
            >
              {/* Calculator Display */}
              <View style={[styles.calculatorDisplay, { backgroundColor: colors.surfaceVariant }]}>
                <Text style={[styles.calculatorAmount, { color: colors.text }]}>
                  ${amount || '0.00'}
                </Text>
              </View>

              {/* Calculator Buttons */}
              <View style={styles.calculatorButtons}>
                {/* Row 1 */}
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
                  <View style={styles.calculatorButton} />
                  <TouchableOpacity 
                    style={[styles.calculatorButton, styles.calculatorButtonPrimary, { backgroundColor: colors.primary }]}
                    onPress={() => handleCalculatorInput('done')}
                  >
                    <Text style={[styles.calculatorButtonText, { color: '#ffffff' }]}>Done</Text>
                  </TouchableOpacity>
                </View>

                {/* Row 2 */}
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
                  <View style={styles.calculatorButton} />
                </View>

                {/* Row 3 */}
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
                  <View style={styles.calculatorButton} />
                </View>

                {/* Row 4 */}
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
                  <View style={styles.calculatorButton} />
                </View>

                {/* Row 5 */}
                <View style={styles.calculatorRow}>
                  <TouchableOpacity 
                    style={[styles.calculatorButton, styles.calculatorButtonWide, { backgroundColor: colors.background }]}
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
                  <View style={styles.calculatorButton} />
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
    height: '55%',
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
    paddingBottom: 20,
    paddingHorizontal: 4,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 15,
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
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  amountInputText: {
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
    marginBottom: 20,
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
  frequencyContainer: {
    marginBottom: 20,
  },
  frequencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  frequencyOptions: {
    gap: 8,
    paddingHorizontal: 4,
  },
  frequencyOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
  },
  frequencyOptionText: {
    fontSize: 14,
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
    gap: 10,
  },
  calculatorButton: {
    flex: 1,
    height: 60,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
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
});
