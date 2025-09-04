-- Add unique constraint to prevent duplicate purchases for the same session
ALTER TABLE purchases 
  ADD CONSTRAINT unique_stripe_session_product 
  UNIQUE (stripe_session_id, product_id);

-- Add index for better performance on purchase lookups
CREATE INDEX idx_purchases_session_product ON purchases(stripe_session_id, product_id);
