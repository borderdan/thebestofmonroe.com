-- Phase 24: Real-Time Multi-Device Inventory Sync
-- Enables Supabase Realtime for the products table to sync stock across devices

-- 1. Add 'products' to the 'supabase_realtime' publication
-- Note: Depending on your environment, you might need to enable the publication first.
-- In Supabase, the 'supabase_realtime' publication already exists.
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;

-- 2. Ensure REPLICA IDENTITY is set to FULL for the products table
-- This allows us to receive the previous row state in the realtime payload if needed.
-- For simple stock sync, DEFAULT (PK only) is usually enough, but FULL is safer for complex sync.
ALTER TABLE public.products REPLICA IDENTITY FULL;

-- 3. Add a check constraint to products to prevent negative stock at the DB level
-- This is the ultimate "Conflict Resolution" guardrail.
ALTER TABLE public.products 
    ADD CONSTRAINT check_stock_not_negative 
    CHECK (stock_quantity >= 0);
