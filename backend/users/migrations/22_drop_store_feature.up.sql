-- Remove all store-related tables. This fully removes the Digital Store feature.
-- Safe to run multiple times due to IF EXISTS.
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS products CASCADE;
