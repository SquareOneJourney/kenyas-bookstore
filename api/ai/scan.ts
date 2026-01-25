import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Server-side environment access (Secure)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: No Gemini API Key' });
    }

    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'No image data provided' });
        }

        const ai = new GoogleGenAI({ apiKey });

        const prompt = "Locate the barcode on this book cover. Read the ISBN-13 number (starts with 978 or 979) or the ISBN-10 number. Return ONLY the digits of the number, nothing else. If there are dashes, remove them.";

        // Use 'gemini-1.5-flash-latest' which is generally more stable across SDK versions
        const result = await ai.models.generateContent({
            model: 'gemini-1.5-flash-latest',
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: 'image/jpeg',
                                data: image
                            }
                        }
                    ]
                }
            ]
        });

        // Safe response parsing 
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        const cleaned = text.replace(/[^0-9X]/gi, '');

        if (cleaned.length >= 10) {
            return res.status(200).json({ code: cleaned });
        } else {
            console.warn("Gemini could not find ISBN. Response was:", text);
            return res.status(404).json({ error: 'No valid ISBN found', raw: text });
        }

    } catch (error: any) {
        console.error('Gemini Scan API Error:', error);
        return res.status(500).json({
            error: 'AI Scan failed',
            details: error.message
        });
    }
}
