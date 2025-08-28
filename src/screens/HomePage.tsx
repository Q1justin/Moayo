import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { fetchTransactions, TimeFilter } from '../services/transactions';
import { supabase, TransactionWithCategory } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AddTransactionScreen from './AddTransactionScreen';

export default function HomePage(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const { user, signOut } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<TimeFilter>('week');
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [mockDataMode, setMockDataMode] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithCategory | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Get current user and fetch transactions
  useEffect(() => {
    if (user) {
      loadTransactions();
    } else {
      // Fallback to mock data if no user (shouldn't happen in this flow, but safe)
      setMockDataMode(true);
      loadMockData();
    }
  }, [user, selectedFilter, selectedDate]);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: signOut 
        }
      ]
    );
  };

  const loadMockData = () => {
    const mockTransactions: TransactionWithCategory[] = [
      {
        id: '1',
        user_id: 'mock-user',
        description: 'Coffee Shop',
        amount: 4.50,
        currency: 'USD',
        type: 'expense',
        date: '2025-08-18',
        exchange_rate_to_usd: 1.0,
        created_at: '2025-08-18T09:15:00Z',
        updated_at: '2025-08-18T09:15:00Z',
        category_id: 'cat1',
        category: {
          name: 'Food',
          icon: '☕',
          color: '#FF6B6B',
          transaction_type: 'expense'
        }
      },
      {
        id: '2',
        user_id: 'mock-user',
        description: 'Salary',
        amount: 2500.00,
        currency: 'USD',
        type: 'income',
        date: '2025-08-15',
        exchange_rate_to_usd: 1.0,
        created_at: '2025-08-15T12:00:00Z',
        updated_at: '2025-08-15T12:00:00Z',
        category_id: 'cat2',
        category: {
          name: 'Income',
          icon: '💼',
          color: '#4ECDC4',
          transaction_type: 'income'
        }
      },
      {
        id: '3',
        user_id: 'mock-user',
        description: 'Netflix Subscription',
        amount: 15.99,
        currency: 'USD',
        type: 'expense',
        date: '2025-08-12',
        exchange_rate_to_usd: 1.0,
        created_at: '2025-08-12T15:20:00Z',
        updated_at: '2025-08-12T15:20:00Z',
        category_id: 'cat3',
        category: {
          name: 'Entertainment',
          icon: '🎬',
          color: '#A78BFA',
          transaction_type: 'expense'
        }
      },
      {
        id: '4',
        user_id: 'mock-user',
        description: 'Grocery Store',
        amount: 85.40,
        currency: 'USD',
        type: 'expense',
        date: '2025-08-10',
        exchange_rate_to_usd: 1.0,
        created_at: '2025-08-10T18:45:00Z',
        updated_at: '2025-08-10T18:45:00Z',
        category_id: 'cat4',
        category: {
          name: 'Food',
          icon: '🛒',
          color: '#FF6B6B',
          transaction_type: 'expense'
        }
      },
    ];
    
    setTransactions(mockTransactions);
    setLoading(false);
  };

  // Reload transactions when filter changes
  useEffect(() => {
    if (mockDataMode) {
      // In mock mode, just reload the same data
      loadMockData();
    } else if (user) {
      loadTransactions();
    }
  }, [selectedFilter, user, mockDataMode]);

    const loadTransactions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const fetchedTransactions = await fetchTransactions(user.id, selectedFilter, 20, selectedDate);
      setTransactions(fetchedTransactions);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to get date range display based on filter and selected date
  const getDateRangeDisplay = () => {
    switch (selectedFilter) {
      case 'day':
        return selectedDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'short', 
          day: 'numeric' 
        });
      
      case 'week':
        // Get the Monday of the week containing selectedDate
        const weekStart = new Date(selectedDate);
        const dayOfWeek = weekStart.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so we need 6 days back
        weekStart.setDate(weekStart.getDate() - daysToMonday);
        
        // Get the Sunday of the same week
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        // Format: "Mon 25 - Sun 31"
        const startStr = weekStart.toLocaleDateString('en-US', { 
          weekday: 'short', 
          day: 'numeric' 
        });
        const endStr = weekEnd.toLocaleDateString('en-US', { 
          weekday: 'short', 
          day: 'numeric' 
        });
        return `${startStr} - ${endStr}`;
      
      case 'month':
        return selectedDate.toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        });
      
      default:
        return 'Filter';
    }
  };

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#F8F6FF',
  };

  // Purple theme colors
  const colors = {
    primary: '#A78BFA', // Lighter main purple
    primaryDark: '#8B5CF6', // Medium purple for accents
    primaryLight: '#C4B5FD', // Very light purple
    primaryVeryLight: '#EDE9FE', // Extremely light purple for cards
    background: isDarkMode ? '#1a1a1a' : '#F8F6FF',
    surface: isDarkMode ? '#2a2a2a' : '#EDE9FE',
    surfaceVariant: isDarkMode ? '#3a3a3a' : '#DDD6FE',
    border: isDarkMode ? '#4a4a4a' : '#C4B5FD',
    text: isDarkMode ? '#ffffff' : '#000000',
    textSecondary: isDarkMode ? '#cccccc' : '#666666',
    textTertiary: isDarkMode ? '#888888' : '#999999',
    expense: '#FF4757',
    income: '#2ED573',
  };

  // Group transactions by date
  const groupTransactionsByDate = (transactions: TransactionWithCategory[]) => {
    const grouped: { [key: string]: TransactionWithCategory[] } = {};
    
    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      const dateKey = transactionDate.toDateString(); // This gives us a unique key per day
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(transaction);
    });
    
    return grouped;
  };

  // Create flattened list with date headers
  const createFlattenedList = (transactions: TransactionWithCategory[]) => {
    const grouped = groupTransactionsByDate(transactions);
    const flattened: Array<{ type: 'header' | 'transaction'; data: any; id: string }> = [];
    
    // Sort date groups by date (most recent first)
    const sortedDates = Object.keys(grouped).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });
    
    sortedDates.forEach(dateKey => {
      const transactionDate = new Date(dateKey);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      
      let displayDate;
      if (transactionDate.toDateString() === today.toDateString()) {
        displayDate = 'Today';
      } else if (transactionDate.toDateString() === yesterday.toDateString()) {
        displayDate = 'Yesterday';
      } else {
        displayDate = transactionDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        });
      }
      
      // Add date header
      flattened.push({
        type: 'header',
        data: { date: displayDate, count: grouped[dateKey].length },
        id: `header-${dateKey}`
      });
      
      // Add transactions for this date
      grouped[dateKey]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .forEach(transaction => {
          flattened.push({
            type: 'transaction',
            data: transaction,
            id: transaction.id
          });
        });
    });
    
    return flattened;
  };

  const renderDateHeader = (date: string, count: number) => {
    return (
      <View style={[styles.dateHeader, { backgroundColor: colors.surfaceVariant }]}>
        <Text style={[styles.dateHeaderText, { color: colors.text }]}>
          {date}
        </Text>
        <Text style={[styles.dateHeaderCount, { color: colors.textSecondary }]}>
          {count} transaction{count !== 1 ? 's' : ''}
        </Text>
      </View>
    );
  };

  const renderTransaction = ({ item }: { item: TransactionWithCategory }) => {
    const isExpense = item.type === 'expense';
    const amountColor = isExpense ? colors.expense : colors.income;

    // Format just the time since we have date headers
    const createdDate = new Date(item.created_at);
    const formattedTime = createdDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <TouchableOpacity 
        style={[styles.transactionCard, { 
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }]}
        onPress={() => {
          setEditingTransaction(item);
          setShowAddTransaction(true);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.transactionLeft}>
          <Text style={[styles.transactionCategory, { color: colors.text }]}>
            {item.category.icon} {item.category.name}
          </Text>
          <Text style={[styles.transactionDescription, { color: colors.textSecondary }]}>
            {item.description}
          </Text>
          <Text style={[styles.transactionDate, { color: colors.textTertiary }]}>
            {formattedTime}
          </Text>
        </View>
        <View style={styles.transactionRight}>
          <Text style={[styles.transactionAmount, { color: amountColor }]}>
            {isExpense ? '-' : '+'}${item.amount.toFixed(2)}
          </Text>
          <Text style={[styles.transactionCurrency, { color: colors.textTertiary }]}>
            {item.currency}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Main render function for FlatList items
  const renderListItem = ({ item }: { item: { type: 'header' | 'transaction'; data: any; id: string } }) => {
    if (item.type === 'header') {
      return renderDateHeader(item.data.date, item.data.count);
    } else {
      return renderTransaction({ item: item.data });
    }
  };

  // Get flattened list for display
  const flattenedList = createFlattenedList(transactions);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      {/* Top Navigation Bar */}
      <View style={[styles.topBar, { 
        backgroundColor: colors.primary,
        borderBottomColor: colors.primaryDark,
      }]}>
        {/* Profile Icon */}
        <TouchableOpacity 
          style={[styles.profileButton, { backgroundColor: colors.primaryLight }]}
          onPress={handleLogout}
        >
          <Text style={styles.profileIcon}>👤</Text>
        </TouchableOpacity>

        {/* Time Filter Dropdown */}
        <TouchableOpacity 
          style={[styles.filterDropdown, { 
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderColor: 'rgba(255, 255, 255, 0.3)',
          }]}
          onPress={() => {
            // Cycle through filters: day -> week -> month -> day
            const filters: TimeFilter[] = ['day', 'week', 'month'];
            const currentIndex = filters.indexOf(selectedFilter);
            const nextIndex = (currentIndex + 1) % filters.length;
            setSelectedFilter(filters[nextIndex]);
          }}
        >
          <Text style={[styles.filterText, { color: '#ffffff' }]}>
            {getDateRangeDisplay()}
          </Text>
          <Text style={[styles.dropdownArrow, { color: 'rgba(255, 255, 255, 0.8)' }]}>
            ▼
          </Text>
        </TouchableOpacity>

        {/* Calendar Icon */}
        <TouchableOpacity 
          style={[styles.calendarButton, { backgroundColor: colors.primaryLight }]}
          onPress={() => setShowCalendar(true)}
        >
          <Text style={styles.calendarIcon}>📅</Text>
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Recent Transactions
        </Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading transactions...
            </Text>
          </View>
        ) : transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No transactions found for this period
            </Text>
          </View>
        ) : (
          <FlatList
            data={flattenedList}
            renderItem={renderListItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.transactionsList}
          />
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[
          styles.floatingButton,
          { backgroundColor: isDarkMode ? '#8B5CF6' : '#7C3AED' }
        ]}
        onPress={() => {
          setEditingTransaction(null); // Clear editing transaction for new transaction
          setShowAddTransaction(true);
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.floatingButtonText}>+</Text>
      </TouchableOpacity>

      {/* Add Transaction Modal */}
      <Modal
        visible={showAddTransaction}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddTransaction(false)}
      >
        <AddTransactionScreen
          onClose={() => {
            setShowAddTransaction(false);
            setEditingTransaction(null); // Clear editing transaction when closing
          }}
          onTransactionAdded={() => {
            // Refresh transactions when a new transaction is added or updated
            if (user) {
              loadTransactions();
            }
          }}
          editingTransaction={editingTransaction}
        />
      </Modal>

      {/* Simple Date Picker Modal */}
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCalendar(false)}
        >
          <View style={[styles.datePickerContainer, { backgroundColor: colors.surface }]}>
            <TouchableOpacity 
              activeOpacity={1} 
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={[styles.datePickerTitle, { color: colors.text }]}>Select Date</Text>
              
              {/* Month Navigation */}
              <View style={styles.monthNavigation}>
                <TouchableOpacity 
                  style={[styles.monthButton, { backgroundColor: colors.surfaceVariant }]}
                  onPress={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setMonth(newDate.getMonth() - 1);
                    setSelectedDate(newDate);
                  }}
                >
                  <Text style={[styles.monthButtonText, { color: colors.text }]}>◀</Text>
                </TouchableOpacity>
                
                <Text style={[styles.monthTitle, { color: colors.text }]}>
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Text>
                
                <TouchableOpacity 
                  style={[styles.monthButton, { backgroundColor: colors.surfaceVariant }]}
                  onPress={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setMonth(newDate.getMonth() + 1);
                    setSelectedDate(newDate);
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
                  const year = selectedDate.getFullYear();
                  const month = selectedDate.getMonth();
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
                    const isSelected = currentDate.toDateString() === selectedDate.toDateString();
                    
                    days.push(
                      <TouchableOpacity
                        key={i}
                        style={[
                          styles.calendarDay,
                          isSelected && { backgroundColor: colors.primary },
                          isToday && !isSelected && { backgroundColor: colors.primaryLight },
                        ]}
                        onPress={() => {
                          setSelectedDate(new Date(currentDate));
                          setShowCalendar(false);
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
                  setSelectedDate(new Date());
                  setShowCalendar(false);
                }}
              >
                <Text style={styles.todayButtonText}>Today</Text>
              </TouchableOpacity>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    fontSize: 20,
    color: '#ffffff',
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 200,
    justifyContent: 'center',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
    flexShrink: 1,
  },
  dropdownArrow: {
    fontSize: 12,
  },
  calendarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarIcon: {
    fontSize: 20,
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  transactionsList: {
    paddingBottom: 20,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
    marginBottom: 8,
    marginHorizontal: 20,
    borderRadius: 12,
  },
  dateHeaderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateHeaderCount: {
    fontSize: 14,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  transactionLeft: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  transactionCurrency: {
    fontSize: 12,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  floatingButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // Date Picker Styles
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
});
