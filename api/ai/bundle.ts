import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

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

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        return res.status(501).json({ error: 'Gemini API key not configured' });
    }

    try {
        const { books } = req.body;

        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
            I want to sell these specific books as a "Curated Bundle" or "Mystery Box".
            Books: ${books.map((b: any) => `"${b.title}" by ${b.author} (${b.genre})`).join(', ')}
            
            Create a marketing campaign for this bundle. Return JSON:
            {
                "name": "Creative catchy name for the bundle",
                "description": "2 sentences selling the 'vibe' of this combination."
            }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        const text = response.text?.replace(/```json|```/g, '').trim() || '{}';
        const data = JSON.parse(text);

        return res.status(200).json(data);

    } catch (error: any) {
        console.error('Bundle AI Error:', error);
        return res.status(500).json({
            error: 'AI generation failed',
            message: error.message
        });
    }
}
