-- Phase 30: Advanced User Permissions & Audit Logs
-- Implements granular RBAC and specialized audit logging for sensitive actions

-- 1. Extend Users with granular permissions (JSONB for maximum flexibility)
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{
        "can_refund": false,
        "can_edit_prices": false,
        "can_view_reports": false,
        "can_manage_team": false,
        "can_manage_inventory": true
    }'::jsonb;

-- 2. Initialize default permissions for existing roles
-- Owners get everything
UPDATE public.users 
SET permissions = '{
    "can_refund": true, 
    "can_edit_prices": true, 
    "can_view_reports": true, 
    "can_manage_team": true, 
    "can_manage_inventory": true
}'::jsonb
WHERE role = 'owner';

-- Managers get everything except team management (by default)
UPDATE public.users 
SET permissions = '{
    "can_refund": true, 
    "can_edit_prices": true, 
    "can_view_reports": true, 
    "can_manage_team": false, 
    "can_manage_inventory": true
}'::jsonb
WHERE role = 'manager' AND permissions->>'can_refund' IS NULL;

-- 3. Enhance Activity Log for Audit purposes
-- Adding IP and User Agent columns if not present (useful for security audits)
ALTER TABLE public.activity_log
    ADD COLUMN IF NOT EXISTS ip_address TEXT,
    ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- 4. Create a helper function to check permissions in SQL/RLS
CREATE OR REPLACE FUNCTION public.has_permission(required_perm TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_perms JSONB;
BEGIN
    SELECT permissions INTO user_perms FROM public.users WHERE id = auth.uid();
    RETURN COALESCE((user_perms->>required_perm)::boolean, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
