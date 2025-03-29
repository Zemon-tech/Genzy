-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Sellers can manage their own products" ON products;
DROP POLICY IF EXISTS "Sellers can insert their own products" ON products;
DROP POLICY IF EXISTS "Sellers can update their own products" ON products;
DROP POLICY IF EXISTS "Sellers can delete their own products" ON products;

-- Create policy allowing anyone to view products
CREATE POLICY "Anyone can view products"
ON products
FOR SELECT
USING (true);

-- Create separate policies for each operation
CREATE POLICY "Sellers can insert their own products"
ON products
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = seller_id::text);

CREATE POLICY "Sellers can update their own products"
ON products
FOR UPDATE
TO authenticated
USING (auth.uid()::text = seller_id::text);

CREATE POLICY "Sellers can delete their own products"
ON products
FOR DELETE
TO authenticated
USING (auth.uid()::text = seller_id::text);

-- Storage bucket policies
-- Make sure the storage bucket is public
INSERT INTO storage.buckets (id, name, public) VALUES ('productimages', 'productimages', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing storage policies first to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to select their images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to read files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their images" ON storage.objects;

-- Create storage policies
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects 
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'productimages');

CREATE POLICY "Allow public access to read files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'productimages');

CREATE POLICY "Allow users to update their images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'productimages')
WITH CHECK (bucket_id = 'productimages');

CREATE POLICY "Allow users to delete their images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'productimages'); 