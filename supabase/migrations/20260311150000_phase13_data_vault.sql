CREATE TABLE IF NOT EXISTS public.vault_submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    form_id text NOT NULL,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    status text DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived')),
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vault_submissions_payload ON public.vault_submissions USING gin (payload);

ALTER TABLE public.vault_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant View Own Vault" ON public.vault_submissions 
    FOR SELECT USING (business_id = public.get_auth_business_id() OR public.is_superadmin());

CREATE POLICY "Tenant Update Own Vault" ON public.vault_submissions 
    FOR UPDATE USING (business_id = public.get_auth_business_id() OR public.is_superadmin());
