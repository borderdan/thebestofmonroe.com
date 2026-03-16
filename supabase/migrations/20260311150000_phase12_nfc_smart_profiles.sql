-- Phase 12: NFC Keyrings & Smart Profiles

CREATE TABLE IF NOT EXISTS public.nfc_tags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    guid text UNIQUE NOT NULL, -- The hardware ID encoded on the NFC chip
    claim_pin text NOT NULL, -- 6-digit factory PIN for claiming
    business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
    status text DEFAULT 'unclaimed' CHECK (status IN ('unclaimed', 'active', 'inactive')),
    target_type text DEFAULT 'smart_profile' CHECK (target_type IN ('smart_profile', 'custom_url', 'pos_menu')),
    target_url text, -- Used if target_type is 'custom_url'
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.nfc_tags ENABLE ROW LEVEL SECURITY;

-- Public can read active tags for routing
CREATE POLICY "Public Route NFC Tags" ON public.nfc_tags 
    FOR SELECT USING (status = 'active');

-- Tenants can manage their claimed tags
CREATE POLICY "Tenant Manage Own Tags" ON public.nfc_tags 
    FOR ALL USING (business_id = public.get_auth_business_id());

-- Create index for faster guid lookups
CREATE INDEX idx_nfc_tags_guid ON public.nfc_tags(guid);
