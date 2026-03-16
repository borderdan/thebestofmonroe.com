-- Phase 25: Smart Inventory Insights & Predicted Restock Alerts
-- Extends the products table with AI-generated inventory intelligence

-- 1. Add insight columns to public.products
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS sales_velocity_7d NUMERIC(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS predicted_out_of_stock_date DATE,
    ADD COLUMN IF NOT EXISTS restock_recommendation TEXT;

-- 2. Create index for fast filtering of products needing restock
CREATE INDEX IF NOT EXISTS idx_products_predicted_out_of_stock 
    ON public.products(predicted_out_of_stock_date ASC) 
    WHERE predicted_out_of_stock_date IS NOT NULL;

-- 3. Add a helper view for inventory analytics
CREATE OR REPLACE VIEW public.inventory_health_summary AS
SELECT 
    business_id,
    COUNT(*) FILTER (WHERE stock_quantity <= 5) as low_stock_count,
    COUNT(*) FILTER (WHERE predicted_out_of_stock_date <= (CURRENT_DATE + INTERVAL '7 days')) as critical_restock_count,
    ROUND(AVG(sales_velocity_7d), 2) as avg_sales_velocity
FROM public.products
WHERE is_active = true
GROUP BY business_id;
