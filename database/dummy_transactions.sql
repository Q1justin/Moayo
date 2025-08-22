-- Insert dummy data for user b413e670-e651-46a7-a95d-739822357bcd
-- First, create a user profile if it doesn't exist
INSERT INTO user_profiles (id, default_currency) 
VALUES ('b413e670-e651-46a7-a95d-739822357bcd', 'USD')
ON CONFLICT (id) DO NOTHING;

-- Insert some default categories for the user (let PostgreSQL generate the IDs)
INSERT INTO categories (user_id, name, icon, color, is_custom, transaction_type) VALUES
-- Expense categories
('b413e670-e651-46a7-a95d-739822357bcd', 'Food & Dining', '🍽️', '#FF6B6B', false, 'expense'),
('b413e670-e651-46a7-a95d-739822357bcd', 'Transportation', '🚗', '#4ECDC4', false, 'expense'),
('b413e670-e651-46a7-a95d-739822357bcd', 'Entertainment', '🎬', '#A78BFA', false, 'expense'),
('b413e670-e651-46a7-a95d-739822357bcd', 'Shopping', '🛍️', '#FFA726', false, 'expense'),
('b413e670-e651-46a7-a95d-739822357bcd', 'Utilities', '⚡', '#66BB6A', false, 'expense'),
('b413e670-e651-46a7-a95d-739822357bcd', 'Health & Fitness', '🏥', '#EF5350', false, 'expense'),
-- Income categories
('b413e670-e651-46a7-a95d-739822357bcd', 'Salary', '💼', '#2ED573', false, 'income'),
('b413e670-e651-46a7-a95d-739822357bcd', 'Freelance', '💻', '#20E3B2', false, 'income');

-- Insert dummy transactions using category names (we'll need to reference by name since IDs are auto-generated)
-- We'll use a WITH clause to look up category IDs by name for this user

WITH user_categories AS (
  SELECT id, name FROM categories 
  WHERE user_id = 'b413e670-e651-46a7-a95d-739822357bcd'
)
INSERT INTO transactions (user_id, category_id, type, amount, currency, description, date) 
SELECT 
  'b413e670-e651-46a7-a95d-739822357bcd',
  uc.id,
  data.type,
  data.amount,
  data.currency,
  data.description,
  data.date::date
FROM (VALUES
  -- Today's transactions (2025-08-21)
  ('Food & Dining', 'expense', 12.50, 'USD', 'Lunch at Cafe Luna', '2025-08-21'),
  ('Transportation', 'expense', 8.75, 'USD', 'Uber ride to office', '2025-08-21'),
  ('Entertainment', 'expense', 15.99, 'USD', 'Netflix subscription', '2025-08-21'),
  ('Food & Dining', 'expense', 4.25, 'USD', 'Coffee & pastry', '2025-08-21'),
  ('Freelance', 'income', 250.00, 'USD', 'Client payment - web design', '2025-08-21'),

  -- Yesterday's transactions (2025-08-20)
  ('Shopping', 'expense', 89.99, 'USD', 'New running shoes', '2025-08-20'),
  ('Food & Dining', 'expense', 45.80, 'USD', 'Grocery shopping', '2025-08-20'),
  ('Transportation', 'expense', 25.00, 'USD', 'Gas for car', '2025-08-20'),
  ('Food & Dining', 'expense', 18.50, 'USD', 'Dinner at Italian restaurant', '2025-08-20'),
  ('Health & Fitness', 'expense', 35.00, 'USD', 'Gym membership monthly', '2025-08-20'),

  -- 2 days ago transactions (2025-08-19)
  ('Salary', 'income', 2500.00, 'USD', 'Monthly salary deposit', '2025-08-19'),
  ('Utilities', 'expense', 85.40, 'USD', 'Electric bill payment', '2025-08-19'),
  ('Food & Dining', 'expense', 7.50, 'USD', 'Morning coffee', '2025-08-19'),
  ('Entertainment', 'expense', 22.00, 'USD', 'Movie tickets', '2025-08-19'),
  ('Transportation', 'expense', 12.30, 'USD', 'Public transit day pass', '2025-08-19'),
  ('Food & Dining', 'expense', 32.75, 'USD', 'Lunch with colleagues', '2025-08-19')
) AS data(category_name, type, amount, currency, description, date)
JOIN user_categories uc ON uc.name = data.category_name;
