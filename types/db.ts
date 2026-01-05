/**
 * Canonical database types derived from generated Supabase types
 * 
 * These types match the database schema exactly (snake_case).
 * Use these throughout the application instead of the old camelCase interfaces.
 */

import { Database } from './supabase';

// Re-export the Database type for Supabase client usage
export type { Database };

// Table Row types (exact match to DB schema)
export type BookRow = Database['public']['Tables']['books']['Row'];
export type BookInsert = Database['public']['Tables']['books']['Insert'];
export type BookUpdate = Database['public']['Tables']['books']['Update'];

export type OrderRow = Database['public']['Tables']['orders']['Row'];
export type OrderInsert = Database['public']['Tables']['orders']['Insert'];
export type OrderUpdate = Database['public']['Tables']['orders']['Update'];

export type CartItemRow = Database['public']['Tables']['cart_items']['Row'];
export type CartItemInsert = Database['public']['Tables']['cart_items']['Insert'];
export type CartItemUpdate = Database['public']['Tables']['cart_items']['Update'];

export type WishlistItemRow = Database['public']['Tables']['wishlist_items']['Row'];
export type WishlistItemInsert = Database['public']['Tables']['wishlist_items']['Insert'];
export type WishlistItemUpdate = Database['public']['Tables']['wishlist_items']['Update'];

export type OrderItemRow = Database['public']['Tables']['order_items']['Row'];
export type OrderItemInsert = Database['public']['Tables']['order_items']['Insert'];
export type OrderItemUpdate = Database['public']['Tables']['order_items']['Update'];

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

// Helper type for cart items with joined book data
export interface CartItemWithBook extends CartItemRow {
  books: BookRow;
}

// Helper type for wishlist items with joined book data
export interface WishlistItemWithBook extends WishlistItemRow {
  books: BookRow;
}

// Helper type for order items (already includes title snapshot, no join needed)
export type OrderItemWithBook = OrderItemRow & {
  books?: BookRow | null; // Optional join if needed
};



