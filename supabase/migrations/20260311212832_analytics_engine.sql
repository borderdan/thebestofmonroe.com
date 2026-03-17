-- Phase 15: Telemetry & Analytics

CREATE TABLE IF NOT EXISTS public.analytics_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
    event_type text NOT NULL CHECK (event_type IN ('profile_view', 'link_click', 'nfc_tap')),
    entity_id uuid, -- Optional: ID of the specific link or form clicked
    session_id text, -- To track unique visitors without relying on auth
    created_at timestamptz DEFAULT now()
);

-- Index for high-performance ranking aggregation
CREATE INDEX IF NOT EXISTS idx_analytics_business_event ON public.analytics_events(business_id, event_type);

-- Materialized view or secure function for quick ranking aggregation
CREATE OR REPLACE FUNCTION get_directory_rankings()
RETURNS TABLE (business_id uuid, total_score bigint) 
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT 
    business_id,
    COUNT(id) as total_score
  FROM public.analytics_events
  GROUP BY business_id
  ORDER BY total_score DESC;
$$;

-- RLS Enforcement
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policy
CREATE POLICY "Tenant Isolation for analytics_events" ON public.analytics_events FOR ALL USING (business_id = auth.business_id() OR auth.is_superadmin()) WITH CHECK (business_id = auth.business_id() OR auth.is_superadmin());

