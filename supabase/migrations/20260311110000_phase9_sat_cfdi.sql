-- Phase 9: SAT CFDI 4.0 Configuration

-- 1. Add columns to businesses table
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS rfc text,
  ADD COLUMN IF NOT EXISTS regimen_fiscal text,
  ADD COLUMN IF NOT EXISTS csd_password text,
  ADD COLUMN IF NOT EXISTS facturama_api_user text,
  ADD COLUMN IF NOT EXISTS facturama_api_password text;

-- 2. Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  cfdi_status TEXT NOT NULL DEFAULT 'processing' CHECK (cfdi_status IN ('processing', 'issued', 'failed', 'canceled')),
  uuid_sat UUID,
  error_message TEXT,
  pdf_url TEXT,
  xml_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_business_id ON public.invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_transaction_id ON public.invoices(transaction_id);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their business invoices"
ON public.invoices FOR SELECT
USING (business_id IN (
  SELECT business_id FROM public.users WHERE id = auth.uid()
));
