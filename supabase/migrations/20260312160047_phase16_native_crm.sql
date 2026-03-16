-- Phase 16: Native CRM

-- 1. Create CRM Customers Table
CREATE TABLE public.crm_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'active', 'inactive')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create CRM Notes Table
CREATE TABLE public.crm_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.crm_customers(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Indexes
CREATE INDEX idx_crm_customers_business ON public.crm_customers(business_id, status);
CREATE INDEX idx_crm_notes_customer ON public.crm_notes(customer_id);

-- 4. Enable RLS
ALTER TABLE public.crm_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_notes ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Customers Policies
CREATE POLICY "Tenant CRUD Own Customers" ON public.crm_customers
    FOR ALL USING (business_id = public.get_auth_business_id());

-- Notes Policies
CREATE POLICY "Tenant CRUD Own Notes" ON public.crm_notes
    FOR ALL USING (business_id = public.get_auth_business_id());
