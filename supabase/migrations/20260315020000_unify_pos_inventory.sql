-- Phase 21: POS & Inventory Unification
-- Migrates legacy 'menu_item' entities to 'products' and stabilizes POS logic

-- 1. Create a helper function for atomic stock deduction
CREATE OR REPLACE FUNCTION public.deduct_product_stock(row_id UUID, quantity_to_deduct INT)
RETURNS void AS $$
BEGIN
    UPDATE public.products
    SET stock_quantity = stock_quantity - quantity_to_deduct,
        updated_at = NOW()
    WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Migrate legacy 'menu_item' data from entities to products
-- We preserve IDs to maintain transaction integrity
INSERT INTO public.products (
    id, 
    business_id, 
    name, 
    description,
    price, 
    stock_quantity, 
    category,
    image_url,
    is_active,
    sort_order,
    created_at, 
    updated_at
)
SELECT 
    id, 
    business_id, 
    (data->>'name')::text, 
    (data->>'description')::text,
    (data->>'price')::numeric, 
    COALESCE((data->>'stock_level')::int, 0),
    (data->>'category')::text,
    (data->>'image_url')::text,
    is_active,
    sort_order,
    created_at,
    NOW()
FROM public.entities
WHERE type = 'menu_item'
ON CONFLICT (id) DO UPDATE SET
    business_id = EXCLUDED.business_id,
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    updated_at = NOW();

-- 3. Relax foreign key on transaction_items to allow pointing to products or entities
-- In a real production environment, we might want a polymorphic reference or a unified base table.
-- For now, we drop the constraint to entities and allow it to reference products conceptually.
ALTER TABLE public.transaction_items DROP CONSTRAINT IF EXISTS transaction_items_entity_id_fkey;

-- 4. (Optional) Remove legacy entities to prevent confusion
-- DELETE FROM public.entities WHERE type = 'menu_item';
