-- ============================================================
-- DATA PIPELINE MONITORING
-- Tracks all platform-level data ingestion sources.
-- ============================================================

-- 1. DATA SOURCES TABLE
CREATE TABLE IF NOT EXISTS public.data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'API', 'SCRAPER', 'BOT'
    category TEXT NOT NULL, -- 'TRAFFIC', 'WEATHER', 'AVIATION', 'JOBS', 'EVENTS', 'ALERTS', 'POIS', 'GROCERY', 'PERMITS'
    status TEXT NOT NULL DEFAULT 'OPERATIONAL', -- 'OPERATIONAL', 'ERROR', 'MAINTENANCE', 'DEPRECATED'
    last_sync_at TIMESTAMPTZ,
    next_sync_at TIMESTAMPTZ,
    success_rate FLOAT DEFAULT 1.0, -- 0.0 to 1.0
    latency_ms INTEGER DEFAULT 0,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. INDEXES
CREATE INDEX IF NOT EXISTS idx_data_sources_status ON public.data_sources(status);
CREATE INDEX IF NOT EXISTS idx_data_sources_category ON public.data_sources(category);

-- 3. RLS POLICIES (Super-admin only for management, public/auth can't see usually but let's make it super-admin restricted)
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super-admins can view data sources" ON public.data_sources;
CREATE POLICY "Super-admins can view data sources" ON public.data_sources 
    FOR SELECT USING (auth.jwt() ->> 'is_superadmin' = 'true' OR (SELECT is_superadmin FROM public.users WHERE id = auth.uid()));

-- 4. SEED DATA
INSERT INTO public.data_sources (name, type, category, description, last_sync_at, next_sync_at, status, latency_ms, success_rate)
VALUES 
('NCDOT Traffic API', 'API', 'TRAFFIC', 'Real-time traffic incidents and construction data from DriveNC.', now() - interval '5 minutes', now() + interval '10 minutes', 'OPERATIONAL', 124, 0.99),
('NWS Weather Alerts', 'API', 'WEATHER', 'National Weather Service alerts for Union County (Zone NCC179).', now() - interval '2 minutes', now() + interval '13 minutes', 'OPERATIONAL', 88, 1.0),
('Monroe Airport METAR', 'API', 'AVIATION', 'Aviation weather reports for Charlotte-Monroe Executive Airport (KEQY).', now() - interval '15 minutes', now() + interval '45 minutes', 'OPERATIONAL', 210, 0.98),
('Indeed Job Scraper', 'SCRAPER', 'JOBS', 'Automated retrieval of local job listings in Monroe area.', now() - interval '4 hours', now() + interval '20 hours', 'OPERATIONAL', 1540, 0.95),
('City Event Calendar', 'SCRAPER', 'EVENTS', 'Scraping City of Monroe official event calendar.', now() - interval '12 hours', now() + interval '12 hours', 'OPERATIONAL', 3200, 1.0),
('Union County Permits', 'SCRAPER', 'PERMITS', 'Browser bot retrieval of building permit filings.', now() - interval '1 day', now() + interval '1 day', 'MAINTENANCE', 0, 0.85),
('Harris Teeter Grocery', 'BOT', 'GROCERY', 'Headless browser retrieval of local grocery prices and stock.', now() - interval '6 hours', now() + interval '18 hours', 'ERROR', 12400, 0.45);
