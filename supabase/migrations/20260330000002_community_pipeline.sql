-- ============================================================
-- PHASE 1: COMMUNITY DATA PIPELINE INFRASTRUCTURE
-- Enables PostGIS and creates tables for polymorphic updates and POIs.
-- ============================================================

-- Enable PostGIS for spatial queries (radius filtering, bounding boxes)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. COMMUNITY UPDATES (Polymorphic feed for Traffic, Weather, Construction, etc.)
CREATE TABLE IF NOT EXISTS public.community_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id TEXT NOT NULL, -- e.g., 'ncdot-inc-1234', 'nws-alert-567'
    type TEXT NOT NULL, -- 'traffic', 'weather', 'permit', 'event', 'aviation'
    title TEXT NOT NULL,
    description TEXT,
    geometry GEOMETRY(Point, 4326), -- PostGIS point for spatial filtering
    event_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (source_id, type) -- Idempotency: prevent duplicates from same source
);

-- 2. POINTS OF INTEREST (Static locations: Parks, Libraries, Fire Stations)
CREATE TABLE IF NOT EXISTS public.pois (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'park', 'library', 'emergency', 'government'
    address TEXT,
    geometry GEOMETRY(Point, 4326),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_community_updates_type ON public.community_updates(type);
CREATE INDEX IF NOT EXISTS idx_community_updates_expires ON public.community_updates(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_community_updates_geom ON public.community_updates USING gist (geometry);
CREATE INDEX IF NOT EXISTS idx_pois_category ON public.pois(category);
CREATE INDEX IF NOT EXISTS idx_pois_geom ON public.pois USING gist (geometry);

-- 4. RLS POLICIES (Publicly readable)
ALTER TABLE public.community_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pois ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view community updates" ON public.community_updates;
CREATE POLICY "Public can view community updates" ON public.community_updates 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view POIs" ON public.pois;
CREATE POLICY "Public can view POIs" ON public.pois 
    FOR SELECT USING (true);

-- Superadmins/Service Role can manage data (handled by default if no policies restrict it, 
-- but explicit for safety if we add broad restrictive policies later)
CREATE POLICY "Service role can manage community updates" ON public.community_updates 
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage POIs" ON public.pois 
    FOR ALL USING (auth.role() = 'service_role');
