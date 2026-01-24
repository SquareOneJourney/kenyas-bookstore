
/**
 * Stripe Server Client
 * 
 * Server-side Stripe client for API routes.
 * NEVER import this in client-side code.
 * 
 * Environment variables required:
 *   STRIPE_SECRET_KEY (server-side only)
 */

import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

/**
 * Get or create the Stripe server client instance
 * 
 * Returns null if Stripe secret key is not configured
 * This should only be called from server-side code (API routes)
 */
export function getStripeServerClient(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return null;
  }

  if (!stripeClient) {
    try {
      stripeClient = new Stripe(secretKey, {
        apiVersion: '2023-10-16',
      });
    } catch (error) {
      console.error('Failed to create Stripe server client:', error);
      return null;
    }
  }

  return stripeClient;
}

/**
 * Check if Stripe server client is available
 */
export function isStripeServerAvailable(): boolean {
  return getStripeServerClient() !== null;
}

