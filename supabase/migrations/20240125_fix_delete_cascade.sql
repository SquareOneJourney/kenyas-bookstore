-- Migration: Add ON DELETE CASCADE to allow book deletion

-- 1. wishlist_items: Delete entry if book is deleted
ALTER TABLE wishlist_items
DROP CONSTRAINT IF EXISTS wishlist_items_book_id_fkey;

ALTER TABLE wishlist_items
ADD CONSTRAINT wishlist_items_book_id_fkey
FOREIGN KEY (book_id)
REFERENCES books(id)
ON DELETE CASCADE;

-- 2. cart_items: Delete entry if book is deleted
ALTER TABLE cart_items
DROP CONSTRAINT IF EXISTS cart_items_book_id_fkey;

ALTER TABLE cart_items
ADD CONSTRAINT cart_items_book_id_fkey
FOREIGN KEY (book_id)
REFERENCES books(id)
ON DELETE CASCADE;

-- 3. order_items: Prevent deletion if involved in orders, OR set null?
-- Usually, you DO NOT want to delete books that have been sold.
-- If we want to allow it, we should verify specific needs.
-- For now, we assume wishlist/cart are the main blockers for "inventory management" cleanup.
