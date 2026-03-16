-- Phase 7: Public Directory Access Policies

-- 1. Allow public read access to active businesses
CREATE POLICY "Public View Businesses" ON public.businesses 
    FOR SELECT USING (true); 

-- 2. Allow public read access to menu items for the directory
CREATE POLICY "Public View Menu Items" ON public.entities 
    FOR SELECT USING (type = 'menu_item');

-- 3. Ensure transactions remain strictly isolated
-- (No action needed, Phase 6 policies restrict this to auth.uid())
