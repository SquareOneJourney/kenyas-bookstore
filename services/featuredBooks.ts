/**
 * Featured Books Service
 * 
 * Manages featured book sets and items from Supabase.
 */

import { getSupabaseClient, isSupabaseAvailable } from '../lib/supabaseClient';
import { BookRow } from '../types/db';

export interface FeaturedSet {
  id: string;
  label: string;
  created_at: string;
  created_by: string | null;
  is_active: boolean;
}

export interface FeaturedSetItem {
  id: string;
  set_id: string;
  book_id: string;
  display_order: number;
  ai_reasoning: string | null;
  created_at: string;
  books?: BookRow;
}

export interface FeaturedSetWithItems extends FeaturedSet {
  items: (FeaturedSetItem & { books: BookRow })[];
}

/**
 * Get the currently active featured set with items
 */
export async function getActiveFeaturedSet(): Promise<FeaturedSetWithItems | null> {
  const supabase = getSupabaseClient();
  
  if (!supabase) {
    console.warn('Supabase not configured. Cannot fetch featured books.');
    return null;
  }

  try {
    // Get active set
    const { data: activeSet, error: setError } = await supabase
      .from('featured_sets')
      .select('*')
      .eq('is_active', true)
      .single();

    if (setError || !activeSet) {
      // No active set found - this is okay, just return null
      return null;
    }

    // Get items for this set with book details
    const { data: items, error: itemsError } = await supabase
      .from('featured_set_items')
      .select(`
        *,
        books (*)
      `)
      .eq('set_id', activeSet.id)
      .order('display_order', { ascending: true });

    if (itemsError) {
      console.error('Error fetching featured set items:', itemsError);
      return null;
    }

    // Type assertion for items with books
    const itemsWithBooks = (items || []).map(item => ({
      ...item,
      books: item.books as BookRow,
    })) as (FeaturedSetItem & { books: BookRow })[];

    return {
      ...activeSet,
      items: itemsWithBooks,
    };
  } catch (error) {
    console.error('Exception fetching featured set:', error);
    return null;
  }
}

/**
 * Get all featured sets (admin only)
 */
export async function getAllFeaturedSets(): Promise<FeaturedSet[]> {
  const supabase = getSupabaseClient();
  
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('featured_sets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching featured sets:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception fetching featured sets:', error);
    return [];
  }
}

