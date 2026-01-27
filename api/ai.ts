/**
 * Unified AI Endpoint
 * 
 * Consolidates all AI operations into a single serverless function.
 * Uses "action" parameter to route to different AI operations.
 * 
 * POST /api/ai
 * Body: { action: string, ...params }
 * 
 * Actions:
 *   - analyze: Book analysis (identify, analyze, enrich)
 *   - scan: ISBN barcode scanning from image
 *   - chat: Chat with Kenya assistant
 *   - gift-finder: Gift recommendations
 *   - chess: Chess game AI (reaction, move)
 *   - donation: Donation recommendations and notes
 *   - bundle: Marketing bundle name generation
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

// CORS headers helper
function setCorsHeaders(res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Get API key helper
function getApiKey(): string | null {
    return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
}

// ==================== ACTION HANDLERS ====================

async function handleAnalyze(ai: GoogleGenAI, body: any) {
    const { type, payload } = body;
    const baseInstruction = "Return ONLY a valid JSON object. Do not include markdown code blocks (```json). Do not include any explanations.";

    let prompt = '';
    if (type === 'identify') {
        prompt = `Identify this book: "${payload.query}". Return ONLY a JSON object: {"title": "string", "author": "string"}. ${baseInstruction}`;
    } else if (type === 'analyze') {
        prompt = `You are a pricing assistant for "Kenya's Bookstore", a small independent bookstore selling standard retail book copies (NOT rare, collectible, or first editions).

Context:
- Title: "${payload.title}"
- Author: "${payload.author}"
- Format: ${payload.format || 'paperback'}
- Condition: ${payload.condition || 'New or Like New'}

IMPORTANT PRICING GUIDELINES:
- This is a REGULAR retail bookstore, not a rare book dealer
- Most mass market paperbacks: $8-$15
- Trade paperbacks: $12-$20
- New hardcovers: $20-$35
- Used books: 30-50% off retail
- The suggested price should NEVER exceed $50 unless it's a large art book or textbook
- Classic novels like Jurassic Park, fiction bestsellers, etc. should be $10-$20

Return ONLY a JSON object:
{"suggested_price": number, "rationale": string, "target_audience": string, "marketing_angles": ["string", "string"]}
${baseInstruction}`;
    } else if (type === 'enrich') {
        prompt = `I have a book: "${payload.title}" by "${payload.author}".
        Return ONLY a JSON object with: 
        {"description": "2-sentence marketing hook", "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"], "price": 19.99}
        ${baseInstruction}`;
    } else {
        throw new Error('Invalid analysis type');
    }

    const result = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    let text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
}

async function handleScan(ai: GoogleGenAI, body: any) {
    const { image } = body;
    if (!image) throw new Error('No image data provided');

    const prompt = "Identify the ISBN-13 (starts with 978 or 979) or ISBN-10 on this book. It is usually on the back cover with a barcode. Return ONLY the digits of the ISBN. If there are other numbers (like prices headers), IGNORE them. Return just the raw 10 or 13 digits.";

    const result = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{
            role: 'user',
            parts: [
                { text: prompt },
                { inlineData: { mimeType: 'image/jpeg', data: image } }
            ]
        }]
    });

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    const cleaned = text.replace(/[^0-9X]/gi, '');

    if (cleaned.length >= 10) {
        return { code: cleaned };
    } else {
        return { error: 'No valid ISBN found', raw: text };
    }
}

async function handleChat(ai: GoogleGenAI, body: any) {
    const { message, catalogContext } = body;

    const chat = ai.chats.create({
        model: 'gemini-2.0-flash',
        config: {
            systemInstruction: `You are Kenya, the warm, literate, and helpful owner of "Kenya's Bookstore".
            Your Role:
            - Assist customers in finding books from the store's catalog.
            - Provide recommendations based on mood, genre, or interests.
            - Answer general questions about literature.
            Store Catalog: ${catalogContext}
            Guidelines:
            - Tone: Friendly, calm, knowledgeable, slightly sophisticated but accessible.
            - Keep responses concise (2-4 sentences).
            - Do not invent books that don't exist.`,
        }
    });

    const result = await chat.sendMessage({ message });
    return { text: result.text };
}

async function handleGiftFinder(ai: GoogleGenAI, body: any) {
    const { catalog, user_preferences, web_context_ok } = body;

    const prompt = `Role: You are Kenya, the mindful, warm, and highly literate owner of a small, independent online bookstore called "Kenya's Bookstore."
    
    Task: Use your deep knowledge of literature and the provided store catalog to recommend the perfect gift for a customer based on their preferences.
    
    Input Context:
    1. **Store Catalog** (Available Inventory):
    ${JSON.stringify(catalog)}
    
    2. **Customer Preferences**:
    ${JSON.stringify(user_preferences)}
    
    3. **Web Context Allowed**: ${web_context_ok}
    
    Guidelines:
    - **Tone**: Warm, personal, encouraging, and sophisticated but accessible. Use phrases like "I think you'd love...", "This is a hidden gem...", "For a cozy afternoon...".
    - **Priority**: ALWAYS prioritize books from the **Store Catalog** if they match the vibe.
    - **Out of Stock/External**: If the catalog has nothing suitable, and Web Context is Allowed, you may recommend a perfect book from the wider world. Mark it as "isOutOfStock": true.
    - **Selection**: Choose 3-5 distinct recommendations.
    
    Output Format:
    Return a strictly valid JSON object with the following structure. Do NOT use markdown code blocks.
    {
      "recommendations": [
        {
          "title": "Exact Title",
          "author": "Author Name",
          "kenyaNote": "A warm, 2-sentence personal note explaining why this specific book fits their mood/need.",
          "isOutOfStock": boolean,  // true if not in the catalog provided
          "inStockAlternative": { "title": "...", "author": "..." } // Optional: if the main rec is out of stock, suggest a similar in-stock book
        }
      ],
      "optionalPairings": [
        { "theme": "Cozy Night In", "items": ["Tea", "Weighted Blanket"] }
      ],
      "refineFiltersMessage": "Optional question if the request was too vague."
    }`;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            recommendations: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        author: { type: Type.STRING },
                        kenyaNote: { type: Type.STRING },
                        isOutOfStock: { type: Type.BOOLEAN },
                        inStockAlternative: {
                            type: Type.OBJECT,
                            properties: { title: { type: Type.STRING }, author: { type: Type.STRING } }
                        }
                    },
                    required: ["title", "author", "kenyaNote", "isOutOfStock"]
                }
            },
            optionalPairings: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        theme: { type: Type.STRING },
                        items: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            },
            refineFiltersMessage: { type: Type.STRING }
        },
        required: ["recommendations"]
    };

    const config: any = {};

    // Controlled generation (responseSchema/MimeType) is NOT supported with Search tool in Gemini 2.0 Flash
    if (web_context_ok) {
        config.tools = [{ googleSearch: {} }];
        // We rely on the prompt to enforce JSON structure when search is enabled
    } else {
        config.responseMimeType = 'application/json';
        config.responseSchema = responseSchema;
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config
    });

    const text = response.text?.replace(/```json|```/g, '').trim() || '{}';
    let parsed: any = {};

    try {
        parsed = JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse JSON from AI Gift Finder:", text);
        return { recommendations: [], refineFiltersMessage: "I'm having a little trouble finding the right book. Could you tell me more about what you're looking for?" };
    }

    // Extract citations if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
        parsed.citations = groundingChunks
            .filter((chunk: any) => chunk.web)
            .map((chunk: any) => ({ uri: chunk.web.uri, title: chunk.web.title }));
    }

    return parsed;
}

async function handleChess(ai: GoogleGenAI, body: any) {
    const { type, pgn, userMove, difficultyPrompt } = body;

    let prompt: string;
    let responseSchema: any;

    if (type === 'reaction') {
        prompt = `You are Kenya, a friendly chess partner. Your opponent just made: ${userMove}. PGN: ${pgn}
        ${difficultyPrompt}
        Return JSON: {"commentary": "short funny comment under 25 words"}`;
        responseSchema = { type: Type.OBJECT, properties: { commentary: { type: Type.STRING } } };
    } else if (type === 'move') {
        prompt = `You are Kenya playing black. PGN: ${pgn}
        ${difficultyPrompt}
        Return JSON: {"move": "SAN notation", "commentary": "short comment"}`;
        responseSchema = { type: Type.OBJECT, properties: { move: { type: Type.STRING }, commentary: { type: Type.STRING } } };
    } else {
        throw new Error('Invalid chess type');
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', responseSchema }
    });

    const text = response.text?.replace(/```json|```/g, '').trim() || '{}';
    return JSON.parse(text);
}

async function handleDonation(ai: GoogleGenAI, body: any) {
    const { type, wish, library, selectedBook } = body;

    let prompt: string;
    if (type === 'recommendations') {
        prompt = `You are a compassionate bookseller helping a donor choose a book for a ${wish.age}-year-old interested in "${wish.interests}" with theme: "${wish.theme}".
        Library: ${JSON.stringify(library)}
        Return JSON: {"recommendations": [{"title": "...", "author": "..."}]} with 3 books.`;
    } else if (type === 'note') {
        prompt = `Write a short encouraging message (2-3 sentences) to a ${wish.age}-year-old receiving "${selectedBook.title}". Be warm and supportive.`;
    } else {
        throw new Error('Invalid donation type');
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt
    });

    const text = response.text?.replace(/```json|```/g, '').trim() || '';
    return type === 'recommendations' ? JSON.parse(text) : { note: text };
}

async function handleBundle(ai: GoogleGenAI, body: any) {
    const { books } = body;

    const prompt = `Create a marketing campaign for a book bundle:
    Books: ${books.map((b: any) => `"${b.title}" by ${b.author} (${b.genre})`).join(', ')}
    Return JSON: {"name": "catchy bundle name", "description": "2 sentences selling the vibe"}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });

    const text = response.text?.replace(/```json|```/g, '').trim() || '{}';
    return JSON.parse(text);
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

    const apiKey = getApiKey();
    if (!apiKey) {
        return res.status(501).json({ error: 'Gemini API key not configured' });
    }

    const { action, ...params } = req.body;

    if (!action) {
        return res.status(400).json({ error: 'Missing action parameter' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        let result: any;

        switch (action) {
            case 'analyze':
                result = await handleAnalyze(ai, params);
                break;
            case 'scan':
                result = await handleScan(ai, params);
                break;
            case 'chat':
                result = await handleChat(ai, params);
                break;
            case 'gift-finder':
                result = await handleGiftFinder(ai, params);
                break;
            case 'chess':
                result = await handleChess(ai, params);
                break;
            case 'donation':
                result = await handleDonation(ai, params);
                break;
            case 'bundle':
                result = await handleBundle(ai, params);
                break;
            default:
                return res.status(400).json({ error: `Unknown action: ${action}` });
        }

        return res.status(200).json(result);

    } catch (error: any) {
        console.error(`AI ${action} Error:`, error);
        return res.status(500).json({
            error: 'AI operation failed',
            action,
            message: error.message
        });
    }
}
