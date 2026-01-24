/**
 * Application Types
 * 
 * These types are derived from the Supabase database schema.
 * For raw database types, see types/db.ts
 */

import { BookRow, OrderRow, CartItemRow, WishlistItemRow, OrderItemRow } from './types/db';

// Re-export DB types for direct use
export type { BookRow, OrderRow, CartItemRow, WishlistItemRow, OrderItemRow } from './types/db';

/**
 * App-level Book type
 * 
 * Extends the DB schema with optional catalog metadata used in UI flows.
 */
export type Book = {
  id: string;
  title: string;
} & Partial<BookRow> & {
  genre?: string | null;
  stock?: number | null;
  condition?: BookCondition | string | null;
  location?: string | null;
  tags?: string[] | null;
  supply_source?: SupplySource | string | null;
  cost_basis?: number | null;
  ingram_stock_level?: 'In Stock' | 'Low Stock' | 'Out of Stock' | string | null;
  last_stock_sync?: string | null;
};

/**
 * Cart item with book data
 * 
 * For guest carts (localStorage): extends Book with quantity
 * For authed carts (DB): CartItemRow with joined books
 */
export interface CartItem {
  id: string;
  book_id: string;
  quantity: number;
  // Book data (joined or embedded)
  books?: Book;
  // For backward compatibility with old CartItem interface
  // These are derived from books when present
  title?: string;
  author?: string;
  list_price_cents?: number | null;
  cover_url?: string | null;
}

/**
 * Cart context type
 */
export interface CartContextType {
  cartItems: CartItem[];
  addToCart: (book: Book) => void;
  removeFromCart: (bookId: string) => void;
  updateQuantity: (bookId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number; // In cents
  shippingMethod: 'standard' | 'express';
  setShippingMethod: (method: 'standard' | 'express') => void;
  tax: number; // In cents
  finalTotal: number; // In cents
}

/**
 * Order status (matches DB schema)
 */
export type OrderStatus = string; // DB uses string, not enum

/**
 * App-level Order type (compatible with DB schema)
 */
export type Order = OrderRow;

/**
 * Order with items
 */
export interface OrderWithItems extends Order {
  items: OrderItemRow[];
}

/**
 * Wish type (for wish list feature - not wishlist_items)
 * This is a separate feature from user wishlists
 */
export interface Wish {
  id: string;
  age: number;
  interests: string;
  theme: string;
  status: 'Open' | 'Fulfilled' | 'Delivered';
  donatedBook?: Book;
  donorNote?: string;
}

/**
 * Wishlist context type (for user wishlists)
 */
export interface WishlistContextType {
  wishlist: Book[];
  addToWishlist: (book: Book) => void;
  removeFromWishlist: (bookId: string) => void;
  isInWishlist: (bookId: string) => boolean;
}

// Legacy types (deprecated - kept for backward compatibility during migration)
/** @deprecated Use BookRow or Book instead */
export type BookCondition = 'New' | 'Like New' | 'Very Good' | 'Good' | 'Acceptable';

/** @deprecated Use BookRow or Book instead */
export type SupplySource = 'local' | 'ingram';
