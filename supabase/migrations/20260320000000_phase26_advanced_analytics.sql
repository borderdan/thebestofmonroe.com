-- Phase 26: Advanced Sales Analytics & Heatmaps
-- Aggregates data for time-of-day and category-based visual analytics

-- 1. View for Hourly Sales aggregation (Heatmap data)
CREATE OR REPLACE VIEW public.hourly_sales_analytics AS
SELECT 
    business_id,
    EXTRACT(DOW FROM created_at) as day_of_week,
    EXTRACT(HOUR FROM created_at) as hour_of_day,
    COUNT(*) as transaction_count,
    SUM(total) as total_revenue
FROM public.transactions
WHERE status = 'completed'
GROUP BY business_id, day_of_week, hour_of_day;

-- 2. View for Category-wise Revenue breakdown
-- Note: Joining transactions -> transaction_items -> products to get categories
CREATE OR REPLACE VIEW public.category_revenue_analytics AS
SELECT 
    t.business_id,
    COALESCE(p.category, 'Uncategorized') as category,
    SUM(ti.quantity * ti.price_at_time) as total_revenue,
    SUM(ti.quantity) as total_units_sold
FROM public.transactions t
JOIN public.transaction_items ti ON t.id = ti.transaction_id
LEFT JOIN public.products p ON ti.entity_id = p.id
WHERE t.status = 'completed'
GROUP BY t.business_id, p.category;

-- 3. Grant access to these views
-- Ensure RLS-like behavior if they are queried via PostgREST (Supabase)
-- Note: Views don't have RLS, but we can secure them with SECURITY DEFINER functions 
-- or simply query them via server actions which respect auth context.
