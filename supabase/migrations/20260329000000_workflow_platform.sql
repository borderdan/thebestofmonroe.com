-- ============================================================
-- Phase 29: Hybrid Workflow Platform
-- Adds customer-facing visual workflows, execution logging,
-- and generic pg_net event dispatch.
-- ============================================================

-- Ensure pg_net is available
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ============================================================
-- 1. CUSTOMER WORKFLOWS TABLE
-- Stores compiled DAG output from the React Flow builder.
-- canvas_state preserves the visual layout for re-editing.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Workflow',
  description TEXT,
  trigger_event TEXT NOT NULL CHECK (trigger_event IN (
    'pos_sale_completed',
    'eform_submission',
    'crm_customer_new',
    'inventory_low',
    'invoice_issued'
  )),
  conditions JSONB DEFAULT '[]'::jsonb,
  actions JSONB DEFAULT '[]'::jsonb,
  canvas_state JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_workflows_business_trigger ON public.workflows(business_id, trigger_event);
CREATE INDEX idx_workflows_active ON public.workflows(business_id) WHERE is_active = true;

ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants manage own workflows" ON public.workflows
  FOR ALL USING (business_id = public.get_auth_business_id())
  WITH CHECK (business_id = public.get_auth_business_id());

-- ============================================================
-- 2. WORKFLOW EXECUTION LOGS
-- Every triggered workflow produces an execution record.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workflow_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  trigger_event TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','success','failed')),
  record_id UUID,
  input_payload JSONB,
  output_payload JSONB,
  error_message TEXT,
  duration_ms INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_execution_logs_workflow ON public.workflow_execution_logs(workflow_id);
CREATE INDEX idx_execution_logs_business ON public.workflow_execution_logs(business_id);

ALTER TABLE public.workflow_execution_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants see own execution logs" ON public.workflow_execution_logs
  FOR ALL USING (business_id = public.get_auth_business_id())
  WITH CHECK (business_id = public.get_auth_business_id());

-- ============================================================
-- 3. EXTEND EFORMS TABLE
-- Add workflow linkage and form customization columns.
-- ============================================================
ALTER TABLE public.eforms
  ADD COLUMN IF NOT EXISTS linked_workflow_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS submit_button_label TEXT DEFAULT 'Submit',
  ADD COLUMN IF NOT EXISTS success_message TEXT DEFAULT 'Thank you! Your submission has been received.',
  ADD COLUMN IF NOT EXISTS redirect_url TEXT;

-- ============================================================
-- 4. EXTEND AUTOMATION_CONFIGS
-- Add name/description for better UX while running in parallel.
-- ============================================================
ALTER TABLE public.automation_configs
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS source_form_id UUID REFERENCES public.eforms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_triggered_at TIMESTAMPTZ;

-- ============================================================
-- 5. GENERIC EVENT DISPATCHER
-- Replaces hardcoded n8n webhook trigger with a configurable
-- dispatch function that sends events to the evaluator API.
-- Uses app.settings for URL/secret configuration.
-- ============================================================
DROP TRIGGER IF EXISTS on_eform_submission ON public.vault_submissions;
DROP FUNCTION IF EXISTS public.notify_n8n_on_submission();

CREATE OR REPLACE FUNCTION public.dispatch_workflow_event()
RETURNS TRIGGER AS $$
DECLARE
  evaluator_url TEXT;
  wh_secret TEXT;
BEGIN
  evaluator_url := current_setting('app.settings.evaluator_url', true);
  wh_secret := current_setting('app.settings.webhook_secret', true);

  -- Skip if evaluator_url is not configured
  IF evaluator_url IS NULL OR evaluator_url = '' THEN
    RAISE WARNING 'dispatch_workflow_event: app.settings.evaluator_url not configured, skipping';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := evaluator_url,
    headers := json_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', COALESCE(wh_secret, '')
    )::jsonb,
    body := json_build_object(
      'trigger_event', TG_ARGV[0],
      'business_id', NEW.business_id,
      'record', row_to_json(NEW)
    )::jsonb
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. EVENT TRIGGERS
-- Wire up key business events to the generic dispatcher.
-- ============================================================

-- POS Sale Completed
DROP TRIGGER IF EXISTS wf_on_pos_sale ON public.transactions;
CREATE TRIGGER wf_on_pos_sale
  AFTER UPDATE OF status ON public.transactions
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM 'completed' AND NEW.status = 'completed')
  EXECUTE FUNCTION public.dispatch_workflow_event('pos_sale_completed');

-- E-Form Submission
DROP TRIGGER IF EXISTS wf_on_vault_submission ON public.vault_submissions;
CREATE TRIGGER wf_on_vault_submission
  AFTER INSERT ON public.vault_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.dispatch_workflow_event('eform_submission');

-- New CRM Customer
DROP TRIGGER IF EXISTS wf_on_new_crm_customer ON public.crm_customers;
CREATE TRIGGER wf_on_new_crm_customer
  AFTER INSERT ON public.crm_customers
  FOR EACH ROW
  EXECUTE FUNCTION public.dispatch_workflow_event('crm_customer_new');

-- Invoice Issued
DROP TRIGGER IF EXISTS wf_on_invoice_issued ON public.invoices;
CREATE TRIGGER wf_on_invoice_issued
  AFTER UPDATE OF cfdi_status ON public.invoices
  FOR EACH ROW
  WHEN (NEW.cfdi_status = 'issued')
  EXECUTE FUNCTION public.dispatch_workflow_event('invoice_issued');

-- ============================================================
-- 7. UPDATE MODULES CONFIG DEFAULT
-- Add 'workflows' module flag.
-- ============================================================
-- (Existing modules default includes "automations": false)
-- We leave existing configs unchanged; new businesses get both.
