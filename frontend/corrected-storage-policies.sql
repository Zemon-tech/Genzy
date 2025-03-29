-- Make sure the productimages bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('productimages', 'productimages', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies for the rk11yf_* folders that appear in your screenshot
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder rk11yf_0" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder rk11yf_1" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder rk11yf_2" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder rk11yf_3" ON storage.objects;

-- Drop other existing policies to ensure no conflicts
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to select their images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to read files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view productimages" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to select their images" ON storage.objects;

-- CREATE 4 SIMPLE POLICIES - ONE FOR EACH OPERATION:

-- 1. SELECT: Allow public access to read from productimages bucket
CREATE POLICY "Allow public access to read files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'productimages');

-- 2. INSERT: Allow authenticated users to upload to productimages bucket
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects 
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'productimages');

-- 3. UPDATE: Allow authenticated users to update objects in productimages bucket
CREATE POLICY "Allow authenticated users to update files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'productimages')
WITH CHECK (bucket_id = 'productimages');

-- 4. DELETE: Allow authenticated users to delete objects from productimages bucket
CREATE POLICY "Allow authenticated users to delete files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'productimages'); 