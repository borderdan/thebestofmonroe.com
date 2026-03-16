-- ============================================================
-- 1. BUSINESSES
-- ============================================================
CREATE TABLE businesses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       TEXT UNIQUE NOT NULL,        
  name       TEXT NOT NULL,
  city       TEXT NOT NULL,
  category   TEXT DEFAULT 'Other',
  logo_url   TEXT,
  cover_url  TEXT,
  is_visible BOOLEAN DEFAULT true,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. USERS
-- ============================================================
CREATE TABLE users (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id    UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  role           TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
  full_name      TEXT,
  is_superadmin  BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. MODULES
-- ============================================================
CREATE TABLE modules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID UNIQUE NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  config      JSONB NOT NULL DEFAULT '{
    "pos": false,
    "crm": false,
    "eforms": false,
    "keyrings": true,
    "directory": true,
    "themes": true,
    "automations": false
  }'::jsonb,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. ENTITIES
-- ============================================================
CREATE TABLE entities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  data        JSONB NOT NULL DEFAULT '{}',
  sort_order  INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_entities_business_type ON entities(business_id, type);

-- ============================================================
-- 5. TRANSACTIONS
-- ============================================================
CREATE TABLE transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  total         NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency      TEXT DEFAULT 'MXN',
  status        TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. ANALYTICS
-- ============================================================
CREATE TABLE analytics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id   UUID NOT NULL,
  event       TEXT DEFAULT 'click',
  count       INT DEFAULT 0,
  last_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entity_type, entity_id, event)
);

-- ============================================================
-- 7. ACTIVITY LOG
-- ============================================================
CREATE TABLE activity_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_activity_log_business ON activity_log(business_id, created_at DESC);
CREATE INDEX idx_activity_log_action ON activity_log(action, created_at DESC);

-- ============================================================
-- ENABLE RLS
-- ============================================================
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION auth.business_id()
RETURNS UUID AS $$
  SELECT business_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth.is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_superadmin FROM public.users WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- RLS POLICIES
-- ============================================================
CREATE POLICY "Users can view their own business" ON businesses FOR SELECT USING (id = auth.business_id() OR auth.is_superadmin());
CREATE POLICY "Public businesses are visible" ON businesses FOR SELECT USING (is_visible = true);
CREATE POLICY "Super-admins can manage all businesses" ON businesses FOR ALL USING (auth.is_superadmin()) WITH CHECK (auth.is_superadmin());

CREATE POLICY "Users can view team members" ON users FOR SELECT USING (business_id = auth.business_id() OR auth.is_superadmin());

CREATE POLICY "Business entities access" ON entities FOR ALL USING (business_id = auth.business_id() OR auth.is_superadmin()) WITH CHECK (business_id = auth.business_id() OR auth.is_superadmin());
CREATE POLICY "Business modules access" ON modules FOR ALL USING (business_id = auth.business_id() OR auth.is_superadmin()) WITH CHECK (business_id = auth.business_id() OR auth.is_superadmin());
CREATE POLICY "Business transactions access" ON transactions FOR ALL USING (business_id = auth.business_id() OR auth.is_superadmin()) WITH CHECK (business_id = auth.business_id() OR auth.is_superadmin());
CREATE POLICY "Business analytics access" ON analytics FOR ALL USING (business_id = auth.business_id() OR auth.is_superadmin()) WITH CHECK (business_id = auth.business_id() OR auth.is_superadmin());
CREATE POLICY "Business activity log access" ON activity_log FOR ALL USING (business_id = auth.business_id() OR auth.is_superadmin()) WITH CHECK (business_id = auth.business_id() OR auth.is_superadmin());

-- ============================================================
-- AUTH TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _business_id UUID;
  _business_name TEXT;
  _business_slug TEXT;
  _business_city TEXT;
BEGIN
  _business_id := (NEW.raw_user_meta_data->>'business_id')::uuid;

  IF _business_id IS NULL THEN
    _business_name := COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business');
    _business_city := COALESCE(NEW.raw_user_meta_data->>'city', 'Unknown');
    _business_slug := LOWER(REGEXP_REPLACE(_business_name, '[^a-zA-Z0-9]', '-', 'g'))
                      || '-' || SUBSTR(gen_random_uuid()::text, 1, 8);

    INSERT INTO public.businesses (id, name, slug, city)
    VALUES (gen_random_uuid(), _business_name, _business_slug, _business_city)
    RETURNING id INTO _business_id;

    INSERT INTO public.modules (business_id) VALUES (_business_id);
  END IF;

  INSERT INTO public.users (id, business_id, role, full_name)
  VALUES (
    NEW.id,
    _business_id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'owner'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- STORAGE BUCKET (TENANT ASSETS)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('tenant-assets', 'tenant-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'tenant-assets');
CREATE POLICY "Authenticated upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tenant-assets' AND auth.role() = 'authenticated');
CREATE POLICY "Owner update/delete" ON storage.objects FOR UPDATE USING (bucket_id = 'tenant-assets' AND owner = auth.uid()) WITH CHECK (bucket_id = 'tenant-assets' AND owner = auth.uid());
CREATE POLICY "Owner delete" ON storage.objects FOR DELETE USING (bucket_id = 'tenant-assets' AND owner = auth.uid());
