-- Fix Storage Policies for productimages and sizechart buckets
-- This script ensures that both buckets are public and have correct RLS policies

-- Make sure the buckets exist and are public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('productimages', 'productimages', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('sizechart', 'sizechart', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies for both buckets to avoid conflicts
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

-- TEMPORARILY DISABLE RLS TO CHECK IF IT RESOLVES THE ISSUE
-- Note: This is a temporary solution for debugging - for a production environment, 
-- more specific policies should be reinstated
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- CREATE UNIVERSAL POLICIES FOR ALL OPERATIONS:

-- 1. SELECT: Anyone can read any file from any bucket
CREATE POLICY "Universal read access for all buckets"
ON storage.objects
FOR SELECT
USING (true);

-- 2. INSERT: Any authenticated user can upload to any bucket
CREATE POLICY "Universal upload access for authenticated users"
ON storage.objects 
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. UPDATE: Any authenticated user can update any file
CREATE POLICY "Universal update access for authenticated users"
ON storage.objects
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. DELETE: Any authenticated user can delete any file
CREATE POLICY "Universal delete access for authenticated users"
ON storage.objects
FOR DELETE
TO authenticated
USING (true);

-- Re-enable RLS after setting up the new policies
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 