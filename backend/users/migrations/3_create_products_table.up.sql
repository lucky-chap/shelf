CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  price_cents INTEGER, -- NULL for "pay what you want"
  min_price_cents INTEGER DEFAULT 0,
  download_url TEXT NOT NULL,
  preview_image_url TEXT,
  file_size_bytes BIGINT,
  file_type VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT true,
  purchase_count BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_active ON products(is_active);
