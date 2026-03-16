-- Phase 35: Automated Inventory Reordering Webhooks
-- Connects critical restock alerts to external automation triggers

-- 1. Table for Platform Notifications
-- Tracks alerts sent to merchants (and potentially suppliers)
CREATE TABLE IF NOT EXISTS public.platform_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'inventory_restock', 'subscription_expiry', 'security_alert'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'dismissed'
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    title TEXT NOT NULL,
    message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. RLS for Notifications
ALTER TABLE public.platform_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants view their own notifications" ON public.platform_notifications
    FOR ALL USING (business_id = public.get_auth_business_id())
    WITH CHECK (business_id = public.get_auth_business_id());

-- 3. Automatic Restock Alert Trigger
-- This function checks for critical stock and creates a notification
CREATE OR REPLACE FUNCTION public.check_for_critical_restock()
RETURNS void AS $$
DECLARE
    biz RECORD;
    critical_count INT;
BEGIN
    FOR biz IN SELECT id, name FROM public.businesses LOOP
        -- Count items needing ASAP restock
        SELECT count(*) INTO critical_count 
        FROM public.products 
        WHERE business_id = biz.id 
        AND is_active = true 
        AND predicted_out_of_stock_date <= (CURRENT_DATE + INTERVAL '3 days');

        IF critical_count > 0 THEN
            -- Insert notification if one doesn't exist for today
            INSERT INTO public.platform_notifications (business_id, type, priority, title, message, metadata)
            SELECT biz.id, 'inventory_restock', 'high', 'Critical Restock Alert', 
                   format('You have %s items predicted to run out of stock within 72 hours.', critical_count),
                   jsonb_build_object('item_count', critical_count)
            WHERE NOT EXISTS (
                SELECT 1 FROM public.platform_notifications 
                WHERE business_id = biz.id 
                AND type = 'inventory_restock' 
                AND created_at >= CURRENT_DATE
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Hook into n8n via a Webhook Trigger
-- We can add a function that calls the automation dispatcher
CREATE OR REPLACE FUNCTION public.trigger_inventory_webhook()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger for high priority restock alerts
    IF NEW.type = 'inventory_restock' AND NEW.priority = 'high' THEN
        -- Logic to notify n8n (typically via pg_net or an Edge Function hook)
        -- For now, we'll assume the automation-dispatcher picks up pending logs
        NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_restock_automation
AFTER INSERT ON public.platform_notifications
FOR EACH ROW EXECUTE FUNCTION public.trigger_inventory_webhook();
