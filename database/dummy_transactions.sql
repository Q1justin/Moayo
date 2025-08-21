-- Insert dummy data for user b413e670-e651-46a7-a95d-739822357bcd
-- First, create a user profile if it doesn't exist
INSERT INTO user_profiles (id, default_currency) 
VALUES ('b413e670-e651-46a7-a95d-739822357bcd', 'USD')
ON CONFLICT (id) DO NOTHING;

-- Insert some default categories for the user
INSERT INTO categories (id, user_id, name, icon, color, is_custom, transaction_type) VALUES
-- Expense categories
('cat-food-001', 'b413e670-e651-46a7-a95d-739822357bcd', 'Food & Dining', '🍽️', '#FF6B6B', false, 'expense'),
('cat-transport-001', 'b413e670-e651-46a7-a95d-739822357bcd', 'Transportation', '🚗', '#4ECDC4', false, 'expense'),
('cat-entertainment-001', 'b413e670-e651-46a7-a95d-739822357bcd', 'Entertainment', '🎬', '#A78BFA', false, 'expense'),
('cat-shopping-001', 'b413e670-e651-46a7-a95d-739822357bcd', 'Shopping', '🛍️', '#FFA726', false, 'expense'),
('cat-utilities-001', 'b413e670-e651-46a7-a95d-739822357bcd', 'Utilities', '⚡', '#66BB6A', false, 'expense'),
('cat-health-001', 'b413e670-e651-46a7-a95d-739822357bcd', 'Health & Fitness', '🏥', '#EF5350', false, 'expense'),
-- Income categories
('cat-salary-001', 'b413e670-e651-46a7-a95d-739822357bcd', 'Salary', '💼', '#2ED573', false, 'income'),
('cat-freelance-001', 'b413e670-e651-46a7-a95d-739822357bcd', 'Freelance', '💻', '#20E3B2', false, 'income')
ON CONFLICT (id) DO NOTHING;

-- Insert dummy transactions for today (2025-08-21)
INSERT INTO transactions (user_id, category_id, type, amount, currency, description, date) VALUES
-- Today's transactions
('b413e670-e651-46a7-a95d-739822357bcd', 'cat-food-001', 'expense', 12.50, 'USD', 'Lunch at Cafe Luna', '2025-08-21'),
('b413e670-e651-46a7-a95d-739822357bcd', 'cat-transport-001', 'expense', 8.75, 'USD', 'Uber ride to office', '2025-08-21'),
('b413e670-e651-46a7-a95d-739822357bcd', 'cat-entertainment-001', 'expense', 15.99, 'USD', 'Netflix subscription', '2025-08-21'),
('b413e670-e651-46a7-a95d-739822357bcd', 'cat-food-001', 'expense', 4.25, 'USD', 'Coffee & pastry', '2025-08-21'),
('b413e670-e651-46a7-a95d-739822357bcd', 'cat-freelance-001', 'income', 250.00, 'USD', 'Client payment - web design', '2025-08-21'),

-- Yesterday's transactions (2025-08-20)
('b413e670-e651-46a7-a95d-739822357bcd', 'cat-shopping-001', 'expense', 89.99, 'USD', 'New running shoes', '2025-08-20'),
('b413e670-e651-46a7-a95d-739822357bcd', 'cat-food-001', 'expense', 45.80, 'USD', 'Grocery shopping', '2025-08-20'),
('b413e670-e651-46a7-a95d-739822357bcd', 'cat-transport-001', 'expense', 25.00, 'USD', 'Gas for car', '2025-08-20'),
('b413e670-e651-46a7-a95d-739822357bcd', 'cat-food-001', 'expense', 18.50, 'USD', 'Dinner at Italian restaurant', '2025-08-20'),
('b413e670-e651-46a7-a95d-739822357bcd', 'cat-health-001', 'expense', 35.00, 'USD', 'Gym membership monthly', '2025-08-20'),

-- 2 days ago transactions (2025-08-19)
('b413e670-e651-46a7-a95d-739822357bcd', 'cat-salary-001', 'income', 2500.00, 'USD', 'Monthly salary deposit', '2025-08-19'),
('b413e670-e651-46a7-a95d-739822357bcd', 'cat-utilities-001', 'expense', 85.40, 'USD', 'Electric bill payment', '2025-08-19'),
('b413e670-e651-46a7-a95d-739822357bcd', 'cat-food-001', 'expense', 7.50, 'USD', 'Morning coffee', '2025-08-19'),
('b413e670-e651-46a7-a95d-739822357bcd', 'cat-entertainment-001', 'expense', 22.00, 'USD', 'Movie tickets', '2025-08-19'),
('b413e670-e651-46a7-a95d-739822357bcd', 'cat-transport-001', 'expense', 12.30, 'USD', 'Public transit day pass', '2025-08-19'),
('b413e670-e651-46a7-a95d-739822357bcd', 'cat-food-001', 'expense', 32.75, 'USD', 'Lunch with colleagues', '2025-08-19');
