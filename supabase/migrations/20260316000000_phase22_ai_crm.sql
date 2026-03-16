-- Phase 22: AI-Powered Lead Scoring & CRM Enrichment Logic
-- Extends CRM schema with AI-generated insights and processing status

-- 1. Extend Businesses with a description for AI context
ALTER TABLE public.businesses
    ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Extend CRM customers with AI insight storage
ALTER TABLE public.crm_customers
    ADD COLUMN IF NOT EXISTS ai_summary TEXT,
    ADD COLUMN IF NOT EXISTS lead_score INT CHECK (lead_score >= 0 AND lead_score <= 10),
    ADD COLUMN IF NOT EXISTS intent_category TEXT;

-- 3. Index for filtering high-value leads in the CRM dashboard
CREATE INDEX IF NOT EXISTS idx_crm_lead_score ON public.crm_customers(lead_score DESC);

-- 4. Add AI processing status to vault_submissions to prevent duplicate scoring
-- Note: 'vault_submissions' is used for E-Form data in this environment
ALTER TABLE public.vault_submissions
    ADD COLUMN IF NOT EXISTS ai_processed BOOLEAN DEFAULT false;
