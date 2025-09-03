-- Enforce Stripe minimum charge for USD: price must be 0 (free) or at least 50 cents.
-- First, correct any existing rows that violate this rule by bumping to 50 cents.
UPDATE products
SET price_cents = 50
WHERE price_cents IS NOT NULL AND price_cents > 0 AND price_cents < 50;

-- Add a database-level check constraint to prevent invalid prices.
ALTER TABLE products
  ADD CONSTRAINT products_price_min
  CHECK (price_cents = 0 OR price_cents >= 50);
