-- Phase 17: Hybrid POS Updates to Existing Transactions Table

-- 1. Link transactions to CRM
ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.crm_customers(id) ON DELETE SET NULL;

-- 2. Performance and Webhook Indices
CREATE INDEX IF NOT EXISTS idx_transactions_external_ref ON public.transactions(external_payment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON public.transactions(customer_id);

-- 3. Ensure transaction_items is optimized for bulk inserts
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction ON public.transaction_items(transaction_id);