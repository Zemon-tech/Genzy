-- Create collections table for storing collection metadata
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  banner_url TEXT,
  thumbnail_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to automatically set updated_at on update
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON collections
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Insert existing collections from products table
INSERT INTO collections (name)
SELECT DISTINCT unnest(collections) as name
FROM products
WHERE collections IS NOT NULL AND array_length(collections, 1) > 0
ON CONFLICT (name) DO NOTHING;

-- Create RLS policies
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Policy for read access
CREATE POLICY "Allow public read access" ON collections
  FOR SELECT USING (true);

-- Policy for authenticated users to insert/update/delete
CREATE POLICY "Allow authenticated users to manage" ON collections
  USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON collections TO authenticated;
GRANT SELECT ON collections TO anon; 