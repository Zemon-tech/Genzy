# Instructions for Applying Database Migration

To fix the collections table and enable proper updating of collection image URLs, you need to run the `fix_collections_table.sql` migration script on your Supabase database.

## Steps:

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the content of `db/migrations/fix_collections_table.sql` into the query editor
5. Run the query

## What this migration does:

1. Removes any duplicate collection entries (keeping the oldest one)
2. Updates NULL fields to empty strings to prevent constraint issues
3. Creates a helper function `upsert_collection` that can be used to safely create or update collections
4. Applies proper permissions to the function

After running this migration, your app should be able to correctly add image URLs to collections without encountering constraint errors. 