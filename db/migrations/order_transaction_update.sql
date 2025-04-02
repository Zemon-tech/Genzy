-- Add transaction_id column to the orders table
ALTER TABLE "public"."orders"
ADD COLUMN IF NOT EXISTS "transaction_id" text DEFAULT NULL;

-- Add comment to the new column
COMMENT ON COLUMN "public"."orders"."transaction_id" IS 'Transaction ID for payments (COD/Razorpay)';

-- Create an index on the transaction_id column for faster lookups
CREATE INDEX IF NOT EXISTS "orders_transaction_id_idx" ON "public"."orders" ("transaction_id");

-- Create a function to increment coupon usage count
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_code_param TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE "public"."coupons"
  SET "usage_count" = "usage_count" + 1
  WHERE "code" = coupon_code_param;
END;
$$; 