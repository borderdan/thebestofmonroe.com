-- Phase 19: Enterprise Readiness

-- 1. Extend existing 'users' table for POS PIN Authentication
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS pin_hash TEXT;

-- 2. Link CRM Customers to Auth identities for the Customer Portal
ALTER TABLE public.crm_customers
    ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL UNIQUE;

CREATE INDEX IF NOT EXISTS idx_crm_auth_user ON public.crm_customers(auth_user_id);

-- 3. Customer Portal RLS Policies
-- Allow auth users to view their own CRM profile
CREATE POLICY "Customer Portal CRM Read" ON public.crm_customers
    FOR SELECT USING (auth_user_id = auth.uid());

-- Allow auth users to view their own transactions linked to their CRM profile
CREATE POLICY "Customer Portal Transactions Read" ON public.transactions
    FOR SELECT USING (customer_id IN (SELECT id FROM public.crm_customers WHERE auth_user_id = auth.uid()));