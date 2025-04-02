-- Create the coupons table
CREATE TABLE IF NOT EXISTS "public"."coupons" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "code" text NOT NULL,
  "discount_type" text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  "discount_value" numeric NOT NULL,
  "min_order_value" numeric DEFAULT NULL,
  "max_discount" numeric DEFAULT NULL,
  "expiry_date" timestamptz NOT NULL,
  "brand_id" uuid DEFAULT NULL,
  "brand_name" text DEFAULT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "is_active" boolean NOT NULL DEFAULT true,
  "description" text DEFAULT NULL,
  "usage_limit" integer DEFAULT NULL,
  "usage_count" integer DEFAULT 0,
  PRIMARY KEY ("id"),
  CONSTRAINT "unique_coupon_code" UNIQUE ("code")
);

-- Add comment to table
COMMENT ON TABLE "public"."coupons" IS 'Stores coupon codes for the e-commerce platform';

-- Add comments to columns
COMMENT ON COLUMN "public"."coupons"."code" IS 'Unique coupon code (uppercase)';
COMMENT ON COLUMN "public"."coupons"."discount_type" IS 'Type of discount: percentage or fixed amount';
COMMENT ON COLUMN "public"."coupons"."discount_value" IS 'Value of the discount (percentage or fixed amount)';
COMMENT ON COLUMN "public"."coupons"."min_order_value" IS 'Minimum order value required to apply this coupon';
COMMENT ON COLUMN "public"."coupons"."max_discount" IS 'Maximum discount amount for percentage discounts';
COMMENT ON COLUMN "public"."coupons"."expiry_date" IS 'Date when the coupon expires';
COMMENT ON COLUMN "public"."coupons"."brand_id" IS 'If set, coupon only applies to this brand/seller';
COMMENT ON COLUMN "public"."coupons"."brand_name" IS 'Name of the brand for brand-specific coupons';
COMMENT ON COLUMN "public"."coupons"."is_active" IS 'Whether the coupon is currently active';
COMMENT ON COLUMN "public"."coupons"."description" IS 'Description of the coupon for admin reference';
COMMENT ON COLUMN "public"."coupons"."usage_limit" IS 'Maximum number of times this coupon can be used';
COMMENT ON COLUMN "public"."coupons"."usage_count" IS 'Current usage count of this coupon';

-- Create indexes
CREATE INDEX IF NOT EXISTS "coupons_code_idx" ON "public"."coupons" ("code");
CREATE INDEX IF NOT EXISTS "coupons_expiry_date_idx" ON "public"."coupons" ("expiry_date");
CREATE INDEX IF NOT EXISTS "coupons_brand_id_idx" ON "public"."coupons" ("brand_id");

-- Create RLS policies
ALTER TABLE "public"."coupons" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to read coupons (for validation)
CREATE POLICY "Allow users to read coupons" 
ON "public"."coupons" 
FOR SELECT 
TO authenticated
USING (true);

-- Create policy to allow only admins to manage coupons
CREATE POLICY "Allow admins to manage coupons" 
ON "public"."coupons" 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "public"."admin_profiles" 
    WHERE "admin_profiles"."user_id" = auth.uid()
  )
);

-- Insert sample coupons
INSERT INTO "public"."coupons" (
  "code", "discount_type", "discount_value", 
  "min_order_value", "max_discount", "expiry_date", 
  "is_active", "description"
) VALUES
(
  'WELCOME10', 'percentage', 10, 
  500, 200, (NOW() + INTERVAL '30 days'), 
  true, 'Welcome coupon for 10% off'
),
(
  'SUMMER2023', 'percentage', 15, 
  1000, 500, (NOW() + INTERVAL '60 days'), 
  true, 'Summer sale coupon'
),
(
  'FLAT100', 'fixed', 100, 
  500, NULL, (NOW() + INTERVAL '30 days'), 
  true, 'Flat ₹100 off on orders above ₹500'
); 