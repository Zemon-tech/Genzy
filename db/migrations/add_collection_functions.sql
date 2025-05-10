-- Function to get unique collection names from all products
CREATE OR REPLACE FUNCTION get_unique_collections()
RETURNS TABLE (collection_name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT unnest(collections) as collection_name
  FROM products
  WHERE collections IS NOT NULL AND array_length(collections, 1) > 0
  ORDER BY collection_name;
$$;

-- Function to remove a collection from all products
CREATE OR REPLACE FUNCTION remove_collection_from_products(collection_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products
  SET collections = array_remove(collections, collection_name)
  WHERE collections @> ARRAY[collection_name];
END;
$$;

-- Allow admin access to these functions
GRANT EXECUTE ON FUNCTION get_unique_collections TO authenticated;
GRANT EXECUTE ON FUNCTION remove_collection_from_products TO authenticated; 