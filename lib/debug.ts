
import { getSupabaseClient } from './supabaseClient';
import { env } from './env';
import { GoogleGenAI } from '@google/genai';

export const checkConnections = async () => {
    const results = {
        supabase: { status: 'pending', message: '' },
        gemini: { status: 'pending', message: '' }
    };

    // Check Supabase
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            results.supabase = { status: 'failed', message: 'Client not initialized (missing env vars?)' };
        } else {
            // Select id and title specifically to check access
            const { data, error } = await supabase.from('books').select('id, title').limit(1);
            if (error) {
                results.supabase = { status: 'failed', message: error.message };
            } else {
                results.supabase = { status: 'success', message: `Connected! Tables accessible.` };
            }
        }
    } catch (e: any) {
        results.supabase = { status: 'failed', message: e.message };
    }

    // Check Gemini
    try {
        if (!env.gemini.apiKey) {
            results.gemini = { status: 'failed', message: 'API Key missing' };
        } else {
            const ai = new GoogleGenAI({ apiKey: env.gemini.apiKey });
            const model = ai.models.get({ model: 'models/gemini-1.5-flash' }); // explicit get check
            // Actually try to generate a tiny string
            try {
                // @ts-ignore
                const resp = await ai.models.generateContent({
                    model: 'gemini-1.5-flash',
                    contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
                });
                results.gemini = { status: 'success', message: 'Generated content successfully' };
            } catch (genErr: any) {
                results.gemini = { status: 'failed', message: `Generation failed: ${genErr.message}` };
            }
        }
    } catch (e: any) {
        results.gemini = { status: 'failed', message: e.message };
    }

    return results;
};
