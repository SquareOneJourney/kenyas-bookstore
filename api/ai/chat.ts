
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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(501).json({ error: 'Gemini API key not configured' });
    }

    const { message, history, catalogContext } = req.body;

    try {
        const ai = new GoogleGenAI({
            apiKey,
            apiVersion: 'v1'
        });

        const chat = ai.chats.create({
            model: 'gemini-1.5-flash-latest',
            config: {
                systemInstruction: `You are Kenya, the warm, literate, and helpful owner of "Kenya's Bookstore".
        
        Your Role:
        - Assist customers in finding books from the store's catalog.
        - Provide recommendations based on mood, genre, or interests.
        - Answer general questions about literature.
        
        Store Catalog (Use this to know what is in stock):
        ${catalogContext}
        
        Guidelines:
        - Tone: Friendly, calm, knowledgeable, slightly sophisticated but accessible (think "cozy library").
        - If a user asks for a recommendation, prioritize books listed in the catalog above.
        - If a user asks for a book NOT in the catalog, you can discuss it but gently mention that you don't currently have it in stock.
        - Keep responses concise (2-4 sentences) as this is a chat interface.
        - Do not invent books that don't exist.
        `,
            }
        });

        // Note: The simple chat context helper might not support full history easily in this stateless function
        // For now, we just send the message. If history is needed, we'd need to reconstruct the parts.
        const result = await chat.sendMessage({ message });

        return res.status(200).json({ text: result.text });

    } catch (error: any) {
        console.error('Chat AI Error:', error);
        return res.status(500).json({
            error: 'Chat failed',
            message: error.message
        });
    }
}
