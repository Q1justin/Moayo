import { supabase, Goal, GoalWithCategory, GoalTimeframe, TransactionType } from '../lib/supabase';

export async function fetchGoals(
  userId: string,
  activeOnly: boolean = true
): Promise<GoalWithCategory[]> {
  try {
    let query = supabase
      .from('goals')
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
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching goals:', error);
      throw error;
    }

    return (data || []).map(goal => ({
      ...goal,
      category: goal.category || {
        name: 'Uncategorized',
        icon: '❓',
        color: '#666666',
        transaction_type: goal.type
      }
    })) as GoalWithCategory[];
  } catch (error) {
    console.error('Failed to fetch goals:', error);
    return [];
  }
}

export async function createGoal(
  userId: string,
  categoryId: string,
  type: TransactionType,
  targetAmount: number,
  currency: string,
  timeframe?: GoalTimeframe,
  startDate?: string,
  endDate?: string
): Promise<Goal | null> {
  try {
    const { data, error } = await supabase
      .from('goals')
      .insert([
        {
          user_id: userId,
          category_id: categoryId,
          type,
          target_amount: targetAmount,
          currency,
          timeframe,
          start_date: startDate,
          end_date: endDate,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating goal:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to create goal:', error);
    return null;
  }
}

export async function updateGoal(
  goalId: string,
  updates: Partial<Pick<Goal, 'target_amount' | 'timeframe' | 'start_date' | 'end_date' | 'is_active'>>
): Promise<Goal | null> {
  try {
    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', goalId)
      .select()
      .single();

    if (error) {
      console.error('Error updating goal:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to update goal:', error);
    return null;
  }
}

export async function deleteGoal(goalId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId);

    if (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Failed to delete goal:', error);
    return false;
  }
}

// Helper function to calculate goal progress
export async function calculateGoalProgress(
  goalId: string,
  userId: string
): Promise<{ current: number; target: number; percentage: number } | null> {
  try {
    // First get the goal details
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', userId)
      .single();

    if (goalError || !goal) {
      console.error('Error fetching goal for progress calculation:', goalError);
      return null;
    }

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    if (goal.start_date && goal.end_date) {
      startDate = new Date(goal.start_date);
      endDate = new Date(goal.end_date);
    } else {
      // Calculate based on timeframe
      switch (goal.timeframe) {
        case 'daily':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'weekly':
          const dayOfWeek = now.getDay();
          startDate = new Date(now);
          startDate.setDate(now.getDate() - dayOfWeek);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'yearly':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
    }

    // Sum transactions for this category and date range
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('category_id', goal.category_id)
      .eq('type', goal.type)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    if (transError) {
      console.error('Error fetching transactions for goal progress:', transError);
      return null;
    }

    const currentAmount = (transactions || []).reduce((sum, trans) => sum + trans.amount, 0);
    const percentage = (currentAmount / goal.target_amount) * 100;

    return {
      current: currentAmount,
      target: goal.target_amount,
      percentage: Math.min(percentage, 100) // Cap at 100%
    };
  } catch (error) {
    console.error('Failed to calculate goal progress:', error);
    return null;
  }
}
