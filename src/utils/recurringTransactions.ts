import { supabase, RecurringTemplateWithCategory, RecurringFrequency } from '../lib/supabase';
import { createTransaction } from '../services/transactions';
import { fetchRecurringTemplates } from '../services/recurringTemplates';

/**
 * Calculate the next occurrence date based on frequency
 */
function getNextOccurrenceDate(lastDate: Date, frequency: RecurringFrequency): Date {
  const nextDate = new Date(lastDate);
  
  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'biweekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'annually':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }
  
  return nextDate;
}

/**
 * Format date as YYYY-MM-DD string in local timezone
 */
function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a recurring transaction should be generated based on the template
 */
function shouldGenerateTransaction(template: RecurringTemplateWithCategory, today: Date): { shouldGenerate: boolean; nextDate?: Date } {
  const startDate = new Date(template.start_date);
  const endDate = template.end_date ? new Date(template.end_date) : null;
  
  // Check if we're within the active date range
  if (today < startDate) {
    return { shouldGenerate: false };
  }
  
  if (endDate && today > endDate) {
    return { shouldGenerate: false };
  }
  
  // Calculate the next occurrence date from the start date
  let nextDate = new Date(startDate);
  
  // Keep calculating next occurrences until we find one >= today
  while (nextDate < today) {
    nextDate = getNextOccurrenceDate(nextDate, template.frequency);
  }
  
  // Check if the next occurrence is today
  const todayString = formatDateString(today);
  const nextDateString = formatDateString(nextDate);
  
  return {
    shouldGenerate: todayString === nextDateString,
    nextDate: nextDate
  };
}

/**
 * Process all recurring templates for a user and generate transactions if needed
 */
export async function processRecurringTransactions(userId: string): Promise<{ created: number; errors: string[] }> {
  console.log('Processing recurring transactions for user:', userId);
  
  try {
    // Fetch all active recurring templates
    const templates = await fetchRecurringTemplates(userId, true);
    
    if (templates.length === 0) {
      console.log('No recurring templates found');
      return { created: 0, errors: [] };
    }
    
    const today = new Date();
    const todayString = formatDateString(today);
    const errors: string[] = [];
    let created = 0;
    
    for (const template of templates) {
      try {
        const { shouldGenerate } = shouldGenerateTransaction(template, today);
        
        if (shouldGenerate) {
          // Check if we already created a transaction for this template today
          const { data: existingTransactions, error: checkError } = await supabase
            .from('transactions')
            .select('id')
            .eq('user_id', userId)
            .eq('date', todayString)
            .eq('category_id', template.category_id)
            .eq('amount', template.amount)
            .eq('description', template.description)
            .eq('type', template.type);
          
          if (checkError) {
            console.error('Error checking existing transactions:', checkError);
            errors.push(`Error checking existing transactions for template ${template.id}: ${checkError.message}`);
            continue;
          }
          
          // If no existing transaction found, create one
          if (!existingTransactions || existingTransactions.length === 0) {
            const newTransaction = await createTransaction(
              userId,
              template.amount,
              template.currency,
              template.description || '',
              template.category_id,
              template.type,
              todayString,
              template.id // Pass the template ID
            );
            
            if (newTransaction) {
              console.log(`Created recurring transaction for template ${template.id}:`, newTransaction);
              created++;
            } else {
              errors.push(`Failed to create transaction for template ${template.id}`);
            }
          } else {
            console.log(`Transaction already exists for template ${template.id} on ${todayString}`);
          }
        }
      } catch (error) {
        console.error(`Error processing template ${template.id}:`, error);
        errors.push(`Error processing template ${template.id}: ${error}`);
      }
    }
    
    console.log(`Recurring transaction processing complete. Created: ${created}, Errors: ${errors.length}`);
    return { created, errors };
    
  } catch (error) {
    console.error('Error processing recurring transactions:', error);
    return { created: 0, errors: [`General error: ${error}`] };
  }
}

/**
 * Manual trigger to process recurring transactions (for testing/manual execution)
 */
export async function triggerRecurringTransactions(userId: string): Promise<void> {
  const result = await processRecurringTransactions(userId);
  
  if (result.created > 0) {
    console.log(`✅ Created ${result.created} recurring transactions`);
  }
  
  if (result.errors.length > 0) {
    console.log(`❌ Errors encountered:`, result.errors);
  }
}