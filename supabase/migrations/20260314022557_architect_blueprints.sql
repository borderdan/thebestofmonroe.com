-- Create blueprints table
CREATE TABLE IF NOT EXISTS blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'deployed')),
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- RLS
ALTER TABLE blueprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view blueprints of their business"
  ON blueprints FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM base_profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert blueprints to their business"
  ON blueprints FOR INSERT
  WITH CHECK (business_id IN (
    SELECT business_id FROM base_profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update blueprints of their business"
  ON blueprints FOR UPDATE
  USING (business_id IN (
    SELECT business_id FROM base_profiles WHERE id = auth.uid()
  ))
  WITH CHECK (business_id IN (
    SELECT business_id FROM base_profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete blueprints of their business"
  ON blueprints FOR DELETE
  USING (business_id IN (
    SELECT business_id FROM base_profiles WHERE id = auth.uid()
  ));

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at_blueprints
  BEFORE UPDATE ON blueprints
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime (updated_at);
