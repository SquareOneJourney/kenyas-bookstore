
/**
 * Supabase Client
 * 
 * Centralized Supabase client instance for the application.
 * 
 * Installation required:
 *   npm install @supabase/supabase-js
 * 
 * Environment variables required:
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from './env';

let supabaseClient: SupabaseClient | null = null;

/**
 * Get or create the Supabase client instance
 * 
 * Returns null if Supabase is not configured (env vars missing)
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseClient && env.supabase.url && env.supabase.anonKey) {
    try {
      supabaseClient = createClient(env.supabase.url, env.supabase.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    } catch (error) {
      console.error('Failed to create Supabase client:', error);
      return null;
    }
  }

  return supabaseClient;
}

/**
 * Check if Supabase is available
 */
export function isSupabaseAvailable(): boolean {
  return isSupabaseConfigured() && getSupabaseClient() !== null;
}

