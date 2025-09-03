-- Add background and theme fields to site_config table
ALTER TABLE site_config 
  ADD COLUMN IF NOT EXISTS background_type VARCHAR(20) DEFAULT 'solid',
  ADD COLUMN IF NOT EXISTS background_image_url TEXT,
  ADD COLUMN IF NOT EXISTS selected_theme VARCHAR(50);

-- Add index for theme lookups
CREATE INDEX IF NOT EXISTS idx_site_config_selected_theme ON site_config(selected_theme);

-- Update existing records to have default background type
UPDATE site_config 
SET background_type = 'solid' 
WHERE background_type IS NULL;
