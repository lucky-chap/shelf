-- Remove pay what you want pricing features
-- Make price_cents NOT NULL and remove min_price_cents column

-- First, update any NULL price_cents to a default value (e.g., $9.99)
UPDATE products SET price_cents = 999 WHERE price_cents IS NULL;

-- Make price_cents NOT NULL
ALTER TABLE products 
  ALTER COLUMN price_cents SET NOT NULL;

-- Drop the min_price_cents column
ALTER TABLE products 
  DROP COLUMN IF EXISTS min_price_cents;
