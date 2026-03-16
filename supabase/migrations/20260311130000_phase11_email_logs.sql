-- Phase 11: Transactional Email Ledger

CREATE TABLE IF NOT EXISTS public.email_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
    recipient_email text NOT NULL,
    subject text NOT NULL,
    template_name text NOT NULL,
    delivery_status text NOT NULL CHECK (delivery_status IN ('sent', 'failed', 'bounced')),
    error_message text,
    created_at timestamptz DEFAULT now()
);

-- RLS: Super Admins can view all, Tenants can view their own logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant View Own Emails" ON public.email_logs 
    FOR SELECT USING (business_id = public.get_auth_business_id() OR public.is_superadmin());
