-- Create products table for digital store
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0, -- Price in cents (0 for free, minimum 100 for $1)
  cover_image_url TEXT, -- URL to cover image in object storage
  file_url TEXT NOT NULL, -- URL to downloadable file in object storage
  file_name TEXT NOT NULL, -- Original filename
  file_size BIGINT NOT NULL DEFAULT 0, -- File size in bytes
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  download_count BIGINT NOT NULL DEFAULT 0, -- Track how many times downloaded
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchases table to track completed purchases
CREATE TABLE purchases (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  stripe_session_id VARCHAR(500), -- Stripe checkout session ID (null for free products)
  stripe_payment_intent_id VARCHAR(500), -- Stripe payment intent ID
  customer_email VARCHAR(500), -- Customer email from Stripe or form
  amount_paid_cents INTEGER NOT NULL DEFAULT 0, -- Amount paid in cents
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  download_count INTEGER NOT NULL DEFAULT 0, -- How many times this purchase was downloaded
  last_downloaded_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_sort_order ON products(sort_order);
CREATE INDEX idx_products_price ON products(price_cents);

CREATE INDEX idx_purchases_product_id ON purchases(product_id);
CREATE INDEX idx_purchases_stripe_session_id ON purchases(stripe_session_id);
CREATE INDEX idx_purchases_customer_email ON purchases(customer_email);
CREATE INDEX idx_purchases_purchase_date ON purchases(purchase_date);
