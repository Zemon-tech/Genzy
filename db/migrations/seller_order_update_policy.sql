-- SQL Script to fix infinite recursion in order and order_items policies

-- First, identify if the is_admin function is causing issues
CREATE OR REPLACE FUNCTION is_admin_safe()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = auth.uid()
        AND role = 'admin'::user_role
    );
END;
$$;

-- First, drop all policies that might be causing recursion
DROP POLICY IF EXISTS "Sellers can update their order items" ON order_items;
DROP POLICY IF EXISTS "Sellers can view their product order items" ON order_items;
DROP POLICY IF EXISTS "Sellers can update orders with their items" ON orders;
DROP POLICY IF EXISTS "Sellers can view orders with their products" ON orders;
DROP POLICY IF EXISTS "Users can view their order items" ON order_items;
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;

-- Drop all remaining policies on orders table for a clean slate
DROP POLICY IF EXISTS "Users can create their own orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;

-- Create baseline user policies for orders (non-recursive)
CREATE POLICY "Users can create their own orders"
ON orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
ON orders
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own orders"
ON orders
FOR SELECT
USING (auth.uid() = user_id OR is_admin_safe());

-- Create policies for sellers to manage their order items (non-recursive)
CREATE POLICY "Sellers can update their order items"
ON order_items
FOR UPDATE
USING (seller_id = auth.uid())
WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can view their product order items"
ON order_items
FOR SELECT
USING (seller_id = auth.uid());

-- Create policies for sellers to view orders (non-recursive)
CREATE POLICY "Sellers can view orders with their products"
ON orders
FOR SELECT
USING (id IN (
  SELECT DISTINCT order_id
  FROM order_items
  WHERE seller_id = auth.uid()
));

-- Create policies for sellers to update orders (non-recursive)
CREATE POLICY "Sellers can update orders with their items"
ON orders
FOR UPDATE
USING (id IN (
  SELECT DISTINCT order_id
  FROM order_items
  WHERE seller_id = auth.uid()
));

-- Create non-recursive policy for users to view their order items
CREATE POLICY "Users can view their order items"
ON order_items
FOR SELECT
USING (
  (seller_id = auth.uid()) OR
  (order_id IN (
    SELECT id
    FROM orders
    WHERE user_id = auth.uid()
  )) OR 
  is_admin_safe()
);

-- Ensure we've covered all recursive cases
DROP POLICY IF EXISTS "Users can create order items" ON order_items;

-- Add a non-recursive version
CREATE POLICY "Users can create order items"
ON order_items
FOR INSERT
WITH CHECK (
  order_id IN (
    SELECT id
    FROM orders
    WHERE user_id = auth.uid()
  )
);

-- Create a stored procedure for placing orders securely
CREATE OR REPLACE FUNCTION place_complete_order_secure(
  p_user_id UUID,
  p_total_amount NUMERIC,
  p_subtotal NUMERIC,
  p_shipping_fee NUMERIC,
  p_discount_amount NUMERIC,
  p_coupon_code TEXT,
  p_coupon_discount NUMERIC,
  p_shipping_address TEXT,
  p_payment_method TEXT,
  p_payment_status TEXT,
  p_estimated_delivery_date TIMESTAMPTZ,
  p_transaction_id TEXT,
  p_cart_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_order_id UUID;
  item JSONB;
  result JSONB;
BEGIN
  -- Insert the order
  INSERT INTO orders (
    user_id,
    total_amount,
    subtotal,
    shipping_fee,
    discount_amount,
    coupon_code,
    coupon_discount,
    status,
    shipping_address,
    payment_method,
    payment_status,
    seller_notified,
    estimated_delivery_date,
    transaction_id
  )
  VALUES (
    p_user_id,
    p_total_amount,
    p_subtotal,
    p_shipping_fee,
    p_discount_amount,
    p_coupon_code,
    p_coupon_discount,
    'pending'::order_status,
    p_shipping_address,
    p_payment_method,
    p_payment_status,
    FALSE,
    p_estimated_delivery_date,
    p_transaction_id
  )
  RETURNING id INTO new_order_id;
  
  -- Insert each order item from the array
  FOR item IN SELECT * FROM jsonb_array_elements(p_cart_items)
  LOOP
    INSERT INTO order_items (
      order_id,
      product_id,
      seller_id,
      quantity,
      price_at_time,
      size,
      color,
      item_status
    )
    VALUES (
      new_order_id,
      (item->>'product_id')::UUID,
      (item->>'seller_id')::UUID,
      (item->>'quantity')::INTEGER,
      (item->>'price_at_time')::NUMERIC,
      item->>'size',
      item->>'color',
      'pending'
    );
  END LOOP;
  
  -- Return the created order ID
  result := jsonb_build_object('order_id', new_order_id);
  RETURN result;
END;
$$;

-- Enable row level security on both tables if not already enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Output the final policy state
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename, cmd; 