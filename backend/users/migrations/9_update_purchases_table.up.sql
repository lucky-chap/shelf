-- Update purchases table to match the new payment flow structure
-- Add any missing columns and update constraints

-- Ensure download_token is unique and not null
ALTER TABLE purchases 
  ALTER COLUMN download_token SET NOT NULL;

-- Add index on payment_id for webhook lookups
CREATE INDEX IF NOT EXISTS idx_purchases_payment_id ON purchases(payment_id);

-- Add index on download_token for download lookups  
CREATE INDEX IF NOT EXISTS idx_purchases_download_token ON purchases(download_token);

-- Ensure payment_id is unique to prevent duplicate purchases
ALTER TABLE purchases 
  ADD CONSTRAINT unique_payment_id UNIQUE (payment_id);
