-- Phase 8: Financials & CFDI 4.0 Prep Migration

-- 1. Add CHECK constraint to existing payment_method column
ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_payment_method_check
  CHECK (payment_method IN ('cash', 'mercadopago', 'codi'));

ALTER TABLE public.transactions
  ALTER COLUMN payment_method SET DEFAULT 'cash';

-- 2. Add tracking columns for external gateways
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS external_payment_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'completed'
    CHECK (payment_status IN ('pending', 'approved', 'rejected', 'completed', 'refunded', 'in_process'));

-- 3. Wrapper function for RLS compatibility
CREATE OR REPLACE FUNCTION public.get_auth_business_id()
RETURNS UUID AS $$
  SELECT business_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 4. Create CFDI 4.0 Invoice Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    transaction_id uuid REFERENCES public.transactions(id) ON DELETE RESTRICT NOT NULL UNIQUE,
    rfc_receptor text NOT NULL,
    uso_cfdi text NOT NULL,
    regimen_fiscal text NOT NULL,
    cfdi_status text DEFAULT 'unissued' CHECK (cfdi_status IN ('unissued', 'processing', 'issued', 'canceled')),
    uuid_sat text UNIQUE,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant CRUD Invoices" ON public.invoices 
    FOR ALL USING (business_id = public.get_auth_business_id());
