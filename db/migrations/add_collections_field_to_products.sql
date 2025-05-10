-- Add collections field to the products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS collections TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN products.collections IS 'Array of collection names that this product belongs to';

-- Create an index for faster querying of collections
CREATE INDEX IF NOT EXISTS products_collections_idx ON products USING GIN (collections);

-- RLS policy remains the same for this field as it inherits from the table-level policies 