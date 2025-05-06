-- Create the category-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('category-images', 'category-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for category-images bucket
-- Anyone can view the images
CREATE POLICY "Category Images Public Access" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'category-images');

-- Only authenticated users with admin role can insert new images
CREATE POLICY "Category Images Admin Insert Access"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'category-images' AND
    auth.uid() IN (
        SELECT auth.uid()
        FROM auth.users
        WHERE auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- Only authenticated users with admin role can update images
CREATE POLICY "Category Images Admin Update Access"
ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'category-images' AND
    auth.uid() IN (
        SELECT auth.uid()
        FROM auth.users
        WHERE auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- Only authenticated users with admin role can delete images
CREATE POLICY "Category Images Admin Delete Access"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'category-images' AND
    auth.uid() IN (
        SELECT auth.uid()
        FROM auth.users
        WHERE auth.users.raw_user_meta_data->>'role' = 'admin'
    )
); 