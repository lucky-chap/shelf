-- Add custom_domain column to site_config table
ALTER TABLE site_config 
  ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255);

-- Add index for custom domain lookups
CREATE INDEX IF NOT EXISTS idx_site_config_custom_domain ON site_config(custom_domain);
