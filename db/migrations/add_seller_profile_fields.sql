-- Migration to add additional profile fields to the sellers table

-- Add gst_number and business_address columns to the sellers table if they don't exist
DO $$ 
BEGIN
    -- Check if the gst_number column already exists before adding it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'sellers'
                  AND column_name = 'gst_number') THEN
        ALTER TABLE public.sellers 
        ADD COLUMN gst_number TEXT DEFAULT NULL;
        
        COMMENT ON COLUMN public.sellers.gst_number IS 'GST registration number of the seller';
    END IF;
    
    -- Check if the business_address column already exists before adding it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'sellers'
                  AND column_name = 'business_address') THEN
        ALTER TABLE public.sellers 
        ADD COLUMN business_address TEXT DEFAULT NULL;
        
        COMMENT ON COLUMN public.sellers.business_address IS 'Physical address of the seller''s business';
    END IF;
END
$$;

-- Update RLS policies to allow sellers to update their own profile fields
DROP POLICY IF EXISTS "Sellers can update their own profile" ON public.sellers;

CREATE POLICY "Sellers can update their own profile"
ON public.sellers
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Add an index on gst_number for faster lookups
CREATE INDEX IF NOT EXISTS "sellers_gst_number_idx" ON public.sellers (gst_number); 