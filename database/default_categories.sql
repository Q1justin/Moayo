
-- EXPENSE CATEGORIES
INSERT INTO categories (id, user_id, name, icon, color, is_custom, transaction_type) VALUES
('550e8400-e29b-41d4-a716-446655440001', NULL, 'Food', '🍔', '#FF6B6B', false, 'expense'),
('550e8400-e29b-41d4-a716-446655440002', NULL, 'Transportation', '🚗', '#4ECDC4', false, 'expense'),
('550e8400-e29b-41d4-a716-446655440003', NULL, 'Home', '🏠', '#FF9800', false, 'expense'),
('550e8400-e29b-41d4-a716-446655440004', NULL, 'Education', '🎓', '#3F51B5', false, 'expense'),
('550e8400-e29b-41d4-a716-446655440005', NULL, 'Phone', '📞', '#2196F3', false, 'expense'),
('550e8400-e29b-41d4-a716-446655440006', NULL, 'Vacation', '🏖️', '#FF7043', false, 'expense'),
('550e8400-e29b-41d4-a716-446655440007', NULL, 'Clothes', '👔', '#9C27B0', false, 'expense'),
('550e8400-e29b-41d4-a716-446655440008', NULL, 'Pets', '🐕', '#8BC34A', false, 'expense'),
('550e8400-e29b-41d4-a716-446655440009', NULL, 'Childcare', '👶', '#E91E63', false, 'expense'),
('550e8400-e29b-41d4-a716-446655440010', NULL, 'Health', '🏥', '#EF5350', false, 'expense'),
('550e8400-e29b-41d4-a716-446655440011', NULL, 'Beauty', '💄', '#F8BBD9', false, 'expense'),
('550e8400-e29b-41d4-a716-446655440012', NULL, 'Presents', '🎁', '#C5E1A5', false, 'expense'),
('550e8400-e29b-41d4-a716-446655440013', NULL, 'Church', '⛪', '#795548', false, 'expense'),
('550e8400-e29b-41d4-a716-446655440014', NULL, 'Other', '📦', '#9E9E9E', false, 'expense');

-- INCOME CATEGORIES
INSERT INTO categories (id, user_id, name, icon, color, is_custom, transaction_type) VALUES
('550e8400-e29b-41d4-a716-446655440015', NULL, 'Salary', '💼', '#2ED573', false, 'income'),
('550e8400-e29b-41d4-a716-446655440016', NULL, 'Bonus', '🎉', '#20E3B2', false, 'income'),
('550e8400-e29b-41d4-a716-446655440017', NULL, 'Commission', '💰', '#009688', false, 'income'),
('550e8400-e29b-41d4-a716-446655440018', NULL, 'Side Business', '🏪', '#80CBC4', false, 'income'),
('550e8400-e29b-41d4-a716-446655440019', NULL, 'Investment', '📈', '#4CAF50', false, 'income'),
('550e8400-e29b-41d4-a716-446655440020', NULL, 'Rent', '🏠', '#A5D6A7', false, 'income'),
('550e8400-e29b-41d4-a716-446655440021', NULL, 'Refunds', '💸', '#DCEDC8', false, 'income'),
('550e8400-e29b-41d4-a716-446655440022', NULL, 'Cashback', '💳', '#F0F4C3', false, 'income'),
('550e8400-e29b-41d4-a716-446655440023', NULL, 'Other', '📦', '#FF9800', false, 'income');
