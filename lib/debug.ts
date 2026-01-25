
import { getSupabaseClient } from './supabaseClient';
import { env } from './env';

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
            // Actually try to generate a tiny string via API
            try {
                const response = await fetch('/api/ai/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'identify', payload: { query: 'Hello' } })
                });

                if (response.ok) {
                    results.gemini = { status: 'success', message: 'API responded successfully' };
                } else {
                    const error = await response.json();
                    results.gemini = { status: 'failed', message: `API Error: ${error.message || response.statusText}` };
                }
            } catch (genErr: any) {
                results.gemini = { status: 'failed', message: `Generation failed: ${genErr.message}` };
            }
        }
    } catch (e: any) {
        results.gemini = { status: 'failed', message: e.message };
    }

    return results;
};
