import React, { useState } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';

const NewsletterSignup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with email service (e.g., Mailchimp, ConvertKit)
    console.log('Newsletter signup:', email);
    setSubmitted(true);
    setEmail('');
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="bg-gradient-to-r from-forest to-deep-blue text-cream rounded-lg shadow-xl p-6 md:p-12 my-12">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
          Stay in the Loop
        </h2>
        <p className="text-lg mb-6 text-cream/90">
          Get the latest book recommendations, exclusive deals, and store updates delivered to your inbox.
        </p>
        {submitted ? (
          <div className="bg-cream/20 backdrop-blur-sm rounded-md p-4 text-cream">
            <p className="font-semibold">✓ Thank you for subscribing!</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full sm:w-64 bg-white/10 border-cream/30 text-cream placeholder-cream/70 focus:bg-white/20"
                id="newsletter-email"
              />
              <Button type="submit" variant="secondary" size="lg" className="w-full sm:w-auto whitespace-nowrap">
                Subscribe
              </Button>
            </form>
          </div>
        )}
        <p className="text-xs text-cream/70 mt-4">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </div>
    </div>
  );
};

export default NewsletterSignup;

