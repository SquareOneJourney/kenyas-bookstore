
/**
 * Stripe Webhook Endpoint
 * 
 * Handles Stripe webhook events (payment confirmations, subscription updates, etc.)
 * 
 * POST /api/stripe/webhook
 * 
 * Verifies webhook signature if STRIPE_WEBHOOK_SECRET is set.
 * Returns 501 if not configured.
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
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeClient || !webhookSecret) {
    return res.status(501).json({
      error: 'Stripe webhook is not configured',
      message: 'STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET environment variables are required',
    });
  }

  try {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    // Verify webhook signature
    const event = stripeClient.webhooks.constructEvent(
      req.body,
      signature,
      webhookSecret
    );

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        // Handle successful checkout
        // TODO: Update order status, send confirmation email, etc.
        console.log('Checkout session completed:', event.data.object);
        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // Handle subscription changes
        // TODO: Update user subscription status in database
        console.log('Subscription updated:', event.data.object);
        break;

      case 'payment_intent.succeeded':
        // Handle successful payment
        // TODO: Update order status, fulfill order, etc.
        console.log('Payment succeeded:', event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Stripe webhook error:', error);
    return res.status(400).json({
      error: 'Webhook verification failed',
      message: error.message,
    });
  }
}

