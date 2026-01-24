/**
 * Generate Bundle Campaign Endpoint
 * 
 * Server-side only endpoint that uses Gemini AI to generate a marketing campaign
 * (name and description) for a selected set of books.
 * 
 * POST /api/marketing/generate-bundle-campaign
 * 
 * Headers:
 *   - Authorization: Bearer <supabase_session_token>
 * 
 * Body:
 *   - book_ids: string[] (array of book IDs to include in bundle)
 * 
 * Returns:
 *   - name: string (AI-generated bundle name)
 *   - description: string (AI-generated bundle description)
 *   - error: string (if error occurred)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

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

  const { book_ids } = req.body;

  // Validate input
  if (!book_ids || !Array.isArray(book_ids) || book_ids.length < 2) {
    return res.status(400).json({
      error: 'Invalid input',
      message: 'Must provide at least 2 book_ids',
    });
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return res.status(501).json({
      error: 'Gemini is not configured',
      message: 'GEMINI_API_KEY environment variable is not set',
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
    // Fetch selected books from inventory
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id, title, author, publisher, format, list_price_cents, description')
      .in('id', book_ids)
      .eq('is_active', true);

    if (booksError) {
      console.error('Error fetching books:', booksError);
      return res.status(500).json({
        error: 'Failed to fetch books',
        message: booksError.message,
      });
    }

    if (!books || books.length !== book_ids.length) {
      return res.status(400).json({
        error: 'Invalid book IDs',
        message: 'Some book IDs do not exist or are not active',
      });
    }

    // Prepare book data for Gemini
    const booksSummary = books.map((book, idx) => ({
      number: idx + 1,
      title: book.title,
      author: book.author || 'Unknown Author',
      publisher: book.publisher || 'Unknown',
      format: book.format || 'Unknown',
      price: book.list_price_cents ? `$${(book.list_price_cents / 100).toFixed(2)}` : 'Price not set',
    }));

    const totalPrice = books.reduce((sum, book) => sum + (book.list_price_cents || 0), 0);
    const discountPercentage = 15; // 15% discount for bundles
    const bundlePrice = Math.round(totalPrice * (1 - discountPercentage / 100));

    // Call Gemini AI
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    const prompt = `You are a marketing assistant for "Kenya's Bookstore," an online bookstore. Your task is to create a compelling marketing campaign for a curated book bundle.

**Books in Bundle (${books.length} books):**
${booksSummary.map(b => 
  `${b.number}. "${b.title}" by ${b.author} (${b.format}, ${b.price})`
).join('\n')}

**Pricing:**
- Individual books total: $${(totalPrice / 100).toFixed(2)}
- Bundle discount: ${discountPercentage}% off
- Bundle price: $${(bundlePrice / 100).toFixed(2)}

**Your Task:**
Create a marketing campaign for this bundle. The bundle should feel curated and special - like a "Mystery Box" or "Curated Collection" that customers would be excited to discover.

**Output Format:**
Return a valid JSON object with:
- "name": A creative, catchy name for this bundle (2-6 words, make it exciting and memorable)
- "description": A compelling 2-3 sentence description that sells the "vibe" or theme of this combination. Make it feel special and curated.

Example:
{
  "name": "Literary Escape Collection",
  "description": "Journey through worlds of adventure and discovery with this handpicked selection of captivating stories. Perfect for readers seeking their next great escape."
}

Return ONLY the JSON object, no markdown formatting, no code blocks.`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
          },
          required: ['name', 'description'],
        },
      },
    });

    let campaignData: { name: string; description: string };
    try {
      const text = response.text.replace(/```json|```/g, '').trim();
      campaignData = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      return res.status(500).json({
        error: 'Failed to parse AI response',
        message: 'AI returned invalid JSON format',
      });
    }

    return res.status(200).json({
      name: campaignData.name,
      description: campaignData.description,
      bundle_price_cents: bundlePrice,
      total_price_cents: totalPrice,
      discount_percentage: discountPercentage,
    });
  } catch (error: any) {
    console.error('Generate bundle campaign error:', error);
    return res.status(500).json({
      error: 'Failed to generate bundle campaign',
      message: error.message || 'Unknown error occurred',
    });
  }
}




