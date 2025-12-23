
/**
 * Stripe Customer Portal Session Creation Endpoint
 * 
 * Creates a Stripe Customer Portal session for managing subscriptions.
 * 
 * POST /api/stripe/create-portal-session
 * 
 * Body:
 *   - customerId: string (Stripe Customer ID)
 *   - returnUrl: string
 * 
 * Returns:
 *   - url: string (portal URL if Stripe is configured)
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
    const { customerId, returnUrl } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'customerId is required' });
    }

    const siteUrl = process.env.VITE_SITE_URL || 'http://localhost:5173';

    const session = await stripeClient.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${siteUrl}/account/billing`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe customer portal error:', error);
    return res.status(500).json({
      error: 'Failed to create customer portal session',
      message: error.message,
    });
  }
}

