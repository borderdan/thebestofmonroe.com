-- ============================================================
-- COUNCIL MEETINGS: YouTube ingestion, transcription, summaries
-- ============================================================

CREATE TABLE IF NOT EXISTS public.council_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    youtube_video_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    published_at TIMESTAMPTZ NOT NULL,
    youtube_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_seconds INT,
    transcript TEXT,
    summary JSONB,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_council_meetings_status ON public.council_meetings(status);
CREATE INDEX IF NOT EXISTS idx_council_meetings_published ON public.council_meetings(published_at DESC);

-- RLS
ALTER TABLE public.council_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view completed council meetings"
    ON public.council_meetings FOR SELECT
    USING (status = 'completed');

CREATE POLICY "Service role manages council meetings"
    ON public.council_meetings FOR ALL
    USING (auth.role() = 'service_role');
