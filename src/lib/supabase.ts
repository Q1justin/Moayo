import { createClient } from '@supabase/supabase-js';

// TODO: Replace these with your actual Supabase project credentials
// For now, using placeholder values - you'll need to create a Supabase project
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types based on our schema

// User Profile (extends Supabase auth.users)
export interface UserProfile {
  id: string; // UUID that references auth.users(id)
  default_currency: string;
  created_at: string;
  updated_at: string;
}

// Categories table
export interface Category {
  id: string; // UUID
  user_id: string; // UUID that references auth.users(id)
  name: string;
  icon?: string; // emoji like 🍽️
  color?: string; // hex color like #FF5733
  is_custom: boolean; // custom vs user-created
  transaction_type: 'expense' | 'income';
  created_at: string;
}

// Recurring Templates table (for profile page management)
export interface RecurringTemplate {
  id: string;
  user_id: string;
  category_id: string;
  type: 'expense' | 'income';
  amount: number;
  currency: string;
  exchange_rate_to_usd: number;
  description?: string;
  start_date: string; // DATE string
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';
  end_date?: string; // DATE string, null means no end date
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data from categories table
  category?: {
    name: string;
    icon?: string;
    color?: string;
    transaction_type: 'expense' | 'income';
  };
}

// Transactions table (actual confirmed spending only)
export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  type: 'expense' | 'income';
  amount: number;
  currency: string;
  exchange_rate_to_usd: number;
  description?: string;
  date: string; // DATE string
  recurring_template_id?: string; // Link back to recurring template (optional)
  created_at: string;
  updated_at: string;
  // Joined data from categories table
  category?: {
    name: string;
    icon?: string;
    color?: string;
    transaction_type: 'expense' | 'income';
  };
  // Joined data from recurring_templates table
  recurring_template?: {
    frequency: string;
    description?: string;
  };
}

// Goals table
export interface Goal {
  id: string;
  user_id: string;
  category_id: string;
  type: 'expense' | 'income';
  target_amount: number;
  currency: string;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date?: string; // DATE string
  end_date?: string; // DATE string
  is_active: boolean;
  created_at: string;
  // Joined data from categories table
  category?: {
    name: string;
    icon?: string;
    color?: string;
    transaction_type: 'expense' | 'income';
  };
}

// Helper types for joined queries
export interface TransactionWithCategory extends Transaction {
  category: {
    name: string;
    icon?: string;
    color?: string;
    transaction_type: 'expense' | 'income';
  };
}

export interface RecurringTemplateWithCategory extends RecurringTemplate {
  category: {
    name: string;
    icon?: string;
    color?: string;
    transaction_type: 'expense' | 'income';
  };
}

export interface GoalWithCategory extends Goal {
  category: {
    name: string;
    icon?: string;
    color?: string;
    transaction_type: 'expense' | 'income';
  };
}

// Enums for better type safety
export type TransactionType = 'expense' | 'income';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'CNY' | 'KRW'; // Add more as needed
export type RecurringFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';
export type GoalTimeframe = 'daily' | 'weekly' | 'monthly' | 'yearly';
