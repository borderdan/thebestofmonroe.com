-- Add Flipp-related columns to grocery_prices
ALTER TABLE public.grocery_prices
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS flipp_item_id BIGINT,
  ADD COLUMN IF NOT EXISTS flipp_flyer_id BIGINT,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'seed',
  ADD COLUMN IF NOT EXISTS discount_pct NUMERIC(5,2);

-- Drop old unique constraint and create new one for Flipp-based deduplication
ALTER TABLE public.grocery_prices
  DROP CONSTRAINT IF EXISTS grocery_prices_store_name_store_location_item_name_scraped_a_key;

ALTER TABLE public.grocery_prices
  DROP CONSTRAINT IF EXISTS grocery_prices_store_name_store_location_item_name_scraped__key;

ALTER TABLE public.grocery_prices
  ADD CONSTRAINT grocery_prices_store_item_flipp_key
    UNIQUE (store_name, item_name, flipp_item_id);
