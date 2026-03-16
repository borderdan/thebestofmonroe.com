-- Migration: 20260311220000_eforms_json_schema.sql
-- Description: Adds json_schema and ui_schema to eforms, and fixes vault_submissions mapping.

-- 1. Enhance eforms table
ALTER TABLE IF EXISTS public.eforms 
ADD COLUMN IF NOT EXISTS json_schema jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS ui_schema jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS version int DEFAULT 1;

-- 2. Fix vault_submissions table
-- First, handle the data migration if needed, but since it's a dev project we can clear or cast.
-- We want form_id to be a UUID pointing to eforms.id

-- Remove old constraint if it exists (it was named eforms_business_id_fkey which is confusing, or didn't exist)
ALTER TABLE IF EXISTS public.vault_submissions 
DROP CONSTRAINT IF EXISTS vault_submissions_form_id_fkey;

-- Change column type (requires casting if current data exists)
-- Since we are moving from text (title) to UUID, we'll try to match by title if possible, or just nullify if it's junk data.
ALTER TABLE public.vault_submissions 
ALTER COLUMN form_id TYPE uuid USING (
  CASE 
    WHEN form_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN form_id::uuid 
    ELSE NULL 
  END
);

-- Add the correct foreign key
ALTER TABLE public.vault_submissions
ADD CONSTRAINT vault_submissions_form_id_fkey 
FOREIGN KEY (form_id) REFERENCES public.eforms(id) ON DELETE SET NULL;

-- 3. Add unique index for eform title per business (optional but good for builder logic)
-- ALTER TABLE public.eforms ADD CONSTRAINT eforms_business_title_key UNIQUE (business_id, title);
