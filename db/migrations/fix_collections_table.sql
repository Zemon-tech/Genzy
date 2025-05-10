-- Fix any potential duplicate entries in collections table

-- Create a temporary table to identify duplicates
DO $$
DECLARE
    duplicate_found BOOLEAN;
BEGIN
    -- Check if there are any duplicates
    SELECT EXISTS(
        SELECT name, COUNT(*)
        FROM collections
        GROUP BY name
        HAVING COUNT(*) > 1
    ) INTO duplicate_found;
    
    IF duplicate_found THEN
        -- Create a temporary table with row numbers for duplicates
        CREATE TEMP TABLE duplicate_collections AS
        SELECT id, name, 
               ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at) as row_num
        FROM collections;
        
        -- Delete duplicates (keeping only the first occurrence)
        DELETE FROM collections
        WHERE id IN (
            SELECT id FROM duplicate_collections WHERE row_num > 1
        );
    END IF;
END $$;

-- Update existing null fields with empty strings to prevent null constraint issues
UPDATE collections 
SET banner_url = '' 
WHERE banner_url IS NULL;

UPDATE collections 
SET thumbnail_url = '' 
WHERE thumbnail_url IS NULL;

UPDATE collections 
SET description = '' 
WHERE description IS NULL;

-- Add ON CONFLICT behavior to update instead of trying to insert duplicates
CREATE OR REPLACE FUNCTION upsert_collection(
    p_name TEXT,
    p_banner_url TEXT DEFAULT NULL,
    p_thumbnail_url TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO collections (name, banner_url, thumbnail_url, description)
    VALUES (p_name, COALESCE(p_banner_url, ''), COALESCE(p_thumbnail_url, ''), COALESCE(p_description, ''))
    ON CONFLICT (name) 
    DO UPDATE SET 
        banner_url = COALESCE(p_banner_url, collections.banner_url),
        thumbnail_url = COALESCE(p_thumbnail_url, collections.thumbnail_url),
        description = COALESCE(p_description, collections.description),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION upsert_collection TO authenticated; 