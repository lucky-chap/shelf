-- Add layout_type column to site_config table
ALTER TABLE site_config 
  ADD COLUMN IF NOT EXISTS layout_type VARCHAR(70);

-- Add index for layout type lookups
CREATE INDEX IF NOT EXISTS idx_site_config_layout_type ON site_config(layout_type);
