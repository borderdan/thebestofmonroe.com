-- Phase 23: Automated Performance Reports & PDF Generation
-- Supporting schema for automated weekly executive summaries

-- 1. Create Report Configs table to manage merchant preferences
CREATE TABLE IF NOT EXISTS public.report_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID UNIQUE NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    recipient_email TEXT, -- Override email if different from business owner
    report_frequency TEXT DEFAULT 'weekly', -- 'weekly', 'monthly'
    last_report_sent TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can manage their own report configs" ON public.report_configs
    FOR ALL USING (business_id = public.get_auth_business_id())
    WITH CHECK (business_id = public.get_auth_business_id());

-- 2. Add 'processed_by_automation' to transactions for sync verification
ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS processed_by_automation BOOLEAN DEFAULT false;

-- 3. Index for report aggregation performance
CREATE INDEX IF NOT EXISTS idx_transactions_created_status 
    ON public.transactions(created_at, status) 
    WHERE status = 'completed';
