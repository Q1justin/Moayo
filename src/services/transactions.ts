import { supabase, Transaction } from '../lib/supabase';

export interface TransactionWithCategory extends Transaction {
  category: {
    name: string;
    icon: string;
    color: string;
  };
}

export type TimeFilter = 'day' | 'week' | 'month';

export async function fetchTransactions(
  userId: string,
  timeFilter: TimeFilter = 'week',
  limit: number = 20
): Promise<TransactionWithCategory[]> {
  try {
    // Calculate the date range based on the time filter
    const now = new Date();
    let startDate: Date;

    switch (timeFilter) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
    }

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories(
          name,
          icon,
          color
        )
      `)
      .eq('user_id', userId)
      .gte('transaction_date', startDate.toISOString().split('T')[0])
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }

    // Transform the data to match our interface
    return (data || []).map(transaction => ({
      ...transaction,
      category: transaction.category || {
        name: 'Uncategorized',
        icon: '❓',
        color: '#666666'
      }
    })) as TransactionWithCategory[];

  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return [];
  }
}

export async function createTransaction(
  userId: string,
  amount: number,
  currency: string,
  description: string,
  categoryId: string,
  transactionDate?: string
): Promise<Transaction | null> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: userId,
          amount,
          currency,
          description,
          category_id: categoryId,
          transaction_date: transactionDate || new Date().toISOString().split('T')[0],
          exchange_rate_to_usd: 1.0, // TODO: Implement real exchange rate fetching
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to create transaction:', error);
    return null;
  }
}
