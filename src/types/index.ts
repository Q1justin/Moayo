export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  type: 'expense' | 'income';
  date: Date;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: 'expense' | 'income';
}

export interface ExpenseCategory extends Category {
  type: 'expense';
}

export interface IncomeCategory extends Category {
  type: 'income';
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: '1', name: 'Housing', icon: '🏠', type: 'expense' },
  { id: '2', name: 'Food', icon: '🍽️', type: 'expense' },
  { id: '3', name: 'Transportation', icon: '🚗', type: 'expense' },
  { id: '4', name: 'Miscellaneous', icon: '🛍️', type: 'expense' },
];

export const INCOME_CATEGORIES: IncomeCategory[] = [
  { id: '5', name: 'Income', icon: '💼', type: 'income' },
  { id: '6', name: 'Bonus', icon: '🎁', type: 'income' },
  { id: '7', name: 'Other', icon: '📈', type: 'income' },
];
