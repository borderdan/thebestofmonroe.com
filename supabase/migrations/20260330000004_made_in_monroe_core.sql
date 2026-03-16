-- ============================================================
-- PHASE 3: MADE IN MONROE - CORE ENTITY ENGINE & WALLET
-- Unifies businesses, permits, and commercial data into "Golden Records".
-- ============================================================

-- 1. CANONICAL ENTITIES (The "Golden Record")
CREATE TABLE IF NOT EXISTS public.canonical_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    legal_name TEXT,
    type TEXT NOT NULL CHECK (type IN ('business', 'parcel', 'venue', 'maker')),
    category TEXT,
    
    -- Address & Geospatial
    address TEXT,
    city TEXT DEFAULT 'Monroe',
    state TEXT DEFAULT 'NC',
    zip TEXT,
    geometry GEOMETRY(Point, 4326),
    
    -- Metadata Buffers
    official_data JSONB DEFAULT '{}'::jsonb, -- CityView, GIS, Secretary of State
    commercial_data JSONB DEFAULT '{}'::jsonb, -- Google, Yelp, Chamber
    social_links JSONB DEFAULT '{}'::jsonb,
    
    -- Vitality & Freshness
    vitality_score FLOAT DEFAULT 0.0,
    confidence_score FLOAT DEFAULT 0.5,
    last_verified_at TIMESTAMPTZ DEFAULT now(),
    source_labels TEXT[] DEFAULT '{}', -- ['cityview', 'google', 'chamber']
    
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for spatial alerts and vitality
CREATE INDEX IF NOT EXISTS idx_canonical_entities_geom ON public.canonical_entities USING gist (geometry);
CREATE INDEX IF NOT EXISTS idx_canonical_entities_vitality ON public.canonical_entities(vitality_score DESC);
CREATE INDEX IF NOT EXISTS idx_canonical_entities_type ON public.canonical_entities(type);

-- 2. GROCERY ARBITRAGE (The Wallet)
CREATE TABLE IF NOT EXISTS public.grocery_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_name TEXT NOT NULL, -- 'Aldi', 'Food Lion', 'Harris Teeter'
    store_location TEXT, -- 'Skyway Dr', 'Roosevelt Blvd'
    item_name TEXT NOT NULL, -- 'Milk', 'Eggs', 'Bread'
    category TEXT,
    price NUMERIC(10,2) NOT NULL,
    unit TEXT, -- 'gallon', 'dozen', 'loaf'
    is_deal BOOLEAN DEFAULT false,
    deal_description TEXT,
    scraped_at TIMESTAMPTZ DEFAULT now(),
    valid_until TIMESTAMPTZ,
    UNIQUE (store_name, store_location, item_name, scraped_at)
);

CREATE INDEX IF NOT EXISTS idx_grocery_prices_item ON public.grocery_prices(item_name, scraped_at DESC);

-- 3. VITALITY LOGS (Freshness Daemon)
CREATE TABLE IF NOT EXISTS public.vitality_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID REFERENCES public.canonical_entities(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'permit_issued', 'review_posted', 'deal_active'
    weight FLOAT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RLS POLICIES
ALTER TABLE public.canonical_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view canonical entities" ON public.canonical_entities FOR SELECT USING (is_visible = true);
CREATE POLICY "Public view grocery prices" ON public.grocery_prices FOR SELECT USING (true);

-- 5. FUNCTION TO UPDATE VITALITY SCORE
CREATE OR REPLACE FUNCTION public.update_entity_vitality()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.canonical_entities
    SET vitality_score = (
        SELECT COALESCE(SUM(weight), 0)
        FROM public.vitality_events
        WHERE entity_id = NEW.entity_id
        AND created_at > NOW() - INTERVAL '180 days'
    ),
    updated_at = NOW()
    WHERE id = NEW.entity_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_vitality_event_added
AFTER INSERT ON public.vitality_events
FOR EACH ROW EXECUTE FUNCTION public.update_entity_vitality();
