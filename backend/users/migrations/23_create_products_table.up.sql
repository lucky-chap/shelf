-- Create products table for digital store
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0,
  cover_url TEXT NOT NULL,
  download_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraint to ensure price is 0 (free) or at least 50 cents (Stripe minimum)
ALTER TABLE products
  ADD CONSTRAINT products_price_min
  CHECK (price_cents = 0 OR price_cents >= 50);

CREATE INDEX idx_products_active_created ON products(is_active, created_at DESC);
