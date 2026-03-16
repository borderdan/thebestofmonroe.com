-- Phase 20: Enterprise Commercialization & Edge Resilience
-- Implementation of SaaS Monetization, Advanced Inventory, and PWA logic

-- 1. Monetization Enhancements
-- Denormalize subscription status for faster tenant checks
ALTER TABLE public.businesses
    ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing';

CREATE INDEX IF NOT EXISTS idx_businesses_stripe_cust ON public.businesses(stripe_customer_id);

-- 2. Advanced Inventory Schema
-- Transition from generic 'entities' to specialized 'products'
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    barcode TEXT,
    sku TEXT,
    price NUMERIC(10, 2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compound index for fast POS barcode lookups per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_business_barcode 
    ON public.products(business_id, barcode) 
    WHERE barcode IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_business_sku 
    ON public.products(business_id, sku);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Tenant CRUD Isolation
CREATE POLICY "Tenant CRUD Own Products" ON public.products
    FOR ALL USING (business_id = public.get_auth_business_id())
    WITH CHECK (business_id = public.get_auth_business_id());

-- Automated Modification Timing
CREATE TRIGGER update_products_modtime
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- 3. Migration logic (optional/advisory):
-- Consider migrating 'menu_item' entities to the products table if needed.
-- For now, new inventory will populate this table.
