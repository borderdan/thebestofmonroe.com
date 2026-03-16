-- Phase 34: Super-Admin Platform Command Center
-- Aggregates global metrics and platform-wide configurations

-- 1. Extend Businesses with Platform Controls
ALTER TABLE public.businesses
    ADD COLUMN IF NOT EXISTS admin_notes TEXT,
    ADD COLUMN IF NOT EXISTS beta_features JSONB DEFAULT '[]'::jsonb;

-- 2. View for Platform Summary Metrics
-- Provides global counts for the owner dashboard
CREATE OR REPLACE VIEW public.platform_summary_stats AS
SELECT
    (SELECT count(*) FROM public.businesses) as total_tenants,
    (SELECT count(*) FROM public.crm_customers) as total_customers,
    (SELECT count(*) FROM public.transactions WHERE status = 'completed') as total_transactions,
    (SELECT sum(total * exchange_rate_at_time) FROM public.transactions WHERE status = 'completed') as total_platform_revenue_mxn,
    (SELECT count(*) FROM public.users WHERE role = 'owner') as total_owners;

-- 3. Monthly Platform Revenue View (for MRR charts)
CREATE OR REPLACE VIEW public.platform_monthly_revenue AS
SELECT
    date_trunc('month', created_at) as month,
    sum(total * exchange_rate_at_time) as revenue
FROM public.transactions
WHERE status = 'completed'
GROUP BY 1
ORDER BY 1 DESC;

-- 4. RLS for Super-Admins
-- Ensure only superadmins can access these views if queried via client
-- (Though we'll primary use Server Components)
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Policy: Superadmins can see everything
CREATE POLICY "Superadmins can view all businesses" ON public.businesses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_superadmin = true
        )
    );

-- 5. Helper Function for Admin Impersonation
-- Returns the business context for any business (Admin only)
CREATE OR REPLACE FUNCTION public.admin_get_business_context(target_business_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- Check if caller is superadmin
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_superadmin = true) THEN
        RAISE EXCEPTION 'Unauthorized: Super-Admin only';
    END IF;

    SELECT to_jsonb(b.*) INTO result FROM public.businesses b WHERE id = target_business_id;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
