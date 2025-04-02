-- Comprehensive fix for RLS policies without recursion issues
-- This approach enables RLS with properly structured policies

-- First, drop all problematic policies
DROP POLICY IF EXISTS "Sellers can view orders with their products" ON orders;
DROP POLICY IF EXISTS "Sellers can update orders with their items" ON orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can view their order items" ON order_items;

-- Create a secure admin check function if it doesn't exist
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

-- Create a helper function to check if a user is a seller for an order
CREATE OR REPLACE FUNCTION is_seller_for_order(order_id_param UUID, user_id_param UUID) 
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM order_items
        WHERE order_id = order_id_param
        AND seller_id = user_id_param
    );
END;
$$;

-- Modify the place_complete_order function to use SECURITY DEFINER
DROP FUNCTION IF EXISTS place_complete_order(UUID, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, NUMERIC, TEXT, TEXT, TEXT, TIMESTAMPTZ, TEXT, JSONB);

CREATE OR REPLACE FUNCTION place_complete_order(
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
SECURITY DEFINER -- Important: This bypasses RLS checks
AS $$
DECLARE
  new_order_id UUID;
  item JSONB;
  result JSONB;
BEGIN
  -- First, verify that the user making the call matches the user_id parameter
  -- This is important for security when using SECURITY DEFINER
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'User ID mismatch: % vs %', auth.uid(), p_user_id;
  END IF;

  -- Insert the order with proper status casting
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
    'pending'::order_status,  -- Explicitly cast to enum type
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

-- Recreate the order policy to check if user is the owner
CREATE POLICY "Users can view their own orders" 
ON orders
FOR SELECT
USING (
    user_id = auth.uid() OR is_admin_safe()
);

-- Add a separate policy for sellers to view orders with their products
CREATE POLICY "Sellers can view orders with their products" 
ON orders
FOR SELECT
USING (
    -- Use the helper function to check if user is a seller for this order
    is_seller_for_order(id, auth.uid())
);

-- Recreate the update policy for sellers
CREATE POLICY "Sellers can update orders with their items" 
ON orders
FOR UPDATE
USING (
    -- Use the helper function to determine seller access
    is_seller_for_order(id, auth.uid())
);

-- Recreate the order items view policy
CREATE POLICY "Users can view their order items" 
ON order_items
FOR SELECT
USING (
    -- Direct seller check combined with order ownership check
    seller_id = auth.uid() OR
    EXISTS (
        SELECT 1 
        FROM orders o
        WHERE o.id = order_id 
        AND o.user_id = auth.uid()
    ) OR 
    is_admin_safe()
);

-- Enable RLS on the orders table now that policies are fixed
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Validate our fix by selecting existing policies
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename, cmd; 