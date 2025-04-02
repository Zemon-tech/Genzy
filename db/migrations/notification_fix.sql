-- Fix for notification permission issue when updating order status

-- Check if there's a notification trigger causing the issue
SELECT pg_get_triggerdef(oid) 
FROM pg_trigger 
WHERE tgname LIKE '%notification%';

-- Create a secure function to handle notification creation
CREATE OR REPLACE FUNCTION create_order_status_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a notification for the user when order status changes
  INSERT INTO notifications (
    user_id,
    message,
    title,
    type,
    is_read
  )
  SELECT
    o.user_id,
    'Your order #' || SUBSTRING(NEW.id::text, 1, 8) || ' status has been updated to ' || NEW.status::text,
    'Order Status Update',
    'order_update',
    false
  FROM orders o
  WHERE o.id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers that might be causing issues
DROP TRIGGER IF EXISTS order_status_notification_trigger ON orders;

-- Create a new trigger with proper permissions
CREATE TRIGGER order_status_notification_trigger
AFTER UPDATE OF status ON orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION create_order_status_notification();

-- Grant proper permissions to the seller role on the notifications table
GRANT SELECT, INSERT ON notifications TO authenticated;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

-- Ensure the RLS policy for notifications allows sellers to create notifications
CREATE POLICY "System can create notifications" 
ON notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Make sure RLS is enabled on the notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create a bypass function for updating order status
CREATE OR REPLACE FUNCTION update_order_status(p_order_id UUID, p_status TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  status_result BOOLEAN;
BEGIN
  -- Update the order status directly without triggering the notification
  -- This avoids the RLS issues
  UPDATE orders
  SET status = p_status::order_status
  WHERE id = p_order_id
  RETURNING true INTO status_result;
  
  -- Manually create the notification without relying on the trigger
  IF status_result THEN
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
  END IF;
  
  RETURN status_result;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION update_order_status TO authenticated; 