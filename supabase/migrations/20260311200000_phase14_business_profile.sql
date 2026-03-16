ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS landing_page_theme TEXT DEFAULT 'default',
ADD COLUMN IF NOT EXISTS contact JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS location JSONB DEFAULT '{}'::jsonb;
