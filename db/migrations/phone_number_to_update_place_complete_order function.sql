-- Add phone_number column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Update or create the place_complete_order function to include phone_number parameter
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
  p_phone_number TEXT,
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
    transaction_id,
    phone_number
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
    p_transaction_id,
    p_phone_number
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

-- Also update the secure version if it exists
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
  p_phone_number TEXT,
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
    transaction_id,
    phone_number
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
    p_transaction_id,
    p_phone_number
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