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
        const { type, wish, library, selectedBook } = req.body;

        const ai = new GoogleGenAI({ apiKey });

        let prompt: string;

        if (type === 'recommendations') {
            // Get book recommendations for a wish
            prompt = `
                You are a compassionate bookseller helping a donor choose a book for a child.
                The request is for a ${wish.age}-year-old who is interested in "${wish.interests}" and needs a book with the theme: "${wish.theme}".
                
                From the following library, please recommend the 3 most suitable, age-appropriate books.
                Library: ${JSON.stringify(library)}

                Provide your response as a valid JSON object with a single key "recommendations" which is an array of objects. Each object must have "title" and "author" keys that exactly match the library data.
            `;

        } else if (type === 'note') {
            // Generate a suggestion for donor note
            prompt = `
                Write a short, anonymous, encouraging message (2-3 sentences) to a ${wish.age}-year-old child who will receive the book "${selectedBook.title}". The message should be warm, supportive, and reflect the book's positive themes.
                The child's interests are "${wish.interests}" and the requested theme was "${wish.theme}".
            `;

        } else {
            return res.status(400).json({ error: 'Invalid type. Must be "recommendations" or "note"' });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
        });

        const text = response.text?.replace(/```json|```/g, '').trim() || '';

        if (type === 'recommendations') {
            return res.status(200).json(JSON.parse(text));
        } else {
            return res.status(200).json({ note: text });
        }

    } catch (error: any) {
        console.error('Donation AI Error:', error);
        return res.status(500).json({
            error: 'AI generation failed',
            message: error.message
        });
    }
}
