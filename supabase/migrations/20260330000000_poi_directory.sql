CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;

CREATE INDEX idx_businesses_rating ON businesses(rating DESC);
CREATE INDEX idx_businesses_review_count ON businesses(review_count DESC);
CREATE INDEX idx_businesses_name_trgm ON businesses USING gin (name gin_trgm_ops);
CREATE INDEX idx_businesses_city ON businesses(city);
CREATE INDEX idx_businesses_category ON businesses(category);
