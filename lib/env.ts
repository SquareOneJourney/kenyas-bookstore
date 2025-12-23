
/**
 * Environment variable validation and access
 * 
 * Validates required environment variables at startup and provides
 * safe access to configuration values.
 */

interface EnvConfig {
  siteUrl: string;
  supabase: {
    url: string | null;
    anonKey: string | null;
  };
  stripe: {
    publishableKey: string | null;
    secretKey: string | null;
    webhookSecret: string | null;
  };
  gemini: {
    apiKey: string | null;
  };
}

/**
 * Validates environment variables and returns configuration
 * 
 * In development: warns about missing vars but doesn't crash
 * In production: only fails for truly critical vars
 */
function validateEnv(): EnvConfig {
  const isDev = import.meta.env.DEV;
  const isProd = import.meta.env.PROD;

  const config: EnvConfig = {
    siteUrl: import.meta.env.VITE_SITE_URL || 'http://localhost:5173',
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL || null,
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || null,
    },
    stripe: {
      publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || null,
      secretKey: null, // Server-side only, not available in client
      webhookSecret: null, // Server-side only, not available in client
    },
    gemini: {
      apiKey: import.meta.env.GEMINI_API_KEY || null,
    },
  };

  // Development warnings
  if (isDev) {
    if (!config.supabase.url) {
      console.warn('⚠️  VITE_SUPABASE_URL is not set. Supabase features will be disabled.');
    }
    if (!config.supabase.anonKey) {
      console.warn('⚠️  VITE_SUPABASE_ANON_KEY is not set. Supabase features will be disabled.');
    }
    if (!config.stripe.publishableKey) {
      console.warn('⚠️  VITE_STRIPE_PUBLISHABLE_KEY is not set. Stripe features will be disabled.');
    }
    if (!config.gemini.apiKey) {
      console.warn('⚠️  GEMINI_API_KEY is not set. AI features will be disabled.');
    }
  }

  // Production: only fail for critical vars if they're actually needed
  // (This is handled at runtime when features are used, not here)

  return config;
}

export const env = validateEnv();

/**
 * Check if Supabase is configured
 */
export const isSupabaseConfigured = (): boolean => {
  return !!(env.supabase.url && env.supabase.anonKey);
};

/**
 * Check if Stripe is configured (client-side)
 */
export const isStripeConfigured = (): boolean => {
  return !!env.stripe.publishableKey;
};

/**
 * Check if Gemini is configured
 */
export const isGeminiConfigured = (): boolean => {
  return !!env.gemini.apiKey;
};

