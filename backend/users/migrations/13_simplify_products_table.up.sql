-- Remove file-related columns from products table since we're using external URLs only
ALTER TABLE products 
  DROP COLUMN IF EXISTS file_size_bytes,
  DROP COLUMN IF EXISTS file_type;

-- Ensure download_url and preview_image_url columns exist and are properly typed
ALTER TABLE products 
  ALTER COLUMN download_url SET NOT NULL;
