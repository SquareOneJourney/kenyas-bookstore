
import React from 'react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

/**
 * Contact Page - Structure Only
 * 
 * TODO: Add content about:
 * - Store address (if physical location exists)
 * - Email address
 * - Phone number (if applicable)
 * - Business hours
 * - Response time expectations
 * - Preferred contact method for different inquiries
 */
const ContactPage: React.FC = () => {
  // TODO: Implement form submission handler (connect to email service or backend)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement contact form submission
    console.log('Contact form submitted');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-serif text-4xl font-bold text-deep-blue mb-8">Contact Us</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Information Section */}
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-6">Get in Touch</h2>
          
          {/* TODO: Replace placeholder content with actual contact information */}
          <div className="space-y-4 text-gray-700">
            <div>
              <p className="font-semibold text-deep-blue">Email</p>
              <p className="text-gray-600">contact@kenyasbookstore.com</p>
            </div>
            <div>
              <p className="font-semibold text-deep-blue">Phone</p>
              <p className="text-gray-600">(Coming soon)</p>
            </div>
            <div>
              <p className="font-semibold text-deep-blue">Address</p>
              <p className="text-gray-600">(Coming soon)</p>
            </div>
            <div>
              <p className="font-semibold text-deep-blue">Business Hours</p>
              <p className="text-gray-600">(Coming soon)</p>
            </div>
          </div>
        </div>

        {/* Contact Form Section */}
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-6">Send us a Message</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input 
              label="Your Name" 
              id="contact-name" 
              type="text" 
              placeholder="John Doe"
              required
            />
            <Input 
              label="Your Email" 
              id="contact-email" 
              type="email" 
              placeholder="john@example.com"
              required
            />
            <div>
              <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <select 
                id="contact-subject" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-forest"
                required
              >
                <option value="">Select a subject</option>
                <option value="order">Order Inquiry</option>
                <option value="book">Book Availability</option>
                <option value="suggestion">Book Suggestion</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                id="contact-message"
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-forest"
                placeholder="How can we help you?"
                required
              />
            </div>
            <Button type="submit">Send Message</Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;

