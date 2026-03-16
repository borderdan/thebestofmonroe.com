-- File: supabase/migrations/20260311140000_auth_webhook.sql
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.trigger_welcome_email_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    -- Replace 'https://your-production-domain.com' with your actual production Next.js app URL or Ngrok tunnel for local testing
    url := 'https://your-production-domain.com/api/webhooks/auth',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ea171f94bff28f27b59b093cea009b00a5fe585f71721ef63c922ce38fe1e22d"}'::jsonb,
    body := json_build_object(
      'type', TG_OP,
      'record', row_to_json(NEW)
    )::jsonb
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_business_created_send_email ON public.businesses;
CREATE TRIGGER on_business_created_send_email
  AFTER INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_welcome_email_webhook();