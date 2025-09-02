-- Clean up any upload-related data and simplify product structure
-- Ensure all products have proper external URLs

-- Update any products that might have internal URLs to use external ones
-- This is just a safety migration in case there's existing data
UPDATE products 
SET download_url = CONCAT('https://example.com/download/', id, '.pdf')
WHERE download_url LIKE '/api/uploads/%' OR download_url LIKE 'http://localhost%';

-- Ensure preview URLs are external or null
UPDATE products 
SET preview_image_url = NULL
WHERE preview_image_url LIKE '/api/uploads/%' OR preview_image_url LIKE 'http://localhost%';
