-- Migration to fix order_status type mismatch issue

-- Update the function to properly cast p_status to order_status when updating order_items
CREATE OR REPLACE FUNCTION update_order_and_items_status(p_order_id UUID, p_status TEXT, p_seller_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  status_result BOOLEAN;
BEGIN
  -- Update the order status
  UPDATE orders
  SET status = p_status::order_status
  WHERE id = p_order_id
  RETURNING true INTO status_result;
  
  -- If seller ID is provided, only update items for that seller
  IF p_seller_id IS NOT NULL THEN
    UPDATE order_items
    SET item_status = p_status::order_status
    WHERE order_id = p_order_id AND seller_id = p_seller_id;
  ELSE
    -- Update all order items for the order
    UPDATE order_items
    SET item_status = p_status::order_status
    WHERE order_id = p_order_id;
  END IF;
  
  -- Create a notification for the user
  INSERT INTO notifications (
    user_id,
    message,
    title,
    type,
    is_read
  )
  SELECT
    user_id,
    'Your order #' || SUBSTRING(p_order_id::text, 1, 8) || ' status has been updated to ' || p_status,
    'Order Status Update',
    'order_update',
    false
  FROM orders
  WHERE id = p_order_id;
  
  RETURN status_result;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION update_order_and_items_status TO authenticated;

-- Create a function to get order status from item statuses
CREATE OR REPLACE FUNCTION get_order_status_from_items(p_order_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pending_count INTEGER;
  processing_count INTEGER;
  shipped_count INTEGER;
  delivered_count INTEGER;
  cancelled_count INTEGER;
  total_count INTEGER;
  order_status TEXT;
BEGIN
  -- Count items in each status for this order
  SELECT 
    COUNT(*) FILTER (WHERE item_status = 'pending') AS pending,
    COUNT(*) FILTER (WHERE item_status = 'processing') AS processing,
    COUNT(*) FILTER (WHERE item_status = 'shipped') AS shipped,
    COUNT(*) FILTER (WHERE item_status = 'delivered') AS delivered,
    COUNT(*) FILTER (WHERE item_status = 'cancelled') AS cancelled,
    COUNT(*) AS total
  INTO 
    pending_count, processing_count, shipped_count, 
    delivered_count, cancelled_count, total_count
  FROM order_items
  WHERE order_id = p_order_id;
  
  -- Determine the overall order status based on the item statuses
  IF cancelled_count = total_count THEN
    order_status := 'cancelled';
  ELSIF delivered_count = total_count THEN
    order_status := 'delivered';
  ELSIF shipped_count > 0 THEN
    order_status := 'shipped';
  ELSIF processing_count > 0 THEN
    order_status := 'processing';
  ELSE
    order_status := 'pending';
  END IF;
  
  RETURN order_status;
END;
$$;

-- Modify the sync_order_status trigger function to make it more robust
CREATE OR REPLACE FUNCTION sync_order_status() 
RETURNS TRIGGER AS $$
DECLARE
  new_status TEXT;
BEGIN
  -- Get the appropriate order status based on its items
  new_status := get_order_status_from_items(NEW.order_id);
  
  -- Update the order status if needed
  UPDATE orders
  SET status = new_status::order_status
  WHERE id = NEW.order_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function whenever an order item status is updated
DROP TRIGGER IF EXISTS order_items_status_trigger ON order_items;

CREATE TRIGGER order_items_status_trigger
AFTER UPDATE OF item_status ON order_items
FOR EACH ROW
EXECUTE FUNCTION sync_order_status();

-- Add a function to manually synchronize an order's status with its items
CREATE OR REPLACE FUNCTION sync_order_status_by_id(p_order_id UUID)
RETURNS order_status AS $$
DECLARE 
    new_status order_status;
    pending_count INTEGER;
    processing_count INTEGER;
    shipped_count INTEGER;
    delivered_count INTEGER;
    cancelled_count INTEGER;
    total_count INTEGER;
BEGIN
    -- Count items in each status for this order
    SELECT 
        COUNT(*) FILTER (WHERE item_status = 'pending') AS pending,
        COUNT(*) FILTER (WHERE item_status = 'processing') AS processing,
        COUNT(*) FILTER (WHERE item_status = 'shipped') AS shipped,
        COUNT(*) FILTER (WHERE item_status = 'delivered') AS delivered,
        COUNT(*) FILTER (WHERE item_status = 'cancelled') AS cancelled,
        COUNT(*) AS total
    INTO 
        pending_count, processing_count, shipped_count, 
        delivered_count, cancelled_count, total_count
    FROM order_items
    WHERE order_id = p_order_id;
    
    -- Determine the overall order status based on the item statuses
    IF cancelled_count = total_count THEN
        new_status := 'cancelled';
    ELSIF delivered_count = total_count THEN
        new_status := 'delivered';
    ELSIF shipped_count > 0 THEN
        new_status := 'shipped';
    ELSIF processing_count > 0 THEN
        new_status := 'processing';
    ELSE
        new_status := 'pending';
    END IF;

    -- Update the order status
    UPDATE orders
    SET status = new_status
    WHERE id = p_order_id;
    
    RETURN new_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 