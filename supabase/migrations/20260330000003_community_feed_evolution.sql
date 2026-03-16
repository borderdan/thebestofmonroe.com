-- ============================================================
-- PHASE 2: COMMUNITY FEED EVOLUTION
-- Refines the feed for severity, hashing, and logging.
-- ============================================================

-- 1. RENAME AND REFINE FEED TABLE
ALTER TABLE IF EXISTS public.community_updates RENAME TO community_feed;

ALTER TABLE public.community_feed 
ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'med', 'high', 'critical')),
ADD COLUMN IF NOT EXISTS payload_hash TEXT,
ADD COLUMN IF NOT EXISTS location_name TEXT;

-- Index for severity filtering
CREATE INDEX IF NOT EXISTS idx_community_feed_severity ON public.community_feed(severity);

-- 2. INGESTION LOGS (Dead Letter Queue / Monitoring)
CREATE TABLE IF NOT EXISTS public.ingestion_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_name TEXT NOT NULL,
    status TEXT NOT NULL, -- 'success', 'failure', 'partial'
    message TEXT,
    error_details JSONB,
    items_processed INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. NOTIFICATIONS SYSTEM (Polymorphic)
CREATE TABLE IF NOT EXISTS public.community_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    feed_item_id UUID REFERENCES public.community_feed(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    channel TEXT NOT NULL, -- 'web', 'email', 'sms'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RLS FOR NEW TABLES
ALTER TABLE public.ingestion_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages logs" ON public.ingestion_logs 
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users view own notifications" ON public.community_notifications 
    FOR SELECT USING (auth.uid() = user_id);
