-- Migration: Featured Books Tables
-- Creates tables for storing AI-generated featured book recommendations
-- Supports multiple sets (e.g., "This Week", "Holiday Picks") with atomic activation

-- Featured Sets table
CREATE TABLE IF NOT EXISTS featured_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL, -- e.g., "Week of 2025-01-15", "Holiday 2024"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT false
  -- Note: Only one active set at a time is enforced by application logic
  -- (deactivate old set before activating new one)
);

-- Featured Set Items table
CREATE TABLE IF NOT EXISTS featured_set_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID NOT NULL REFERENCES featured_sets(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL CHECK (display_order >= 1 AND display_order <= 5),
  ai_reasoning TEXT, -- Why AI recommended this book
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure unique display_order per set
  UNIQUE(set_id, display_order)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_featured_sets_active ON featured_sets(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_featured_set_items_set_id ON featured_set_items(set_id);
CREATE INDEX IF NOT EXISTS idx_featured_set_items_book_id ON featured_set_items(book_id);

-- RLS Policies
ALTER TABLE featured_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_set_items ENABLE ROW LEVEL SECURITY;

-- Public can read active featured sets and their items
CREATE POLICY "Public can read active featured sets"
  ON featured_sets FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can read active featured set items"
  ON featured_set_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM featured_sets
      WHERE featured_sets.id = featured_set_items.set_id
      AND featured_sets.is_active = true
    )
  );

-- Admin-only write access (will be enforced server-side with service role key)
-- For now, allow authenticated users to write (admin check happens in application layer)
-- TODO: Add proper admin role checking via profiles.role or email allowlist
CREATE POLICY "Authenticated users can create featured sets"
  ON featured_sets FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update featured sets"
  ON featured_sets FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create featured set items"
  ON featured_set_items FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Comments for documentation
COMMENT ON TABLE featured_sets IS 'Stores sets of featured books. Only one set can be active at a time.';
COMMENT ON TABLE featured_set_items IS 'Stores individual books within a featured set. Each set can have up to 5 books.';
COMMENT ON COLUMN featured_set_items.display_order IS 'Order of display (1-5). Must be unique within a set.';
COMMENT ON COLUMN featured_set_items.ai_reasoning IS 'AI-generated explanation for why this book was recommended.';

