-- Phase 31: Multi-Currency Support & Live Exchange Rates

-- 1. Table for global exchange rates (Base: MXN)
CREATE TABLE IF NOT EXISTS public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency TEXT NOT NULL, -- e.g., 'USD'
    to_currency TEXT NOT NULL DEFAULT 'MXN',
    rate NUMERIC(18, 6) NOT NULL,
    provider TEXT DEFAULT 'openexchangerates',
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(from_currency, to_currency)
);

-- 2. Business Currency Settings
CREATE TABLE IF NOT EXISTS public.business_currencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    currency_code TEXT NOT NULL, -- 'USD', 'EUR', 'MXN'
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(business_id, currency_code)
);

-- 3. Update Transactions to record the rate used
ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS exchange_rate_at_time NUMERIC(18, 6) DEFAULT 1.0;

-- 4. RLS
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_currencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view exchange rates" ON public.exchange_rates
    FOR SELECT USING (true);

CREATE POLICY "Tenants manage their currencies" ON public.business_currencies
    FOR ALL USING (business_id = public.get_auth_business_id())
    WITH CHECK (business_id = public.get_auth_business_id());

-- 5. Seed initial rates
INSERT INTO public.exchange_rates (from_currency, to_currency, rate)
VALUES 
    ('USD', 'MXN', 18.50),
    ('EUR', 'MXN', 20.10),
    ('MXN', 'MXN', 1.00)
ON CONFLICT (from_currency, to_currency) DO UPDATE SET rate = EXCLUDED.rate, updated_at = NOW();
