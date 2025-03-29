-- Create sizechart bucket if it doesn't exist and make it public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('sizechart', 'sizechart', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies for the sizechart bucket to avoid conflicts
DROP POLICY IF EXISTS "Allow public access to read sizechart files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload sizechart files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update sizechart files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete sizechart files" ON storage.objects;

-- 1. SELECT: Allow public access to read from sizechart bucket
CREATE POLICY "Allow public access to read sizechart files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'sizechart');

-- 2. INSERT: Allow authenticated users to upload to sizechart bucket
CREATE POLICY "Allow authenticated users to upload sizechart files"
ON storage.objects 
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'sizechart');

-- 3. UPDATE: Allow authenticated users to update objects in sizechart bucket
CREATE POLICY "Allow authenticated users to update sizechart files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'sizechart')
WITH CHECK (bucket_id = 'sizechart');

-- 4. DELETE: Allow authenticated users to delete objects from sizechart bucket
CREATE POLICY "Allow authenticated users to delete sizechart files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'sizechart');

-- Add size chart image URL fields to sellers table if they don't exist
DO $$ 
BEGIN
    -- Check if the columns already exist before adding them
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'sellers'
                  AND column_name = 'size_chart_image1_url') THEN
        ALTER TABLE public.sellers 
        ADD COLUMN size_chart_image1_url TEXT DEFAULT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'sellers'
                  AND column_name = 'size_chart_image2_url') THEN
        ALTER TABLE public.sellers 
        ADD COLUMN size_chart_image2_url TEXT DEFAULT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'sellers'
                  AND column_name = 'size_chart_image3_url') THEN
        ALTER TABLE public.sellers 
        ADD COLUMN size_chart_image3_url TEXT DEFAULT NULL;
    END IF;
END
$$; 