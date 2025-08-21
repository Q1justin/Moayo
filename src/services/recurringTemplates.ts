import { supabase, RecurringTemplate, RecurringTemplateWithCategory, RecurringFrequency, TransactionType } from '../lib/supabase';

export async function fetchRecurringTemplates(
  userId: string,
  activeOnly: boolean = true
): Promise<RecurringTemplateWithCategory[]> {
  try {
    let query = supabase
      .from('recurring_templates')
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
      console.error('Error fetching recurring templates:', error);
      throw error;
    }

    return (data || []).map(template => ({
      ...template,
      category: template.category || {
        name: 'Uncategorized',
        icon: '❓',
        color: '#666666',
        transaction_type: template.type
      }
    })) as RecurringTemplateWithCategory[];
  } catch (error) {
    console.error('Failed to fetch recurring templates:', error);
    return [];
  }
}

export async function createRecurringTemplate(
  userId: string,
  categoryId: string,
  type: TransactionType,
  amount: number,
  currency: string,
  description: string,
  startDate: string,
  frequency: RecurringFrequency,
  endDate?: string
): Promise<RecurringTemplate | null> {
  try {
    const { data, error } = await supabase
      .from('recurring_templates')
      .insert([
        {
          user_id: userId,
          category_id: categoryId,
          type,
          amount,
          currency,
          description,
          start_date: startDate,
          frequency,
          end_date: endDate,
          exchange_rate_to_usd: 1.0, // TODO: Implement real exchange rate fetching
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating recurring template:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to create recurring template:', error);
    return null;
  }
}

export async function updateRecurringTemplate(
  templateId: string,
  updates: Partial<Pick<RecurringTemplate, 'amount' | 'description' | 'frequency' | 'end_date' | 'is_active'>>
): Promise<RecurringTemplate | null> {
  try {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('recurring_templates')
      .update(updateData)
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      console.error('Error updating recurring template:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to update recurring template:', error);
    return null;
  }
}

export async function deactivateRecurringTemplate(templateId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('recurring_templates')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId);

    if (error) {
      console.error('Error deactivating recurring template:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Failed to deactivate recurring template:', error);
    return false;
  }
}

export async function deleteRecurringTemplate(templateId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('recurring_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      console.error('Error deleting recurring template:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Failed to delete recurring template:', error);
    return false;
  }
}
