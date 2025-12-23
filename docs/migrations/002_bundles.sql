-- Migration: Bundles Tables
-- Creates tables for storing AI-generated book bundles
-- Bundles are curated collections of books sold together at a discount

-- Bundles table
CREATE TABLE IF NOT EXISTS bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- AI-generated bundle name
  description TEXT, -- AI-generated bundle description
  bundle_price_cents INTEGER NOT NULL, -- Total bundle price (with discount applied)
  discount_percentage INTEGER DEFAULT 15, -- Discount percentage (e.g., 15 = 15% off)
  is_active BOOLEAN DEFAULT true, -- Whether bundle is available for purchase
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bundle Items table (links books to bundles)
CREATE TABLE IF NOT EXISTS bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL, -- Order of books in bundle (1, 2, 3, ...)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure unique book per bundle (a book can only appear once in a bundle)
  UNIQUE(bundle_id, book_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bundles_active ON bundles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_bundle_items_bundle_id ON bundle_items(bundle_id);
CREATE INDEX IF NOT EXISTS idx_bundle_items_book_id ON bundle_items(book_id);

-- RLS Policies
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_items ENABLE ROW LEVEL SECURITY;

-- Public can read active bundles and their items
CREATE POLICY "Public can read active bundles"
  ON bundles FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can read active bundle items"
  ON bundle_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bundles
      WHERE bundles.id = bundle_items.bundle_id
      AND bundles.is_active = true
    )
  );

-- Admin-only write access (enforced server-side with service role key)
CREATE POLICY "Authenticated users can create bundles"
  ON bundles FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update bundles"
  ON bundles FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create bundle items"
  ON bundle_items FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Comments for documentation
COMMENT ON TABLE bundles IS 'Stores curated book bundles with AI-generated names and descriptions.';
COMMENT ON TABLE bundle_items IS 'Links individual books to bundles. Each bundle contains multiple books.';
COMMENT ON COLUMN bundles.bundle_price_cents IS 'Total price for the bundle (after discount applied).';
COMMENT ON COLUMN bundles.discount_percentage IS 'Discount percentage applied to sum of individual book prices.';

