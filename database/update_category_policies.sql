-- Updated RLS policies for categories to support default categories
-- Run this SQL to update your existing policies

-- First, drop the existing category policies
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;

-- Create new policies that allow default categories (user_id IS NULL) and user-specific categories
CREATE POLICY "Users can view categories" ON categories FOR SELECT USING (
  user_id IS NULL OR auth.uid() = user_id
);

CREATE POLICY "Users can insert own categories" ON categories FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "Users can update own categories" ON categories FOR UPDATE USING (
  auth.uid() = user_id
);

CREATE POLICY "Users can delete own categories" ON categories FOR DELETE USING (
  auth.uid() = user_id
);

-- Allow service role to insert default categories (user_id IS NULL)
CREATE POLICY "Service role can insert default categories" ON categories FOR INSERT WITH CHECK (
  user_id IS NULL
);

-- Allow service role to update default categories
CREATE POLICY "Service role can update default categories" ON categories FOR UPDATE USING (
  user_id IS NULL
);

-- Update the categories table to allow NULL user_id for default categories
ALTER TABLE categories ALTER COLUMN user_id DROP NOT NULL;

-- Update the foreign key constraint to allow NULL user_id
-- (This might already be the case, but just to be sure)
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_user_id_fkey;
ALTER TABLE categories ADD CONSTRAINT categories_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
