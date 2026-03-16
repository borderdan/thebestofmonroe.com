-- Phase 10: Subscriptions, Stripe Mapping & Super Admin

-- 1. Create Plans Catalog
CREATE TABLE IF NOT EXISTS public.plans (
    id text PRIMARY KEY, -- e.g., 'basic', 'pro', 'enterprise'
    name text NOT NULL,
    price numeric(10,2) NOT NULL,
    currency text DEFAULT 'MXN',
    features jsonb DEFAULT '{}'::jsonb -- e.g., {"invoicing": true, "max_users": 5}
);

-- 2. Stripe Customer Mapping
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE;

-- 3. Create Tenant Subscriptions
CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL UNIQUE,
    plan_id text REFERENCES public.plans(id) NOT NULL,
    status text NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
    external_subscription_id text UNIQUE,
    current_period_end timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3.5 Ensure auth.is_superadmin() exists for policies
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_superadmin FROM public.users WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 4. RLS Policies
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public View Plans" ON public.plans FOR SELECT USING (true);

ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant View Own Subscription" ON public.tenant_subscriptions 
    FOR SELECT USING (business_id = public.get_auth_business_id() OR public.is_superadmin());

-- 5. ATOMIC FEATURE SYNC TRIGGER
-- Automatically syncs `plans.features` to `modules.config` when a subscription updates.
CREATE OR REPLACE FUNCTION public.sync_subscription_features()
RETURNS TRIGGER AS $$
DECLARE
    plan_features JSONB;
BEGIN
    -- Only apply features if the subscription is active
    IF NEW.status = 'active' THEN
        SELECT features INTO plan_features FROM public.plans WHERE id = NEW.plan_id;
        
        -- Merge the plan features into the existing modules config
        UPDATE public.modules 
        SET config = config || plan_features
        WHERE business_id = NEW.business_id;
    ELSIF NEW.status = 'canceled' OR NEW.status = 'past_due' THEN
        -- Revert to default features (or a defined fallback state)
        UPDATE public.modules 
        SET config = '{"pos": false, "crm": false, "eforms": false, "keyrings": true, "directory": true, "themes": true, "automations": false}'::jsonb
        WHERE business_id = NEW.business_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_subscription_status_change
    AFTER INSERT OR UPDATE OF status, plan_id ON public.tenant_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.sync_subscription_features();
