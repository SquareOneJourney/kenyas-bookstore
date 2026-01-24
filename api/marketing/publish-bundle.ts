/**
 * Publish Bundle Endpoint
 * 
 * Server-side endpoint to create and publish a bundle.
 * 
 * POST /api/marketing/publish-bundle
 * 
 * Headers:
 *   - Authorization: Bearer <supabase_session_token>
 * 
 * Body:
 *   - name: string
 *   - description: string
 *   - bundle_price_cents: number
 *   - discount_percentage: number
 *   - book_ids: string[] (array of book IDs in order)
 * 
 * Returns:
 *   - bundle_id: string
 *   - error: string (if error occurred)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Simple admin check
async function verifyAdmin(req: VercelRequest): Promise<{ isValid: boolean; userId?: string }> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return { isValid: false };
  }

  const token = authHeader.substring(7);
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { isValid: false };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { isValid: false };
    }

    return { isValid: true, userId: user.id };
  } catch (error) {
    console.error('Admin verification error:', error);
    return { isValid: false };
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify admin access
  const adminCheck = await verifyAdmin(req);
  if (!adminCheck.isValid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { name, description, bundle_price_cents, discount_percentage, book_ids } = req.body;

  // Validate input
  if (!name || !description || !bundle_price_cents || !book_ids || !Array.isArray(book_ids) || book_ids.length < 2) {
    return res.status(400).json({
      error: 'Invalid input',
      message: 'Must provide name, description, bundle_price_cents, and at least 2 book_ids',
    });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(501).json({
      error: 'Supabase is not configured',
      message: 'VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set',
    });
  }

  try {
    // Use service role key to bypass RLS for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify all book IDs exist
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id')
      .in('id', book_ids)
      .eq('is_active', true);

    if (booksError) {
      console.error('Error verifying books:', booksError);
      return res.status(500).json({
        error: 'Failed to verify books',
        message: booksError.message,
      });
    }

    if (!books || books.length !== book_ids.length) {
      return res.status(400).json({
        error: 'Invalid book IDs',
        message: 'Some book IDs do not exist or are not active',
      });
    }

    // Create bundle
    const { data: newBundle, error: bundleError } = await supabase
      .from('bundles')
      .insert({
        name,
        description,
        bundle_price_cents: Math.round(bundle_price_cents),
        discount_percentage: discount_percentage || 15,
        is_active: true,
        created_by: adminCheck.userId || null,
      })
      .select()
      .single();

    if (bundleError || !newBundle) {
      console.error('Error creating bundle:', bundleError);
      return res.status(500).json({
        error: 'Failed to create bundle',
        message: bundleError?.message || 'Unknown error',
      });
    }

    // Create bundle items
    const bundleItems = book_ids.map((bookId: string, index: number) => ({
      bundle_id: newBundle.id,
      book_id: bookId,
      display_order: index + 1,
    }));

    const { error: itemsError } = await supabase
      .from('bundle_items')
      .insert(bundleItems);

    if (itemsError) {
      console.error('Error creating bundle items:', itemsError);
      // Try to clean up the bundle if items failed
      await supabase.from('bundles').delete().eq('id', newBundle.id);
      return res.status(500).json({
        error: 'Failed to create bundle items',
        message: itemsError.message,
      });
    }

    return res.status(200).json({
      bundle_id: newBundle.id,
      name: newBundle.name,
      message: 'Bundle created and published successfully',
    });
  } catch (error: any) {
    console.error('Publish bundle error:', error);
    return res.status(500).json({
      error: 'Failed to publish bundle',
      message: error.message || 'Unknown error occurred',
    });
  }
}




