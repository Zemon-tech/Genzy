-- Emergency fix for infinite recursion in RLS policies

-- 1. First, temporarily disable RLS on orders to stop the recursion
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- Drop existing functions to avoid parameter name errors
DROP FUNCTION IF EXISTS get_order_details(UUID, UUID);
DROP FUNCTION IF EXISTS get_my_order(UUID);
DROP FUNCTION IF EXISTS get_order_items(UUID, UUID);
DROP FUNCTION IF EXISTS get_my_order_items(UUID);
DROP FUNCTION IF EXISTS place_complete_order_secure(UUID, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, NUMERIC, TEXT, TEXT, TEXT, TIMESTAMPTZ, TEXT, JSONB);

-- 2. Create secure views that will be used instead of direct table access
CREATE OR REPLACE VIEW user_orders AS
SELECT * FROM public.orders 
WHERE public.orders.user_id = auth.uid() 
   OR EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE public.user_profiles.id = auth.uid() AND public.user_profiles.role = 'admin'::user_role
   );

CREATE OR REPLACE VIEW seller_orders AS
SELECT o.* FROM public.orders o
WHERE o.id IN (
  SELECT DISTINCT order_id
  FROM public.order_items
  WHERE public.order_items.seller_id = auth.uid()
);

-- 3. Grant appropriate access to the views
GRANT SELECT ON user_orders TO authenticated;
GRANT SELECT ON seller_orders TO authenticated;

-- 4. Create a secure version of place_complete_order that doesn't rely on RLS
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

-- 5. Create a SECURITY DEFINER function to safely fetch order details
CREATE OR REPLACE FUNCTION get_order_details(p_order_id UUID, p_user_id UUID)
RETURNS SETOF orders
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return the order if it belongs to the user or if the user is an admin
  RETURN QUERY
  SELECT * FROM orders o
  WHERE o.id = p_order_id
    AND (
      o.user_id = p_user_id
      OR EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.id = p_user_id AND up.role = 'admin'::user_role
      )
      OR EXISTS (
        SELECT 1 FROM order_items oi
        WHERE oi.order_id = p_order_id
          AND oi.seller_id = p_user_id
      )
    );
END;
$$;

-- 6. Create a wrapper function to get order details for the current user
CREATE OR REPLACE FUNCTION get_my_order(order_id UUID)
RETURNS SETOF orders
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM get_order_details(order_id, auth.uid());
END;
$$;

-- 7. Create a SECURITY DEFINER function to get order items
CREATE OR REPLACE FUNCTION get_order_items(p_order_id UUID, p_user_id UUID)
RETURNS SETOF order_items
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return order items if the order belongs to the user or if the user is a seller of any item
  RETURN QUERY
  SELECT oi.* FROM order_items oi
  JOIN orders o ON oi.order_id = o.id
  WHERE oi.order_id = p_order_id
    AND (
      o.user_id = p_user_id
      OR oi.seller_id = p_user_id
      OR EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.id = p_user_id AND up.role = 'admin'::user_role
      )
    );
END;
$$;

-- 8. Create a wrapper function to get order items for the current user
CREATE OR REPLACE FUNCTION get_my_order_items(order_id UUID)
RETURNS SETOF order_items
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM get_order_items(order_id, auth.uid());
END;
$$; 