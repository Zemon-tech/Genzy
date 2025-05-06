-- Create the featured_categories table
CREATE TABLE IF NOT EXISTS featured_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_name TEXT NOT NULL,
    image_url TEXT,
    rank INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on rank for ordering
CREATE INDEX IF NOT EXISTS featured_categories_rank_idx ON featured_categories(rank);

-- Add RLS policies
ALTER TABLE featured_categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY featured_categories_select_policy ON featured_categories
    FOR SELECT
    USING (true);

-- Only allow authenticated users with admin role to modify the featured categories
CREATE POLICY featured_categories_insert_policy ON featured_categories
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT auth.uid()
            FROM auth.users
            WHERE auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY featured_categories_update_policy ON featured_categories
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT auth.uid()
            FROM auth.users
            WHERE auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY featured_categories_delete_policy ON featured_categories
    FOR DELETE
    USING (
        auth.uid() IN (
            SELECT auth.uid()
            FROM auth.users
            WHERE auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Add table comment for documentation
COMMENT ON TABLE featured_categories IS 'Stores categories featured on the homepage';
COMMENT ON COLUMN featured_categories.category_name IS 'Name of the category to feature';
COMMENT ON COLUMN featured_categories.image_url IS 'Optional image URL for the category';
COMMENT ON COLUMN featured_categories.rank IS 'Display order for categories'; 