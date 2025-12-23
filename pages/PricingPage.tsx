
import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Pricing Page - Structure Only
 * 
 * TODO: Add pricing information if applicable:
 * - Subscription plans (if any)
 * - Membership benefits
 * - Bulk pricing
 * - Special offers
 */
const PricingPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-serif text-4xl font-bold text-deep-blue mb-8">Pricing</h1>
      
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <p className="text-gray-600 mb-4">
          Pricing information coming soon. Browse our <Link to="/catalog" className="text-forest underline">catalog</Link> to see individual book prices.
        </p>
      </div>
    </div>
  );
};

export default PricingPage;

