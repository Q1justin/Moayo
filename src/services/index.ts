// Export all service functions for easy importing
export * from './transactions';
export * from './categories';
export * from './recurringTemplates';
export * from './goals';
export * from './userProfiles';

// Re-export types from supabase for convenience
export type {
  Transaction,
  TransactionWithCategory,
  Category,
  RecurringTemplate,
  RecurringTemplateWithCategory,
  Goal,
  GoalWithCategory,
  UserProfile,
  TransactionType,
  Currency,
  RecurringFrequency,
  GoalTimeframe,
} from '../lib/supabase';
