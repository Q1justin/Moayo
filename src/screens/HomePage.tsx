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
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { fetchTransactions, TransactionWithCategory, TimeFilter } from '../services/transactions';
import { supabase } from '../lib/supabase';

export default function HomePage(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [selectedFilter, setSelectedFilter] = useState<TimeFilter>('week');
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user and fetch transactions
  useEffect(() => {
    async function initializeData() {
      try {
        // Try to get current user to test Supabase connection
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error && error.message.includes('Invalid API key')) {
          // Supabase not configured properly, use mock data
          console.log('Supabase not configured, using mock data');
          setMockDataMode(true);
          loadMockData();
          return;
        }
        
        if (user) {
          setUserId(user.id);
          await loadTransactions(user.id, selectedFilter);
        } else {
          // No user authenticated, but Supabase is working - show mock data for now
          console.log('No authenticated user found, using mock data');
          setMockDataMode(true);
          loadMockData();
        }
      } catch (error) {
        console.error('Error initializing data, falling back to mock data:', error);
        setMockDataMode(true);
        loadMockData();
      }
    }

    initializeData();
  }, []);

  const [mockDataMode, setMockDataMode] = useState(false);

  const loadMockData = () => {
    const mockTransactions: TransactionWithCategory[] = [
      {
        id: '1',
        user_id: 'mock-user',
        description: 'Coffee Shop',
        amount: -4.50,
        currency: 'USD',
        transaction_date: '2025-08-18',
        exchange_rate_to_usd: 1.0,
        created_at: '2025-08-18T09:15:00Z',
        updated_at: '2025-08-18T09:15:00Z',
        category_id: 'cat1',
        category: {
          name: 'Food',
          icon: '☕',
          color: '#FF6B6B'
        }
      },
      {
        id: '2',
        user_id: 'mock-user',
        description: 'Salary',
        amount: 2500.00,
        currency: 'USD',
        transaction_date: '2025-08-15',
        exchange_rate_to_usd: 1.0,
        created_at: '2025-08-15T12:00:00Z',
        updated_at: '2025-08-15T12:00:00Z',
        category_id: 'cat2',
        category: {
          name: 'Income',
          icon: '💼',
          color: '#4ECDC4'
        }
      },
      {
        id: '3',
        user_id: 'mock-user',
        description: 'Netflix Subscription',
        amount: -15.99,
        currency: 'USD',
        transaction_date: '2025-08-12',
        exchange_rate_to_usd: 1.0,
        created_at: '2025-08-12T15:20:00Z',
        updated_at: '2025-08-12T15:20:00Z',
        category_id: 'cat3',
        category: {
          name: 'Entertainment',
          icon: '🎬',
          color: '#A78BFA'
        }
      },
      {
        id: '4',
        user_id: 'mock-user',
        description: 'Grocery Store',
        amount: -85.40,
        currency: 'USD',
        transaction_date: '2025-08-10',
        exchange_rate_to_usd: 1.0,
        created_at: '2025-08-10T18:45:00Z',
        updated_at: '2025-08-10T18:45:00Z',
        category_id: 'cat4',
        category: {
          name: 'Food',
          icon: '🛒',
          color: '#FF6B6B'
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
    } else if (userId) {
      loadTransactions(userId, selectedFilter);
    }
  }, [selectedFilter, userId, mockDataMode]);

  const loadTransactions = async (userIdParam: string, filter: TimeFilter) => {
    setLoading(true);
    try {
      const fetchedTransactions = await fetchTransactions(userIdParam, filter);
      setTransactions(fetchedTransactions);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
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

  const renderTransaction = ({ item }: { item: TransactionWithCategory }) => {
    const isExpense = item.amount < 0;
    const amountColor = isExpense ? colors.expense : colors.income;

    // Format the date and time from the transaction_date and created_at
    const transactionDate = new Date(item.transaction_date);
    const createdDate = new Date(item.created_at);
    const formattedDate = transactionDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const formattedTime = createdDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <View style={[styles.transactionCard, { 
        backgroundColor: colors.surface,
        borderColor: colors.border,
      }]}>
        <View style={styles.transactionLeft}>
          <Text style={[styles.transactionCategory, { color: colors.text }]}>
            {item.category.icon} {item.category.name}
          </Text>
          <Text style={[styles.transactionDescription, { color: colors.textSecondary }]}>
            {item.description}
          </Text>
          <Text style={[styles.transactionDate, { color: colors.textTertiary }]}>
            {formattedDate} • {formattedTime}
          </Text>
        </View>
        <View style={styles.transactionRight}>
          <Text style={[styles.transactionAmount, { color: amountColor }]}>
            {isExpense ? '-' : '+'}${Math.abs(item.amount).toFixed(2)}
          </Text>
          <Text style={[styles.transactionCurrency, { color: colors.textTertiary }]}>
            {item.currency}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      {/* Top Navigation Bar */}
      <View style={[styles.topBar, { 
        backgroundColor: colors.primary,
        borderBottomColor: colors.primaryDark,
      }]}>
        {/* Profile Icon */}
        <TouchableOpacity style={[styles.profileButton, { backgroundColor: colors.primaryLight }]}>
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
            {selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)}
          </Text>
          <Text style={[styles.dropdownArrow, { color: 'rgba(255, 255, 255, 0.8)' }]}>
            ▼
          </Text>
        </TouchableOpacity>

        {/* Calendar Icon */}
        <TouchableOpacity style={[styles.calendarButton, { backgroundColor: colors.primaryLight }]}>
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
            data={transactions}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.transactionsList}
          />
        )}
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 100,
    justifyContent: 'center',
  },
  filterText: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 5,
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
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
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
});
