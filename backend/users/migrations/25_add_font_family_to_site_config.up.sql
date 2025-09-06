-- Add font_family column to site_config table
ALTER TABLE site_config
  ADD COLUMN IF NOT EXISTS font_family VARCHAR(100) DEFAULT 'sans-serif';

-- Add index for font family lookups
CREATE INDEX IF NOT EXISTS idx_site_config_font_family ON site_config(font_family);
