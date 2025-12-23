
import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Terms of Service Page - Structure Only
 * 
 * TODO: Add actual terms of service content covering:
 * - User agreement
 * - Acceptable use policy
 * - Intellectual property rights
 * - Limitation of liability
 * - Dispute resolution
 * - Governing law
 */
const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-serif text-4xl font-bold text-deep-blue mb-8">Terms of Service</h1>
      
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <p className="text-gray-600 mb-4">
          Terms of service content coming soon. This page will outline the terms and conditions for using Kenya's Bookstore.
        </p>
        
        <div className="mt-8 pt-6 border-t">
          <p className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            For questions about our terms, please <Link to="/contact" className="text-forest underline">contact us</Link>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;

