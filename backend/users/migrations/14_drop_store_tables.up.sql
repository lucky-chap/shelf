-- Drop store-related tables and associated objects.
-- This removes the Digital Store feature (products and purchases).

-- Drop purchases first due to FK dependencies on products.
DROP TABLE IF EXISTS purchases CASCADE;

-- Then drop products.
DROP TABLE IF EXISTS products CASCADE;
