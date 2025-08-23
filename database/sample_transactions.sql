
-- Sample transactions for 2 days ago (August 21, 2025)
INSERT INTO transactions (user_id, category_id, type, amount, currency, exchange_rate_to_usd, description, date) VALUES
('2c441052-5769-4538-8d67-5139a0e06869', '550e8400-e29b-41d4-a716-446655440001', 'expense', 12.50, 'USD', 1.0, 'Lunch at local cafe', '2025-08-21'),
('2c441052-5769-4538-8d67-5139a0e06869', '550e8400-e29b-41d4-a716-446655440002', 'expense', 45.00, 'USD', 1.0, 'Gas station fill-up', '2025-08-21'),
('2c441052-5769-4538-8d67-5139a0e06869', '550e8400-e29b-41d4-a716-446655440003', 'expense', 89.99, 'USD', 1.0, 'Grocery shopping', '2025-08-21'),
('2c441052-5769-4538-8d67-5139a0e06869', '550e8400-e29b-41d4-a716-446655440015', 'income', 2500.00, 'USD', 1.0, 'Monthly salary deposit', '2025-08-21');

-- Sample transactions for yesterday (August 22, 2025)
INSERT INTO transactions (user_id, category_id, type, amount, currency, exchange_rate_to_usd, description, date) VALUES
('2c441052-5769-4538-8d67-5139a0e06869', '550e8400-e29b-41d4-a716-446655440001', 'expense', 4.75, 'USD', 1.0, 'Morning coffee', '2025-08-22'),
('2c441052-5769-4538-8d67-5139a0e06869', '550e8400-e29b-41d4-a716-446655440005', 'expense', 65.00, 'USD', 1.0, 'Phone bill payment', '2025-08-22'),
('2c441052-5769-4538-8d67-5139a0e06869', '550e8400-e29b-41d4-a716-446655440007', 'expense', 120.00, 'USD', 1.0, 'New work shirt', '2025-08-22'),
('2c441052-5769-4538-8d67-5139a0e06869', '550e8400-e29b-41d4-a716-446655440010', 'expense', 25.00, 'USD', 1.0, 'Pharmacy prescription', '2025-08-22');

-- Sample transactions for today (August 23, 2025)
INSERT INTO transactions (user_id, category_id, type, amount, currency, exchange_rate_to_usd, description, date) VALUES
('2c441052-5769-4538-8d67-5139a0e06869', '550e8400-e29b-41d4-a716-446655440001', 'expense', 8.50, 'USD', 1.0, 'Breakfast sandwich', '2025-08-23'),
('2c441052-5769-4538-8d67-5139a0e06869', '550e8400-e29b-41d4-a716-446655440002', 'expense', 15.00, 'USD', 1.0, 'Public transport', '2025-08-23'),
('2c441052-5769-4538-8d67-5139a0e06869', '550e8400-e29b-41d4-a716-446655440016', 'income', 150.00, 'USD', 1.0, 'Freelance project bonus', '2025-08-23'),
('2c441052-5769-4538-8d67-5139a0e06869', '550e8400-e29b-41d4-a716-446655440012', 'expense', 35.00, 'USD', 1.0, 'Birthday gift for friend', '2025-08-23');
