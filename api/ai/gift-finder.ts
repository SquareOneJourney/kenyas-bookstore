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
        const { catalog, user_preferences, web_context_ok } = req.body;

        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
            Role

            You are Kenya, the mindful owner of a small online bookstore. Your job is to help people find the right book as a gift, drawing on (a) the user's answers (recipient, mood, genres, budget), (b) the store's local catalog (provided at runtime), and (c) reputable web sources for context (awards lists, notable reviews, author interviews, year-end lists). You must always prefer in-stock catalog items and clearly mark when a great match is out-of-stock (offer an in-stock alternative).

            Goals

            - Suggest 3–6 strong book matches from the catalog ranked by fit.
            - For each pick, add a short, warm, Kenya-style note that explains why it fits the recipient & mood.
            - Propose optional pairings (gift add-ons, mini "kits") based on themes/mood.
            - When you use web information, your citations will be automatically collected by the system.
            - Output in the JSON schema provided. Keep copy concise and readable in UI cards.

            Voice & Tone (Kenya)

            - Mindful, calm, human: "Let's find something that truly resonates."
            - Brief, confident guidance. Avoid jargon. No hype, no pushiness.
            - Never overwhelm—explain why succinctly.

            Inputs
            - catalog: ${JSON.stringify(catalog)}
            - user_preferences: ${JSON.stringify(user_preferences)}
            - web_context_ok: ${web_context_ok}

            Tools & Behaviors

            - If web_context_ok = true, use the web tool to search briefly for context that improves confidence (e.g., recent awards, critic praise, similar-book clusters).
            - Never recommend a title that isn't in the catalog.
            - If inventory <= 0, set isOutOfStock: true and provide an in-stock alternative from the catalog.
            - Respect budget. If constraints are very tight, include a quick "Refine filters" message in the 'refineFiltersMessage' field.
            - Ranking heuristic (explain briefly in reasoning for each pick): 1) Mood & theme fit; 2) Recipient fit (audience, content); 3) In-stock & budget; 4) Recent acclaim (with citations).

            Your entire output must be a single, valid JSON object that adheres to the schema provided in the 'config' of this request. Do not include any text outside of the JSON object.
        `;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                recommendations: {
                    type: Type.ARRAY,
                    description: "An array of 3-6 recommended books, ranked by relevance.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING, description: "The exact title of the book from the catalog." },
                            author: { type: Type.STRING, description: "The exact author of the book from the catalog." },
                            kenyaNote: { type: Type.STRING, description: "A short, warm, Kenya-style note explaining why it's a good fit." },
                            isOutOfStock: { type: Type.BOOLEAN, description: "Set to true if the book's inventory is 0." },
                            inStockAlternative: {
                                type: Type.OBJECT,
                                description: "An in-stock alternative if the primary recommendation is out of stock. Optional.",
                                properties: {
                                    title: { type: Type.STRING, description: "The title of the alternative book." },
                                    author: { type: Type.STRING, description: "The author of the alternative book." },
                                }
                            }
                        },
                        required: ["title", "author", "kenyaNote", "isOutOfStock"]
                    }
                },
                optionalPairings: {
                    type: Type.ARRAY,
                    description: "An array of 1-2 optional gift pairings or mini-kits based on themes.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            theme: { type: Type.STRING, description: "The theme of the pairing, e.g., 'A Cozy Reading Night'." },
                            items: {
                                type: Type.ARRAY,
                                description: "A list of items for the gift kit.",
                                items: { type: Type.STRING }
                            }
                        },
                        required: ["theme", "items"]
                    }
                },
                refineFiltersMessage: {
                    type: Type.STRING,
                    description: "A brief message to the user if their filters are too restrictive. Optional."
                }
            },
            required: ["recommendations"]
        };

        const genAIConfig: any = {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
        };

        if (web_context_ok) {
            genAIConfig.tools = [{ googleSearch: {} }];
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: genAIConfig
        });

        const text = response.text?.replace(/```json|```/g, '').trim() || '';
        const parsedResponse = JSON.parse(text);

        // Extract grounding metadata if available
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        let citations: { uri: string; title: string }[] = [];
        if (groundingChunks) {
            citations = groundingChunks
                .filter((chunk: any) => chunk.web)
                .map((chunk: any) => ({
                    uri: chunk.web.uri,
                    title: chunk.web.title
                }));
        }

        return res.status(200).json({
            ...parsedResponse,
            citations
        });

    } catch (error: any) {
        console.error('Gift Finder AI Error:', error);
        return res.status(500).json({
            error: 'AI generation failed',
            message: error.message
        });
    }
}
