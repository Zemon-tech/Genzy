-- SQL Script to setup Row Level Security for shopping_cart and wishlist tables

-- First, enable RLS on the tables if not already enabled
ALTER TABLE shopping_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid duplicates)
DROP POLICY IF EXISTS "Users can view own shopping cart" ON shopping_cart;
DROP POLICY IF EXISTS "Users can insert into own shopping cart" ON shopping_cart;
DROP POLICY IF EXISTS "Users can update own shopping cart" ON shopping_cart;
DROP POLICY IF EXISTS "Users can delete from own shopping cart" ON shopping_cart;

DROP POLICY IF EXISTS "Users can view own wishlist" ON wishlist;
DROP POLICY IF EXISTS "Users can insert into own wishlist" ON wishlist;
DROP POLICY IF EXISTS "Users can update own wishlist" ON wishlist;
DROP POLICY IF EXISTS "Users can delete from own wishlist" ON wishlist;

-- Create policies for shopping_cart table
-- SELECT policy
CREATE POLICY "Users can view own shopping cart"
ON shopping_cart
FOR SELECT
USING (auth.uid() = user_id);

-- INSERT policy
CREATE POLICY "Users can insert into own shopping cart"
ON shopping_cart
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE policy
CREATE POLICY "Users can update own shopping cart"
ON shopping_cart
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE policy
CREATE POLICY "Users can delete from own shopping cart"
ON shopping_cart
FOR DELETE
USING (auth.uid() = user_id);

-- Create policies for wishlist table
-- SELECT policy
CREATE POLICY "Users can view own wishlist"
ON wishlist
FOR SELECT
USING (auth.uid() = user_id);

-- INSERT policy
CREATE POLICY "Users can insert into own wishlist"
ON wishlist
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE policy
CREATE POLICY "Users can update own wishlist"
ON wishlist
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE policy
CREATE POLICY "Users can delete from own wishlist"
ON wishlist
FOR DELETE
USING (auth.uid() = user_id);

-- Verify the policies are in place
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('shopping_cart', 'wishlist')
ORDER BY tablename, cmd; 