-- Add download_url column to purchases table
ALTER TABLE purchases 
  ADD COLUMN IF NOT EXISTS download_url TEXT;

-- Update existing purchases to have their product's download URL
UPDATE purchases p
SET download_url = pr.download_url
FROM products pr
WHERE p.product_id = pr.id
  AND p.download_url IS NULL;
