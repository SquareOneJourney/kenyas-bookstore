-- Migration: Ensure wishlist_items and cart_items tables exist with CASCADE delete

-- 1. Create wishlist_items if missing
CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- references auth.users(id) usually, but we keep it flexible if needed
  book_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- 2. Create cart_items if missing
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  book_id UUID NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- 3. Ensure Foreign Keys with ON DELETE CASCADE
-- We use DO blocks to safely handle constraints existence

-- wishlist_items FK
DO $$ 
BEGIN
  -- Drop if exists to ensure we have the correct configuration
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'wishlist_items_book_id_fkey') THEN
    ALTER TABLE wishlist_items DROP CONSTRAINT wishlist_items_book_id_fkey;
  END IF;

  ALTER TABLE wishlist_items
  ADD CONSTRAINT wishlist_items_book_id_fkey
  FOREIGN KEY (book_id)
  REFERENCES books(id)
  ON DELETE CASCADE;
END $$;

-- cart_items FK
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'cart_items_book_id_fkey') THEN
    ALTER TABLE cart_items DROP CONSTRAINT cart_items_book_id_fkey;
  END IF;

  ALTER TABLE cart_items
  ADD CONSTRAINT cart_items_book_id_fkey
  FOREIGN KEY (book_id)
  REFERENCES books(id)
  ON DELETE CASCADE;
END $$;
