/**
 * Books service - Supabase queries for books
 * 
 * Replaces mockData.ts usage with real database queries.
 */

import { getSupabaseClient, isSupabaseAvailable } from '../lib/supabaseClient';
import { BookRow } from '../types/db';
import { normalizeSearch, isISBNQuery } from '../lib/search';

export type BookSortOption = 'newest' | 'price-asc' | 'price-desc';

export interface ListBooksOptions {
  q?: string; // Search query
  sort?: BookSortOption;
  limit?: number;
}

/**
 * List active books from Supabase
 * 
 * Always filters by is_active = true for public catalog.
 * Supports search by title/author/ISBN and sorting.
 * 
 * @param options - Search and sort options
 * @returns Array of active books
 */
export async function listActiveBooks(options: ListBooksOptions = {}): Promise<BookRow[]> {
  const supabase = getSupabaseClient();
  
  if (!supabase) {
    // Fallback to empty array if Supabase not configured
    // In production, this should show an error UI
    console.warn('Supabase not configured. Cannot fetch books.');
    return [];
  }

  try {
    let query = supabase
      .from('books')
      .select('*')
      .eq('is_active', true);

    // Apply search
    if (options.q) {
      const normalizedQ = normalizeSearch(options.q);
      
      if (isISBNQuery(normalizedQ)) {
        // Search by ISBN (exact match preferred, but use ilike for flexibility)
        query = query.or(`isbn13.ilike.%${normalizedQ}%,isbn10.ilike.%${normalizedQ}%`);
      } else {
        // Search by title/author
        const searchTerm = `%${options.q}%`;
        query = query.or(`title.ilike.${searchTerm},author.ilike.${searchTerm}`);
      }
    }

    // Apply sorting
    if (options.sort === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (options.sort === 'price-asc') {
      query = query.order('list_price_cents', { ascending: true, nullsFirst: false });
    } else if (options.sort === 'price-desc') {
      query = query.order('list_price_cents', { ascending: false, nullsFirst: false });
    } else {
      // Default: newest first
      query = query.order('created_at', { ascending: false });
    }

    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching books:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception fetching books:', error);
    return [];
  }
}

/**
 * Get a single book by ID
 * 
 * @param id - Book ID (UUID)
 * @returns Book or null if not found
 */
export async function getBookById(id: string): Promise<BookRow | null> {
  const supabase = getSupabaseClient();
  
  if (!supabase) {
    console.warn('Supabase not configured. Cannot fetch book.');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error fetching book:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception fetching book:', error);
    return null;
  }
}

/**
 * Get availability message for a book
 * 
 * @param book - Book row
 * @returns Availability message (never null)
 */
export function getAvailabilityMessage(book: BookRow): string {
  return book.availability_message ?? 'Available for order';
}

