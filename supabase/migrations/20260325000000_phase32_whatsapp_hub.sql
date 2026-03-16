-- Phase 32: WhatsApp Automation Hub & Digital Receipts
-- Tracks WhatsApp messaging status and customer preferences

-- 1. Extend CRM Customers with WhatsApp preferences
ALTER TABLE public.crm_customers
    ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS last_whatsapp_sent_at TIMESTAMPTZ;

-- 2. WhatsApp Message Log (for auditing and billing)
CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.crm_customers(id) ON DELETE SET NULL,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    message_type TEXT NOT NULL, -- 'receipt', 'alert', 'marketing', 'otp'
    status TEXT NOT NULL DEFAULT 'pending', -- 'sent', 'delivered', 'failed'
    external_id TEXT, -- Meta/Twilio message ID
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants view their own whatsapp logs" ON public.whatsapp_logs
    FOR SELECT USING (business_id = public.get_auth_business_id());

-- 4. Unique Receipt Links
-- Every transaction needs a short unique token for the public portal
ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS receipt_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex');

-- Update existing transactions with tokens
UPDATE public.transactions SET receipt_token = encode(gen_random_bytes(6), 'hex') WHERE receipt_token IS NULL;
