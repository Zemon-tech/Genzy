-- Add coupon-related columns to the orders table
ALTER TABLE "public"."orders"
ADD COLUMN IF NOT EXISTS "coupon_code" text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS "coupon_discount" numeric DEFAULT 0;

-- Add comments to the new columns
COMMENT ON COLUMN "public"."orders"."coupon_code" IS 'Code of the coupon applied to this order';
COMMENT ON COLUMN "public"."orders"."coupon_discount" IS 'Discount amount from applied coupon';

-- Create an index on the coupon_code column for faster lookups
CREATE INDEX IF NOT EXISTS "orders_coupon_code_idx" ON "public"."orders" ("coupon_code"); 