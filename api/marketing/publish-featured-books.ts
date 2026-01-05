/**
 * Publish Featured Books Endpoint
 * 
 * Server-side endpoint to publish a featured set of books.
 * Deactivates any existing active set and activates the new one.
 * 
 * POST /api/marketing/publish-featured-books
 * 
 * Headers:
 *   - Authorization: Bearer <supabase_session_token>
 * 
 * Body:
 *   - label: string (optional, defaults to timestamp)
 *   - items: Array<{book_id: string, display_order: number, ai_reasoning: string}>
 * 
 * Returns:
 *   - set_id: string
 *   - error: string (if error occurred)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

interface PublishItem {
  book_id: string;
  display_order: number;
  ai_reasoning: string;
}

// Simple admin check (same as generate endpoint)
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

  const { label, items } = req.body;

  // Validate input
  if (!items || !Array.isArray(items) || items.length !== 5) {
    return res.status(400).json({
      error: 'Invalid input',
      message: 'Must provide exactly 5 items with book_id, display_order, and ai_reasoning',
    });
  }

  // Validate items structure
  for (const item of items) {
    if (!item.book_id || typeof item.display_order !== 'number' || !item.ai_reasoning) {
      return res.status(400).json({
        error: 'Invalid item structure',
        message: 'Each item must have book_id (string), display_order (number 1-5), and ai_reasoning (string)',
      });
    }
    if (item.display_order < 1 || item.display_order > 5) {
      return res.status(400).json({
        error: 'Invalid display_order',
        message: 'display_order must be between 1 and 5',
      });
    }
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

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
    const bookIds = items.map(item => item.book_id);
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id')
      .in('id', bookIds);

    if (booksError) {
      console.error('Error verifying books:', booksError);
      return res.status(500).json({
        error: 'Failed to verify books',
        message: booksError.message,
      });
    }

    if (!books || books.length !== 5) {
      return res.status(400).json({
        error: 'Invalid book IDs',
        message: 'Some book IDs do not exist in the database',
      });
    }

    // Deactivate any existing active set
    await supabase
      .from('featured_sets')
      .update({ is_active: false })
      .eq('is_active', true);

    // Create new featured set
    const setLabel = label || `Featured Set - ${new Date().toLocaleDateString()}`;
    const { data: newSet, error: setError } = await supabase
      .from('featured_sets')
      .insert({
        label: setLabel,
        created_by: adminCheck.userId || null,
        is_active: true,
      })
      .select()
      .single();

    if (setError || !newSet) {
      console.error('Error creating featured set:', setError);
      return res.status(500).json({
        error: 'Failed to create featured set',
        message: setError?.message || 'Unknown error',
      });
    }

    // Create featured set items
    const setItems = items.map((item: PublishItem) => ({
      set_id: newSet.id,
      book_id: item.book_id,
      display_order: item.display_order,
      ai_reasoning: item.ai_reasoning,
    }));

    const { error: itemsError } = await supabase
      .from('featured_set_items')
      .insert(setItems);

    if (itemsError) {
      console.error('Error creating featured set items:', itemsError);
      // Try to clean up the set if items failed
      await supabase.from('featured_sets').delete().eq('id', newSet.id);
      return res.status(500).json({
        error: 'Failed to create featured set items',
        message: itemsError.message,
      });
    }

    return res.status(200).json({
      set_id: newSet.id,
      label: newSet.label,
      message: 'Featured books published successfully',
    });
  } catch (error: any) {
    console.error('Publish featured books error:', error);
    return res.status(500).json({
      error: 'Failed to publish featured books',
      message: error.message || 'Unknown error occurred',
    });
  }
}



