-- Default Categories for Moayo Financial Tracker
-- This file contains a comprehensive list of categories that can be used as defaults for new users
-- Categories are organized by type (expense/income) and include icons and colors
-- Note: user_id should be set when inserting these for specific users

-- EXPENSE CATEGORIES
INSERT INTO categories (id, name, icon, color, is_custom, transaction_type) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Food', '🍔', '#FF6B6B', false, 'expense'),
('550e8400-e29b-41d4-a716-446655440002', 'Transportation', '🚗', '#4ECDC4', false, 'expense'),
('550e8400-e29b-41d4-a716-446655440003', 'Home', '🏠', '#FF9800', false, 'expense'),
('550e8400-e29b-41d4-a716-446655440004', 'Education', '🎓', '#3F51B5', false, 'expense'),
('550e8400-e29b-41d4-a716-446655440005', 'Phone', '📞', '#2196F3', false, 'expense'),
('550e8400-e29b-41d4-a716-446655440006', 'Vacation', '🏖️', '#FF7043', false, 'expense'),
('550e8400-e29b-41d4-a716-446655440007', 'Clothes', '👔', '#9C27B0', false, 'expense'),
('550e8400-e29b-41d4-a716-446655440008', 'Pets', '🐕', '#8BC34A', false, 'expense'),
('550e8400-e29b-41d4-a716-446655440009', 'Childcare', '👶', '#E91E63', false, 'expense'),
('550e8400-e29b-41d4-a716-446655440010', 'Health', '🏥', '#EF5350', false, 'expense'),
('550e8400-e29b-41d4-a716-446655440011', 'Beauty', '💄', '#F8BBD9', false, 'expense'),
('550e8400-e29b-41d4-a716-446655440012', 'Presents', '🎁', '#C5E1A5', false, 'expense'),
('550e8400-e29b-41d4-a716-446655440013', 'Church', '⛪', '#795548', false, 'expense'),
('550e8400-e29b-41d4-a716-446655440014', 'Other', '📦', '#9E9E9E', false, 'expense');

-- INCOME CATEGORIES
INSERT INTO categories (id, name, icon, color, is_custom, transaction_type) VALUES
('550e8400-e29b-41d4-a716-446655440015', 'Salary', '💼', '#2ED573', false, 'income'),
('550e8400-e29b-41d4-a716-446655440016', 'Bonus', '🎉', '#20E3B2', false, 'income'),
('550e8400-e29b-41d4-a716-446655440017', 'Commission', '💰', '#009688', false, 'income'),
('550e8400-e29b-41d4-a716-446655440018', 'Side Business', '🏪', '#80CBC4', false, 'income'),
('550e8400-e29b-41d4-a716-446655440019', 'Investment', '📈', '#4CAF50', false, 'income'),
('550e8400-e29b-41d4-a716-446655440020', 'Rent', '🏠', '#A5D6A7', false, 'income'),
('550e8400-e29b-41d4-a716-446655440021', 'Refunds', '💸', '#DCEDC8', false, 'income'),
('550e8400-e29b-41d4-a716-446655440022', 'Cashback', '💳', '#F0F4C3', false, 'income'),
('550e8400-e29b-41d4-a716-446655440023', 'Other', '📦', '#FF9800', false, 'income');
