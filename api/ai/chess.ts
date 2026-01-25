import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

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
        const { type, pgn, userMove, difficultyPrompt } = req.body;

        const ai = new GoogleGenAI({ apiKey });

        let prompt: string;
        let responseSchema: any;

        if (type === 'reaction') {
            // Get AI reaction to user's move
            prompt = `You are Kenya, a friendly and encouraging chess partner. Your opponent (White) just made the move: ${userMove}. The game history is in PGN format.
${difficultyPrompt}

Your task is to provide a reaction to your opponent's move.

Your response must be a valid JSON object with one key:
1. "commentary": A short, sweet, genuine, and funny comment reacting to your opponent's move. Keep it under 25 words.

PGN:
${pgn}`;

            responseSchema = {
                type: Type.OBJECT,
                properties: {
                    commentary: { type: Type.STRING },
                },
            };

        } else if (type === 'move') {
            // Get AI's move
            prompt = `You are Kenya, a friendly and encouraging chess partner. It is your turn to play. Your color is black. The game history is in PGN format.
${difficultyPrompt}

Your response must be a valid JSON object with two keys:
1. "move": The best move in Standard Algebraic Notation (SAN) based on the difficulty. Do not include check (+) or checkmate (#) symbols.
2. "commentary": A short, sweet, genuine, and funny comment about your move or the game state. Keep it under 25 words.

PGN:
${pgn}`;

            responseSchema = {
                type: Type.OBJECT,
                properties: {
                    move: { type: Type.STRING },
                    commentary: { type: Type.STRING },
                },
            };

        } else {
            return res.status(400).json({ error: 'Invalid type. Must be "reaction" or "move"' });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
            },
        });

        const jsonText = response.text?.replace(/```json|```/g, '').trim() || '{}';
        const aiResponse = JSON.parse(jsonText);

        return res.status(200).json(aiResponse);

    } catch (error: any) {
        console.error('Chess AI Error:', error);
        return res.status(500).json({
            error: 'AI generation failed',
            message: error.message
        });
    }
}
