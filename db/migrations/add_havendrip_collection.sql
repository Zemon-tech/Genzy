-- Create the havendrip_collection table
CREATE TABLE IF NOT EXISTS havendrip_collection (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    rank INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on product_id for faster lookups
CREATE INDEX IF NOT EXISTS havendrip_collection_product_id_idx ON havendrip_collection(product_id);
CREATE INDEX IF NOT EXISTS havendrip_collection_rank_idx ON havendrip_collection(rank);

-- Add RLS policies
ALTER TABLE havendrip_collection ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY havendrip_collection_select_policy ON havendrip_collection
    FOR SELECT
    USING (true);

-- Only allow authenticated users with admin role to modify the collection
CREATE POLICY havendrip_collection_insert_policy ON havendrip_collection
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT auth.uid()
            FROM auth.users
            WHERE auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY havendrip_collection_update_policy ON havendrip_collection
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT auth.uid()
            FROM auth.users
            WHERE auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY havendrip_collection_delete_policy ON havendrip_collection
    FOR DELETE
    USING (
        auth.uid() IN (
            SELECT auth.uid()
            FROM auth.users
            WHERE auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Add table comment for documentation
COMMENT ON TABLE havendrip_collection IS 'Stores products for the curated Havendrip collection';
COMMENT ON COLUMN havendrip_collection.product_id IS 'Reference to the product in the products table';
COMMENT ON COLUMN havendrip_collection.rank IS 'Display order for products in the collection'; 