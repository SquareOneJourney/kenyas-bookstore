
import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Privacy Policy Page - Structure Only
 * 
 * TODO: Add actual privacy policy content covering:
 * - Data collection practices
 * - How data is used
 * - Data sharing policies
 * - User rights (GDPR/CCPA compliance if applicable)
 * - Cookie usage
 * - Contact information for privacy concerns
 */
const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-serif text-4xl font-bold text-deep-blue mb-8">Privacy Policy</h1>
      
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <p className="text-gray-600 mb-4">
          Privacy policy content coming soon. This page will outline how Kenya's Bookstore collects, uses, and protects your personal information.
        </p>
        
        <div className="mt-8 pt-6 border-t">
          <p className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            For questions about our privacy practices, please <Link to="/contact" className="text-forest underline">contact us</Link>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;

