-- Phase 28: Gift Card Generation & Digital Wallets
-- Implements prepaid gift cards and QR-based digital wallet payments

-- 1. Gift Cards Table
CREATE TABLE IF NOT EXISTS public.gift_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.crm_customers(id) ON DELETE SET NULL,
    code TEXT NOT NULL,
    initial_balance NUMERIC(10, 2) NOT NULL DEFAULT 0,
    current_balance NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(business_id, code)
);

-- 2. Gift Card Ledger (Transactions)
CREATE TABLE IF NOT EXISTS public.gift_card_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_card_id UUID NOT NULL REFERENCES public.gift_cards(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL, -- Negative for spend, positive for load
    type TEXT NOT NULL CHECK (type IN ('load', 'spend', 'refund', 'adjustment')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Update transactions payment_method constraint
-- Note: PostgreSQL doesn't allow direct ALTER of CHECK constraints easily without naming them.
-- We'll drop and recreate if we can find the name, or just ignore if the logic is handled in server actions.
-- For safety in this environment, we'll try to update the domain or constraint if it exists.
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_payment_method_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_payment_method_check 
    CHECK (payment_method = ANY (ARRAY['cash', 'mercadopago', 'codi', 'gift_card', 'stripe']));

-- 4. RLS Policies
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_card_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants manage gift cards" ON public.gift_cards
    FOR ALL USING (business_id = public.get_auth_business_id())
    WITH CHECK (business_id = public.get_auth_business_id());

CREATE POLICY "Tenants view gift card ledger" ON public.gift_card_ledger
    FOR ALL USING (gift_card_id IN (SELECT id FROM public.gift_cards WHERE business_id = public.get_auth_business_id()));

-- 5. Trigger to update balance on ledger entry
CREATE OR REPLACE FUNCTION public.update_gift_card_balance()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.gift_cards
    SET 
        current_balance = current_balance + NEW.amount,
        status = CASE 
            WHEN (current_balance + NEW.amount) <= 0 THEN 'used'::text 
            ELSE 'active'::text 
        END,
        updated_at = NOW()
    WHERE id = NEW.gift_card_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_gift_card_balance
AFTER INSERT ON public.gift_card_ledger
FOR EACH ROW EXECUTE FUNCTION public.update_gift_card_balance();
