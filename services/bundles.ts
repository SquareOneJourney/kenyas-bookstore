/**
 * Bundles Service
 * 
 * Manages bundles and bundle items from Supabase.
 */

import { getSupabaseClient, isSupabaseAvailable } from '../lib/supabaseClient';
import { BookRow } from '../types/db';

export interface Bundle {
  id: string;
  name: string;
  description: string | null;
  bundle_price_cents: number;
  discount_percentage: number;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
  updated_at: string;
}

export interface BundleItem {
  id: string;
  bundle_id: string;
  book_id: string;
  display_order: number;
  created_at: string;
  books?: BookRow;
}

export interface BundleWithItems extends Bundle {
  items: (BundleItem & { books: BookRow })[];
}

/**
 * Get all active bundles with their items
 */
export async function getActiveBundles(): Promise<BundleWithItems[]> {
  const supabase = getSupabaseClient();
  
  if (!supabase) {
    console.warn('Supabase not configured. Cannot fetch bundles.');
    return [];
  }

  try {
    // Get active bundles
    const { data: bundles, error: bundlesError } = await supabase
      .from('bundles')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (bundlesError) {
      console.error('Error fetching bundles:', bundlesError);
      return [];
    }

    if (!bundles || bundles.length === 0) {
      return [];
    }

    // Get items for all bundles
    const bundleIds = bundles.map(b => b.id);
    const { data: items, error: itemsError } = await supabase
      .from('bundle_items')
      .select(`
        *,
        books (*)
      `)
      .in('bundle_id', bundleIds)
      .order('display_order', { ascending: true });

    if (itemsError) {
      console.error('Error fetching bundle items:', itemsError);
      return [];
    }

    // Group items by bundle
    const itemsByBundle = new Map<string, (BundleItem & { books: BookRow })[]>();
    (items || []).forEach((item: any) => {
      const book = item.books as BookRow;
      if (!itemsByBundle.has(item.bundle_id)) {
        itemsByBundle.set(item.bundle_id, []);
      }
      itemsByBundle.get(item.bundle_id)!.push({
        ...item,
        books: book,
      });
    });

    // Combine bundles with their items
    return bundles.map(bundle => ({
      ...bundle,
      items: itemsByBundle.get(bundle.id) || [],
    }));
  } catch (error) {
    console.error('Exception fetching bundles:', error);
    return [];
  }
}

/**
 * Get a single bundle by ID with items
 */
export async function getBundleById(id: string): Promise<BundleWithItems | null> {
  const supabase = getSupabaseClient();
  
  if (!supabase) {
    return null;
  }

  try {
    const { data: bundle, error: bundleError } = await supabase
      .from('bundles')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (bundleError || !bundle) {
      return null;
    }

    const { data: items, error: itemsError } = await supabase
      .from('bundle_items')
      .select(`
        *,
        books (*)
      `)
      .eq('bundle_id', id)
      .order('display_order', { ascending: true });

    if (itemsError) {
      console.error('Error fetching bundle items:', itemsError);
      return null;
    }

    const itemsWithBooks = (items || []).map((item: any) => ({
      ...item,
      books: item.books as BookRow,
    })) as (BundleItem & { books: BookRow })[];

    return {
      ...bundle,
      items: itemsWithBooks,
    };
  } catch (error) {
    console.error('Exception fetching bundle:', error);
    return null;
  }
}



