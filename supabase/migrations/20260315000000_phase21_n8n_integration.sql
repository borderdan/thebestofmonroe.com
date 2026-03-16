-- Phase 21: n8n Automation Integration
-- Implementation of multi-tenant workflows and automation triggers

-- 1. Automation Configurations
-- Store tenant-specific n8n configurations
CREATE TABLE IF NOT EXISTS public.automation_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    workflow_id TEXT, -- n8n workflow ID
    trigger_type TEXT NOT NULL, -- e.g., 'eform_submission', 'pos_sale'
    is_active BOOLEAN DEFAULT true,
    webhook_url TEXT, -- The n8n production webhook URL
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.automation_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants manage their own automations" ON public.automation_configs
    FOR ALL USING (business_id = public.get_auth_business_id())
    WITH CHECK (business_id = public.get_auth_business_id());

-- 2. Webhook Triggers
-- Note: Using public.vault_submissions as per existing schema research

-- Function to handle the trigger (generic helper if not already present)
-- In a real Supabase environment, supabase_functions.http_request is often pre-configured
-- or requires specific extensions. We'll assume the environment supports it as per directive.

CREATE OR REPLACE FUNCTION public.notify_n8n_on_submission()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://n8n.yourdomain.com/webhook/eform-trigger',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := json_build_object(
        'event', 'eform_submission',
        'business_id', NEW.business_id,
        'form_id', NEW.form_id,
        'payload', NEW.payload,
        'created_at', NEW.created_at
      )::jsonb
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to notify n8n of new E-Form submissions
DROP TRIGGER IF EXISTS on_eform_submission ON public.vault_submissions;
CREATE TRIGGER on_eform_submission
  AFTER INSERT ON public.vault_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_n8n_on_submission();

-- 3. Update modules config to include automations
-- This ensures the UI can check if the module should be visible
-- (Existing default config has "automations": false)
