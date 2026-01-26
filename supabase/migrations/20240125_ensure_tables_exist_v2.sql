-- Migration: Fix type mismatch and ensure tables exist
-- Failure Reason: books.id is TEXT, but we tried to use UUID for the foreign key.

-- 1. Reset tables (Safe to drop as they were malformed/empty)
DROP TABLE IF EXISTS wishlist_items;
DROP TABLE IF EXISTS cart_items;

-- 2. Create wishlist_items with correct types
CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- references auth.users which is UUID
  book_id TEXT NOT NULL, -- CHANGED to TEXT to match books.id
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- 3. Create cart_items with correct types
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  book_id TEXT NOT NULL, -- CHANGED to TEXT to match books.id
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- 4. Apply Foreign Keys with CASCADE
ALTER TABLE wishlist_items
ADD CONSTRAINT wishlist_items_book_id_fkey
FOREIGN KEY (book_id)
REFERENCES books(id)
ON DELETE CASCADE;

ALTER TABLE cart_items
ADD CONSTRAINT cart_items_book_id_fkey
FOREIGN KEY (book_id)
REFERENCES books(id)
ON DELETE CASCADE;
