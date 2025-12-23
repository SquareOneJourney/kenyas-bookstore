
/**
 * Stripe Browser Client
 * 
 * Client-side Stripe client for browser usage (Checkout, Elements, etc.)
 * Uses publishable key only - safe for client-side.
 * 
 * Environment variables required:
 *   VITE_STRIPE_PUBLISHABLE_KEY
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';
import { env, isStripeConfigured } from './env';

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get or create the Stripe browser client instance
 * 
 * Returns a promise that resolves to Stripe instance or null if not configured
 * This should only be called from client-side code
 */
export function getStripeBrowserClient(): Promise<Stripe | null> {
  if (!isStripeConfigured()) {
    return Promise.resolve(null);
  }

  if (!stripePromise && env.stripe.publishableKey) {
    stripePromise = loadStripe(env.stripe.publishableKey);
  }

  return stripePromise || Promise.resolve(null);
}

/**
 * Check if Stripe browser client is available
 */
export function isStripeBrowserAvailable(): boolean {
  return isStripeConfigured();
}

