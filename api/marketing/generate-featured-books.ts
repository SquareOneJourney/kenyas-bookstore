/**
 * Generate Featured Books Endpoint
 * 
 * Server-side only endpoint that uses Gemini AI to recommend 5 featured books
 * from Kenya's inventory. This endpoint must never be called from the browser
 * to protect the Gemini API key.
 * 
 * POST /api/marketing/generate-featured-books
 * 
 * Headers:
 *   - Authorization: Bearer <supabase_session_token> (for admin verification)
 * 
 * Returns:
 *   - recommendations: Array of {book_id, reasoning, display_order}
 *   - error: string (if error occurred)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

interface BookInventory {
  id: string;
  title: string;
  author: string | null;
  publisher: string | null;
  publication_date: string | null;
  format: string | null;
  list_price_cents: number | null;
  availability_message: string | null;
  cover_url: string | null;
}

interface FeaturedRecommendation {
  book_id: string;
  reasoning: string;
  display_order: number;
}

// Simple admin check: verify user is authenticated
// TODO: Add proper admin role checking (email allowlist or profiles.role)
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

    // TODO: Add admin email allowlist check here
    // For now, any authenticated user can generate (restrict via RLS in production)
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
  // CORS headers for development
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
    // Fetch all active books from inventory
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id, title, author, publisher, publication_date, format, list_price_cents, availability_message, cover_url')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(100); // Limit to most recent 100 books for prompt size

    if (booksError) {
      console.error('Error fetching books:', booksError);
      return res.status(500).json({
        error: 'Failed to fetch inventory',
        message: booksError.message,
      });
    }

    if (!books || books.length === 0) {
      return res.status(400).json({
        error: 'No active books in inventory',
        message: 'Add books to inventory before generating featured recommendations',
      });
    }

    // Prepare inventory data for Gemini
    const inventorySummary = books.map((book: BookInventory) => ({
      id: book.id,
      title: book.title,
      author: book.author || 'Unknown',
      publisher: book.publisher || 'Unknown',
      publication_date: book.publication_date || 'Unknown',
      format: book.format || 'Unknown',
      price: book.list_price_cents ? `$${(book.list_price_cents / 100).toFixed(2)}` : 'Price not set',
      availability: book.availability_message || 'Available',
    }));

    // Call Gemini AI
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    const prompt = `You are a marketing assistant for "Kenya's Bookstore," an online bookstore. Your task is to recommend exactly 5 books from the inventory below that would be most effective to feature on the homepage.

**Inventory (${inventorySummary.length} books):**
${inventorySummary.map((book, idx) => 
  `${idx + 1}. "${book.title}" by ${book.author} (${book.format}, ${book.price}, ${book.availability}) [ID: ${book.id}]`
).join('\n')}

**Selection Criteria:**
1. Choose books that are recognizable and marketable
2. Ensure variety (different genres/authors if possible)
3. Prefer books with good price points and availability
4. Consider publication dates (newer books may be more relevant)
5. Select books that would appeal to a broad audience

**Output Format:**
Return a valid JSON array with exactly 5 objects, each with:
- "book_id": The exact book ID from the inventory
- "reasoning": A brief 1-2 sentence explanation of why this book should be featured
- "display_order": An integer from 1 to 5 indicating the display order (1 = first/primary)

Example:
[
  {
    "book_id": "uuid-here",
    "reasoning": "This book is a recent bestseller and appeals to a wide audience.",
    "display_order": 1
  },
  ...
]

Return ONLY the JSON array, no markdown formatting, no code blocks.`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              book_id: { type: 'string' },
              reasoning: { type: 'string' },
              display_order: { type: 'integer' },
            },
            required: ['book_id', 'reasoning', 'display_order'],
          },
        },
      },
    });

    let recommendations: FeaturedRecommendation[];
    try {
      const text = response.text.replace(/```json|```/g, '').trim();
      recommendations = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      return res.status(500).json({
        error: 'Failed to parse AI response',
        message: 'AI returned invalid JSON format',
      });
    }

    // Validate recommendations
    if (!Array.isArray(recommendations) || recommendations.length !== 5) {
      return res.status(500).json({
        error: 'Invalid recommendations',
        message: 'AI must return exactly 5 recommendations',
      });
    }

    // Verify all book IDs exist in inventory
    const bookIds = new Set(books.map((b: BookInventory) => b.id));
    const invalidIds = recommendations.filter(r => !bookIds.has(r.book_id));
    if (invalidIds.length > 0) {
      return res.status(500).json({
        error: 'Invalid book IDs',
        message: `AI recommended books not in inventory: ${invalidIds.map(r => r.book_id).join(', ')}`,
      });
    }

    // Enrich recommendations with book details for client
    const enrichedRecommendations = recommendations.map(rec => {
      const book = books.find((b: BookInventory) => b.id === rec.book_id);
      return {
        ...rec,
        book: book ? {
          id: book.id,
          title: book.title,
          author: book.author,
          cover_url: book.cover_url,
          list_price_cents: book.list_price_cents,
        } : null,
      };
    });

    return res.status(200).json({
      recommendations: enrichedRecommendations,
    });
  } catch (error: any) {
    console.error('Generate featured books error:', error);
    return res.status(500).json({
      error: 'Failed to generate featured books',
      message: error.message || 'Unknown error occurred',
    });
  }
}




