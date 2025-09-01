import { supabase, TransactionWithCategory, TransactionType, RecurringFrequency } from '../lib/supabase';

export type TimeFilter = 'day' | 'week' | 'month';

export async function fetchTransactions(
  userId: string,
  timeFilter: TimeFilter = 'week',
  limit: number = 20,
  selectedDate?: Date
): Promise<TransactionWithCategory[]> {
  try {
    // Calculate the date range based on the time filter and selected date
    const referenceDate = selectedDate || new Date();
    let startDate: Date;
    let endDate: Date;

    switch (timeFilter) {
      case 'day':
        startDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 1);
        break;
      case 'week':
        // Get Monday of the week containing the selected date
        const dayOfWeek = referenceDate.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so we need 6 days back
        startDate = new Date(referenceDate);
        startDate.setDate(referenceDate.getDate() - daysToMonday);
        startDate.setHours(0, 0, 0, 0);
        
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
        break;
      case 'month':
        startDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
        endDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1);
        break;
      default:
        startDate = new Date(referenceDate);
        startDate.setDate(referenceDate.getDate() - 7);
        endDate = new Date(referenceDate);
        endDate.setDate(referenceDate.getDate() + 1);
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
      .lt('date', endDate.toISOString().split('T')[0])
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
          date: transactionDate || (() => {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          })(),
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
        date: transactionDate || (() => {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        })(),
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
