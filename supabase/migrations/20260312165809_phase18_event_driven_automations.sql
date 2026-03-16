-- Phase 18: Event-Driven Email Automations

-- Ensure pg_net is available
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 1. Function to dispatch to the Edge Function
CREATE OR REPLACE FUNCTION public.trigger_email_dispatcher()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    -- URL pointing to Edge Function (runs locally via docker dns, must be updated in prod or bound dynamically if using vault)
    url := 'https://amrqoakoyknuozwlftuf.supabase.co/functions/v1/email-dispatcher', 
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.jwt.env', true) || '"}'::jsonb,
    body := json_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'record', row_to_json(NEW),
      'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE null END
    )::jsonb
  );
  RETURN NEW;
END;
$$;

-- 2. Trigger: POS Receipt
DROP TRIGGER IF EXISTS send_receipt_webhook ON public.transactions;
CREATE TRIGGER send_receipt_webhook
  AFTER UPDATE OF status ON public.transactions
  FOR EACH ROW
  WHEN (OLD.status != 'completed' AND NEW.status = 'completed' AND NEW.customer_id IS NOT NULL)
  EXECUTE FUNCTION public.trigger_email_dispatcher();

-- 3. Trigger: CRM Welcome
DROP TRIGGER IF EXISTS send_welcome_webhook ON public.crm_customers;
CREATE TRIGGER send_welcome_webhook
  AFTER INSERT ON public.crm_customers
  FOR EACH ROW
  WHEN (NEW.email IS NOT NULL)
  EXECUTE FUNCTION public.trigger_email_dispatcher();
