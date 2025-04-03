-- Migration to add actual_delivery_date column and update related functions

-- Add actual_delivery_date column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_delivery_date TIMESTAMP;

-- Add comment to the column
COMMENT ON COLUMN orders.actual_delivery_date IS 'Date when the order was actually delivered';

-- Update the order status update function to set actual_delivery_date
CREATE OR REPLACE FUNCTION update_order_and_items_status(
  p_order_id UUID, 
  p_status TEXT, 
  p_seller_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  status_result BOOLEAN;
BEGIN
  -- If marking as delivered, set the actual delivery date
  IF p_status = 'delivered' THEN
    UPDATE orders
    SET 
      status = p_status::order_status,
      actual_delivery_date = CURRENT_TIMESTAMP
    WHERE id = p_order_id
    RETURNING true INTO status_result;
  ELSE
    -- Regular status update
    UPDATE orders
    SET status = p_status::order_status
    WHERE id = p_order_id
    RETURNING true INTO status_result;
  END IF;
  
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

-- Update the sync function to also handle actual_delivery_date
CREATE OR REPLACE FUNCTION sync_order_status() 
RETURNS TRIGGER AS $$
DECLARE
  new_status TEXT;
BEGIN
  -- Get the appropriate order status based on its items
  new_status := get_order_status_from_items(NEW.order_id);
  
  -- Update the order status if needed
  -- Also update actual_delivery_date if new status is delivered
  IF new_status = 'delivered' THEN
    UPDATE orders
    SET 
      status = new_status::order_status,
      actual_delivery_date = CASE 
        WHEN actual_delivery_date IS NULL THEN CURRENT_TIMESTAMP
        ELSE actual_delivery_date
      END
    WHERE id = NEW.order_id;
  ELSE
    UPDATE orders
    SET status = new_status::order_status
    WHERE id = NEW.order_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the manual sync function to also handle actual_delivery_date
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

    -- Update the order status and actual_delivery_date if needed
    IF new_status = 'delivered' THEN
      UPDATE orders
      SET 
        status = new_status,
        actual_delivery_date = CASE 
          WHEN actual_delivery_date IS NULL THEN CURRENT_TIMESTAMP
          ELSE actual_delivery_date
        END
      WHERE id = p_order_id;
    ELSE
      UPDATE orders
      SET status = new_status
      WHERE id = p_order_id;
    END IF;
    
    RETURN new_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 