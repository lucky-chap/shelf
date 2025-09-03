-- Create products table for digital store
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0, -- 0 for free downloads
  cover_key TEXT,
  cover_url TEXT,
  file_key TEXT NOT NULL,
  download_url TEXT NOT NULL, -- secure pre-signed URL (expires, refreshed on updates/purchase)
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_products_active_created ON products(is_active, created_at DESC);
