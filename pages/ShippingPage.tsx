
import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Shipping Policy Page - Structure Only
 * 
 * NOTE: This is a placeholder. No shipping promises are made.
 * Actual shipping policy should be determined by business requirements.
 * 
 * TODO: Add actual shipping policy content covering:
 * - Shipping methods and timeframes
 * - Shipping costs
 * - International shipping (if applicable)
 * - Delivery areas
 * - Tracking information
 * - Shipping delays and issues
 */
const ShippingPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-serif text-4xl font-bold text-deep-blue mb-8">Shipping Policy</h1>
      
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <p className="text-gray-600 mb-4">
          Shipping policy content coming soon. This page will outline our shipping methods, timeframes, and costs.
        </p>
        
        <div className="mt-8 pt-6 border-t">
          <p className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            For shipping questions, please <Link to="/contact" className="text-forest underline">contact us</Link>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShippingPage;

