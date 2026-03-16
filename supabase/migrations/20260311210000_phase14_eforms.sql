CREATE TABLE public.eforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  fields_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.eforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own business eforms" 
ON public.eforms FOR SELECT 
USING (business_id IN (SELECT business_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert their own business eforms" 
ON public.eforms FOR INSERT 
WITH CHECK (business_id IN (SELECT business_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own business eforms" 
ON public.eforms FOR UPDATE 
USING (business_id IN (SELECT business_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can delete their own business eforms" 
ON public.eforms FOR DELETE 
USING (business_id IN (SELECT business_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Public can view active eforms" 
ON public.eforms FOR SELECT 
USING (is_active = true);

-- Allow public to submit eforms data to vault
CREATE POLICY "Public can insert vault submissions"
ON public.vault_submissions FOR INSERT
WITH CHECK (true);
