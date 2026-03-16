-- Phase 27: Smart Customer Loyalty & Point Engine
-- Implements points-based rewards for the CRM and POS

-- 1. Loyalty Configuration (Per-Business)
CREATE TABLE IF NOT EXISTS public.loyalty_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID UNIQUE NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT false,
    points_per_currency NUMERIC(10, 2) DEFAULT 1.00, -- e.g., 1 point per $1 spent
    redemption_ratio NUMERIC(10, 2) DEFAULT 0.05,    -- e.g., 100 points = $5 discount (0.05 value per point)
    min_points_to_redeem INT DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Extend CRM Customers with Points
ALTER TABLE public.crm_customers
    ADD COLUMN IF NOT EXISTS loyalty_points INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_points_earned INT DEFAULT 0;

-- 3. Loyalty Transactions Ledger
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.crm_customers(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    points_change INT NOT NULL, -- Positive for earn, negative for redeem
    type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'adjustment')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RLS Policies
ALTER TABLE public.loyalty_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants manage loyalty configs" ON public.loyalty_configs
    FOR ALL USING (business_id = public.get_auth_business_id())
    WITH CHECK (business_id = public.get_auth_business_id());

CREATE POLICY "Tenants view loyalty transactions" ON public.loyalty_transactions
    FOR ALL USING (business_id = public.get_auth_business_id())
    WITH CHECK (business_id = public.get_auth_business_id());

-- 5. Trigger to automatically update customer points on loyalty_transaction insert
CREATE OR REPLACE FUNCTION public.update_customer_loyalty_points()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.crm_customers
    SET 
        loyalty_points = loyalty_points + NEW.points_change,
        total_points_earned = total_points_earned + (CASE WHEN NEW.points_change > 0 THEN NEW.points_change ELSE 0 END),
        updated_at = NOW()
    WHERE id = NEW.customer_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_loyalty_points
AFTER INSERT ON public.loyalty_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_customer_loyalty_points();
