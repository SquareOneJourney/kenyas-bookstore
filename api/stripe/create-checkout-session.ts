
/**
 * Stripe Checkout Session Creation Endpoint
 * 
 * Creates a Stripe Checkout session for one-time payments or subscriptions.
 * 
 * POST /api/stripe/create-checkout-session
 * 
 * Body:
 *   - priceId: string (Stripe Price ID)
 *   - mode: 'payment' | 'subscription'
 *   - successUrl: string
 *   - cancelUrl: string
 * 
 * Returns:
 *   - sessionId: string (if Stripe is configured)
 *   - error: string (if not configured or error occurred)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStripeServerClient } from '../../lib/stripeClient';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeClient = getStripeServerClient();

  if (!stripeClient) {
    return res.status(501).json({
      error: 'Stripe is not configured',
      message: 'STRIPE_SECRET_KEY environment variable is not set',
    });
  }

  try {
    const { priceId, mode = 'payment', successUrl, cancelUrl } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'priceId is required' });
    }

    const siteUrl = process.env.VITE_SITE_URL || 'http://localhost:5173';

    const session = await stripeClient.checkout.sessions.create({
      mode,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${siteUrl}/account?success=true`,
      cancel_url: cancelUrl || `${siteUrl}/pricing`,
    });

    return res.status(200).json({ sessionId: session.id });
  } catch (error: any) {
    console.error('Stripe checkout session error:', error);
    return res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message,
    });
  }
}

