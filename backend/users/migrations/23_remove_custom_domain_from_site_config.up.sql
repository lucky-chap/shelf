-- Remove custom_domain column from site_config table
ALTER TABLE site_config 
  DROP COLUMN IF EXISTS custom_domain;

-- Drop index for custom domain lookups
DROP INDEX IF EXISTS idx_site_config_custom_domain;
