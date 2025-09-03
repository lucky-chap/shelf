-- Remove user_id foreign key constraints and columns from all tables
-- This converts the app to a single-user system without authentication

-- Drop foreign key constraints first
ALTER TABLE links DROP CONSTRAINT IF EXISTS links_user_id_fkey;
ALTER TABLE IF EXISTS products DROP CONSTRAINT IF EXISTS products_user_id_fkey;
ALTER TABLE guest_entries DROP CONSTRAINT IF EXISTS guest_entries_user_id_fkey;

-- Drop user_id columns
ALTER TABLE links DROP COLUMN IF EXISTS user_id;
ALTER TABLE IF EXISTS products DROP COLUMN IF EXISTS user_id;
ALTER TABLE guest_entries DROP COLUMN IF EXISTS user_id;

-- Update site_config table structure
ALTER TABLE site_config 
  ADD COLUMN IF NOT EXISTS site_title VARCHAR(200),
  ADD COLUMN IF NOT EXISTS site_description TEXT,
  ADD COLUMN IF NOT EXISTS owner_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS owner_bio TEXT,
  ADD COLUMN IF NOT EXISTS owner_avatar_url TEXT;

-- Migrate existing data if it exists
UPDATE site_config SET 
  site_title = COALESCE(title, 'My Creator Landing'),
  site_description = COALESCE(description, 'Welcome to my page'),
  owner_name = 'Creator',
  owner_bio = NULL,
  owner_avatar_url = avatar_url
WHERE id = 1;

-- Drop old columns if they exist
ALTER TABLE site_config DROP COLUMN IF EXISTS title;
ALTER TABLE site_config DROP COLUMN IF EXISTS description;
ALTER TABLE site_config DROP COLUMN IF EXISTS avatar_url;
