import { supabase, Category, TransactionType } from '../lib/supabase';

export async function fetchCategories(
  userId: string,
  transactionType?: TransactionType
): Promise<Category[]> {
  try {
    let query = supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (transactionType) {
      query = query.eq('transaction_type', transactionType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

export async function createCategory(
  userId: string,
  name: string,
  transactionType: TransactionType,
  icon?: string,
  color?: string
): Promise<Category | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert([
        {
          user_id: userId,
          name,
          transaction_type: transactionType,
          icon,
          color,
          is_custom: true,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to create category:', error);
    return null;
  }
}

export async function updateCategory(
  categoryId: string,
  updates: Partial<Pick<Category, 'name' | 'icon' | 'color'>>
): Promise<Category | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to update category:', error);
    return null;
  }
}

export async function deleteCategory(categoryId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      console.error('Error deleting category:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Failed to delete category:', error);
    return false;
  }
}
