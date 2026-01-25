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

    const { type, payload } = req.body;

    try {
        const ai = new GoogleGenAI({ apiKey });

        let prompt = '';
        const baseInstruction = "Return ONLY a valid JSON object. Do not include markdown code blocks (```json). Do not include any explanations.";

        if (type === 'identify') {
            prompt = `Identify this book: "${payload.query}". Return ONLY a JSON object: {"title": "string", "author": "string"}. ${baseInstruction}`;
        } else if (type === 'analyze') {
            prompt = `
        Analyze this book for "Kenya's Bookstore":
        Title: "${payload.title}"
        Author: "${payload.author}"
        Format: ${payload.format || 'paperback'}

        Return ONLY a JSON object:
        {
          "suggested_price": number,
          "rationale": string,
          "target_audience": string,
          "marketing_angles": ["string", "string"]
        }
        ${baseInstruction}
      `;
        } else if (type === 'enrich') {
            prompt = `
        I have a book: "${payload.title}" by "${payload.author}".
        Return ONLY a JSON object with: 
        {
          "description": "2-sentence marketing hook",
          "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
          "price": 19.99
        }
        ${baseInstruction}
      `;
        } else {
            return res.status(400).json({ error: 'Invalid analysis type' });
        }

        // We use gemini-2.0-flash (proven to work)
        // We REMOVE the generationConfig/responseMimeType to avoid API errors
        // We rely on the prompt to enforce JSON
        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });

        // Parse response safely using the new SDK structure
        let text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // Manual cleanup to remove Markdown code blocks if the model ignores our instruction
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return res.status(200).json(JSON.parse(text));

    } catch (error: any) {
        console.error('AI Analyze Error:', error);
        return res.status(500).json({
            error: 'AI generation failed',
            message: error.message
        });
    }
}
