-- Secure Storage Policies for productimages and sizechart buckets
-- This script sets up proper bucket-specific policies with improved security

-- Make sure the buckets exist and are public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('productimages', 'productimages', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('sizechart', 'sizechart', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies (including universal ones we may have created)
DROP POLICY IF EXISTS "Universal read access for all buckets" ON storage.objects;
DROP POLICY IF EXISTS "Universal upload access for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Universal update access for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Universal delete access for authenticated users" ON storage.objects;

DROP POLICY IF EXISTS "Allow public access to read files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete files" ON storage.objects;

DROP POLICY IF EXISTS "Allow public access to read sizechart files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload sizechart files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update sizechart files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete sizechart files" ON storage.objects;

DROP POLICY IF EXISTS "Allow public access to productimages" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload productimages" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update productimages" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete productimages" ON storage.objects;

-- Make sure RLS is enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- PRODUCTIMAGES BUCKET POLICIES

-- 1. SELECT: Anyone can read from productimages bucket
CREATE POLICY "Anyone can view productimages"
ON storage.objects
FOR SELECT
USING (bucket_id = 'productimages');

-- 2. INSERT: Authenticated users can upload to productimages bucket
CREATE POLICY "Authenticated users can upload to productimages"
ON storage.objects 
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'productimages');

-- 3. UPDATE: Authenticated users can update their own files in productimages
CREATE POLICY "Authenticated users can update their productimages"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'productimages' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'productimages');

-- 4. DELETE: Authenticated users can delete their own files from productimages
CREATE POLICY "Authenticated users can delete their productimages"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'productimages' AND auth.uid() = owner);

-- SIZECHART BUCKET POLICIES

-- 1. SELECT: Anyone can read from sizechart bucket
CREATE POLICY "Anyone can view sizecharts"
ON storage.objects
FOR SELECT
USING (bucket_id = 'sizechart');

-- 2. INSERT: Authenticated users can upload to sizechart bucket
CREATE POLICY "Authenticated users can upload to sizechart"
ON storage.objects 
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'sizechart');

-- 3. UPDATE: Authenticated users can update their own files in sizechart
CREATE POLICY "Authenticated users can update their sizecharts"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'sizechart' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'sizechart');

-- 4. DELETE: Authenticated users can delete their own files from sizechart
CREATE POLICY "Authenticated users can delete their sizecharts"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'sizechart' AND auth.uid() = owner);

-- Note: If you need seller-specific policies later, you could refine these further
-- by adding conditions that link to the seller's ID in your database 