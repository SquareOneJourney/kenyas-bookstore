/**
 * Unified Marketing Endpoint
 * 
 * Consolidates all marketing operations into a single serverless function.
 * Uses "action" parameter to route to different operations.
 * 
 * POST /api/marketing
 * Body: { action: string, ...params }
 * 
 * Actions:
 *   - generate-featured-books: AI recommends 5 featured books
 *   - publish-featured-books: Publishes featured books to database
 *   - generate-bundle-campaign: AI generates bundle marketing copy
 *   - publish-bundle: Creates and publishes a bundle
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

// CORS headers helper
function setCorsHeaders(res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Admin verification
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

// Get service role Supabase client
function getServiceClient(): SupabaseClient | null {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) return null;

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
}

// ==================== ACTION HANDLERS ====================

async function handleGenerateFeaturedBooks(ai: GoogleGenAI, supabase: SupabaseClient) {
    // Fetch all books from inventory (removed is_active filter)
    const { data: books, error: booksError } = await supabase
        .from('books')
        .select('id, title, author, publisher, publication_date, format, list_price_cents, availability_message, cover_url')
        .order('created_at', { ascending: false })
        .limit(100);

    if (booksError) throw new Error(`Failed to fetch inventory: ${booksError.message}`);
    if (!books || books.length === 0) throw new Error('No books in inventory');

    const inventorySummary = books.map((book: any) => ({
        id: book.id,
        title: book.title,
        author: book.author || 'Unknown',
        publisher: book.publisher || 'Unknown',
        format: book.format || 'Unknown',
        price: book.list_price_cents ? `$${(book.list_price_cents / 100).toFixed(2)}` : 'Price not set',
    }));

    const prompt = `You are a marketing assistant for "Kenya's Bookstore." Recommend exactly 5 books to feature on the homepage.

**Inventory (${inventorySummary.length} books):**
${inventorySummary.map((book: any, idx: number) =>
        `${idx + 1}. "${book.title}" by ${book.author} (${book.format}, ${book.price}) [ID: ${book.id}]`
    ).join('\n')}

**Selection Criteria:**
1. Choose recognizable, marketable books
2. Ensure variety (different genres/authors)
3. Select books appealing to a broad audience

Return a JSON array with exactly 5 objects:
[{"book_id": "uuid", "reasoning": "brief explanation", "display_order": 1-5}]`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
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

    const text = response.text?.replace(/```json|```/g, '').trim() || '[]';
    const recommendations = JSON.parse(text);

    // Enrich with book details
    const enrichedRecommendations = recommendations.map((rec: any) => {
        const book = books.find((b: any) => b.id === rec.book_id);
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

    return { recommendations: enrichedRecommendations };
}

async function handlePublishFeaturedBooks(supabase: SupabaseClient, body: any, userId?: string) {
    const { label, items } = body;

    if (!items || !Array.isArray(items) || items.length !== 5) {
        throw new Error('Must provide exactly 5 items');
    }

    // Deactivate existing active set
    await supabase.from('featured_sets').update({ is_active: false }).eq('is_active', true);

    // Create new featured set
    const setLabel = label || `Featured Set - ${new Date().toLocaleDateString()}`;
    const { data: newSet, error: setError } = await supabase
        .from('featured_sets')
        .insert({ label: setLabel, created_by: userId || null, is_active: true })
        .select()
        .single();

    if (setError || !newSet) throw new Error(setError?.message || 'Failed to create featured set');

    // Create featured set items
    const setItems = items.map((item: any) => ({
        set_id: newSet.id,
        book_id: item.book_id,
        display_order: item.display_order,
        ai_reasoning: item.ai_reasoning || item.reasoning,
    }));

    const { error: itemsError } = await supabase.from('featured_set_items').insert(setItems);

    if (itemsError) {
        await supabase.from('featured_sets').delete().eq('id', newSet.id);
        throw new Error(itemsError.message);
    }

    return { set_id: newSet.id, label: newSet.label, message: 'Featured books published successfully' };
}

async function handleGenerateBundleCampaign(ai: GoogleGenAI, supabase: SupabaseClient, body: any) {
    const { book_ids } = body;

    if (!book_ids || !Array.isArray(book_ids) || book_ids.length < 2) {
        throw new Error('Must provide at least 2 book_ids');
    }

    // Fetch selected books (removed is_active filter)
    const { data: books, error: booksError } = await supabase
        .from('books')
        .select('id, title, author, publisher, format, list_price_cents, description')
        .in('id', book_ids);

    if (booksError) throw new Error(`Failed to fetch books: ${booksError.message}`);
    if (!books || books.length !== book_ids.length) throw new Error('Some book IDs do not exist');

    const booksSummary = books.map((book: any, idx: number) => ({
        number: idx + 1,
        title: book.title,
        author: book.author || 'Unknown Author',
        format: book.format || 'Unknown',
        price: book.list_price_cents ? `$${(book.list_price_cents / 100).toFixed(2)}` : 'Price not set',
    }));

    const totalPrice = books.reduce((sum: number, book: any) => sum + (book.list_price_cents || 0), 0);
    const discountPercentage = 15;
    const bundlePrice = Math.round(totalPrice * (1 - discountPercentage / 100));

    const prompt = `Create a marketing campaign for a book bundle:
Books: ${booksSummary.map((b: any) => `"${b.title}" by ${b.author}`).join(', ')}
Return JSON: {"name": "catchy bundle name 2-6 words", "description": "2-3 sentence description selling the vibe"}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });

    const text = response.text?.replace(/```json|```/g, '').trim() || '{}';
    const campaignData = JSON.parse(text);

    return {
        name: campaignData.name,
        description: campaignData.description,
        bundle_price_cents: bundlePrice,
        total_price_cents: totalPrice,
        discount_percentage: discountPercentage,
    };
}

async function handlePublishBundle(supabase: SupabaseClient, body: any, userId?: string) {
    const { name, description, bundle_price_cents, discount_percentage, book_ids } = body;

    if (!name || !description || !bundle_price_cents || !book_ids || book_ids.length < 2) {
        throw new Error('Must provide name, description, bundle_price_cents, and at least 2 book_ids');
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
            created_by: userId || null,
        })
        .select()
        .single();

    if (bundleError || !newBundle) throw new Error(bundleError?.message || 'Failed to create bundle');

    // Create bundle items
    const bundleItems = book_ids.map((bookId: string, index: number) => ({
        bundle_id: newBundle.id,
        book_id: bookId,
        display_order: index + 1,
    }));

    const { error: itemsError } = await supabase.from('bundle_items').insert(bundleItems);

    if (itemsError) {
        await supabase.from('bundles').delete().eq('id', newBundle.id);
        throw new Error(itemsError.message);
    }

    return { bundle_id: newBundle.id, name: newBundle.name, message: 'Bundle published successfully' };
}

// ==================== MAIN HANDLER ====================

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify admin access for all marketing operations
    const adminCheck = await verifyAdmin(req);
    if (!adminCheck.isValid) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = getServiceClient();
    if (!supabase) {
        return res.status(501).json({ error: 'Supabase not configured' });
    }

    const { action, ...params } = req.body;

    if (!action) {
        return res.status(400).json({ error: 'Missing action parameter' });
    }

    try {
        let result: any;

        // Actions that need Gemini
        const aiActions = ['generate-featured-books', 'generate-bundle-campaign'];
        let ai: GoogleGenAI | null = null;

        if (aiActions.includes(action)) {
            const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
            if (!apiKey) {
                return res.status(501).json({ error: 'Gemini API key not configured' });
            }
            ai = new GoogleGenAI({ apiKey });
        }

        switch (action) {
            case 'generate-featured-books':
                result = await handleGenerateFeaturedBooks(ai!, supabase);
                break;
            case 'publish-featured-books':
                result = await handlePublishFeaturedBooks(supabase, params, adminCheck.userId);
                break;
            case 'generate-bundle-campaign':
                result = await handleGenerateBundleCampaign(ai!, supabase, params);
                break;
            case 'publish-bundle':
                result = await handlePublishBundle(supabase, params, adminCheck.userId);
                break;
            default:
                return res.status(400).json({ error: `Unknown action: ${action}` });
        }

        return res.status(200).json(result);

    } catch (error: any) {
        console.error(`Marketing ${action} Error:`, error);
        return res.status(500).json({
            error: 'Marketing operation failed',
            action,
            message: error.message
        });
    }
}
