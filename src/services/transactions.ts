import { supabase, TransactionWithCategory, TransactionType, RecurringFrequency } from '../lib/supabase';

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
          color,
          transaction_type
        )
      `)
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false })
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
        color: '#666666',
        transaction_type: transaction.type
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
  type: TransactionType,
  transactionDate?: string
): Promise<TransactionWithCategory | null> {
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
          type,
          date: transactionDate || new Date().toISOString().split('T')[0],
          exchange_rate_to_usd: 1.0, // TODO: Implement real exchange rate fetching
        }
      ])
      .select(`
        *,
        category:categories(
          name,
          icon,
          color,
          transaction_type
        )
      `)
      .single();

    if (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }

    return data as TransactionWithCategory;
  } catch (error) {
    console.error('Failed to create transaction:', error);
    return null;
  }
}

export async function updateTransaction(
  transactionId: string,
  amount: number,
  currency: string,
  description: string,
  categoryId: string,
  type: TransactionType,
  transactionDate?: string
): Promise<TransactionWithCategory | null> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .update({
        amount,
        currency,
        description,
        category_id: categoryId,
        type,
        date: transactionDate || new Date().toISOString().split('T')[0],
        exchange_rate_to_usd: 1.0, // TODO: Implement real exchange rate fetching
      })
      .eq('id', transactionId)
      .select(`
        *,
        category:categories(
          name,
          icon,
          color,
          transaction_type
        )
      `)
      .single();

    if (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }

    return data as TransactionWithCategory;
  } catch (error) {
    console.error('Failed to update transaction:', error);
    return null;
  }
}
