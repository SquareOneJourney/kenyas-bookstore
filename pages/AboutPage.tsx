
import React from 'react';

/**
 * About Page - Structure Only
 * 
 * TODO: Add content about:
 * - Store mission and values
 * - Owner/curator background (Kenya)
 * - Why this bookstore exists
 * - Community involvement
 * - Trust signals (years in business, customer testimonials, etc.)
 */
const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-serif text-4xl font-bold text-deep-blue mb-8">About Kenya's Bookstore</h1>
      
      <div className="bg-white p-8 rounded-lg shadow-lg">
        {/* TODO: Replace with actual content */}
        <p className="text-gray-600 mb-4">
          Content coming soon. This page will tell the story of Kenya's Bookstore and build trust with customers.
        </p>
        
        {/* TODO: Add sections for:
            - Our Story
            - Our Mission
            - Why We Do This
            - Contact Information (link to Contact page)
        */}
      </div>
    </div>
  );
};

export default AboutPage;

