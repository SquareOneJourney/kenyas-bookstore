
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { isStripeConfigured } from '../lib/env';

/**
 * Account Billing Page
 * 
 * Placeholder for subscription/billing management.
 * Shows "Coming soon" if Stripe is not configured.
 */
const AccountBillingPage: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleManageSubscription = async () => {
    if (!isStripeConfigured()) {
      alert('Stripe is not configured. Please contact support.');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement customer portal session creation
      // const response = await fetch('/api/createCustomerPortalSession', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ customerId: 'customer_id_here' }),
      // });
      // const { url } = await response.json();
      // window.location.href = url;
      alert('Subscription management coming soon.');
    } catch (error) {
      console.error('Failed to open customer portal:', error);
      alert('Failed to open subscription management. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-serif text-4xl font-bold text-deep-blue mb-6">Billing & Subscription</h1>

      <div className="bg-white p-8 rounded-lg shadow-lg">
        {!isStripeConfigured() ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Billing features are not yet configured.
            </p>
            <p className="text-sm text-gray-500">
              Please contact support for billing inquiries.
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Manage Subscription</h2>
            <p className="text-gray-600 mb-6">
              Update your payment method, view billing history, or cancel your subscription.
            </p>
            <Button
              onClick={handleManageSubscription}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Manage Subscription'}
            </Button>
            <p className="text-xs text-gray-500 mt-4">
              Note: Subscription management is coming soon. For now, please contact support.
            </p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t">
          <Link to="/account" className="text-sm text-forest underline">
            ← Back to Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccountBillingPage;

