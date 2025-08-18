import { createClient } from '@supabase/supabase-js';

// TODO: Replace these with your actual Supabase project credentials
// For now, using placeholder values - you'll need to create a Supabase project
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types based on our schema
export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  description: string;
  category_id: string;
  transaction_date: string;
  exchange_rate_to_usd: number;
  recurring_template_id?: string;
  created_at: string;
  updated_at: string;
  // Joined data from categories table
  category?: {
    name: string;
    icon: string;
    color: string;
  };
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}
