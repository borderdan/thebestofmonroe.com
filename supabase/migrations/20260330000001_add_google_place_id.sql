-- Add google_place_id column for robust deduplication across datasets
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS google_place_id TEXT;

-- Create unique index for google_place_id
CREATE UNIQUE INDEX IF NOT EXISTS businesses_google_place_id_idx ON businesses (google_place_id) WHERE google_place_id IS NOT NULL;
