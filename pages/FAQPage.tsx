
import React from 'react';
import { Link } from 'react-router-dom';

/**
 * FAQ Page - Structure Only
 * 
 * TODO: Add actual FAQ content covering common questions about:
 * - Ordering process
 * - Payment methods
 * - Shipping and delivery
 * - Returns and refunds
 * - Account management
 * - Book availability
 */
const FAQPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-serif text-4xl font-bold text-deep-blue mb-8">Frequently Asked Questions</h1>
      
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <p className="text-gray-600 mb-4">
          FAQ content coming soon. This page will answer common questions about shopping at Kenya's Bookstore.
        </p>
        
        <div className="mt-8 pt-6 border-t">
          <p className="text-sm text-gray-500">
            Can't find what you're looking for? <Link to="/contact" className="text-forest underline">Contact us</Link> and we'll be happy to help.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;

