CREATE TABLE purchases (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  buyer_email VARCHAR(255) NOT NULL,
  buyer_name VARCHAR(255),
  amount_paid_cents INTEGER NOT NULL,
  payment_provider VARCHAR(50) NOT NULL, -- 'stripe', 'paypal', etc.
  payment_id VARCHAR(255) NOT NULL,
  download_token VARCHAR(255) UNIQUE NOT NULL,
  download_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  download_count INTEGER NOT NULL DEFAULT 0,
  max_downloads INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_purchases_product_id ON purchases(product_id);
CREATE INDEX idx_purchases_download_token ON purchases(download_token);
CREATE INDEX idx_purchases_buyer_email ON purchases(buyer_email);
