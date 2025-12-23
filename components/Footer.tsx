import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-deep-blue text-cream">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* About Section */}
          <div>
            <h3 className="font-serif text-lg font-semibold mb-3">About</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="hover:text-accent transition-colors">
                  Our Story
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-accent transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/returns" className="hover:text-accent transition-colors">
                  Return Policy
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="hover:text-accent transition-colors">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-accent transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-accent transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-accent transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links Section */}
          <div>
            <h3 className="font-serif text-lg font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/catalog" className="hover:text-accent transition-colors">
                  Browse Catalog
                </Link>
              </li>
              <li>
                <Link to="/gift-finder" className="hover:text-accent transition-colors">
                  Gift Finder
                </Link>
              </li>
              <li>
                <Link to="/books-for-kids" className="hover:text-accent transition-colors">
                  Books for Kids
                </Link>
              </li>
            </ul>
          </div>

          {/* Social & Admin Section */}
          <div>
            <h3 className="font-serif text-lg font-semibold mb-3">Connect</h3>
            <div className="flex space-x-4 mb-4">
              {/* TODO: Replace placeholder links with actual social media URLs when available */}
              <span className="text-gray-400 cursor-not-allowed" aria-label="Twitter (coming soon)">
                Twitter
              </span>
              <span className="text-gray-400 cursor-not-allowed" aria-label="Instagram (coming soon)">
                Instagram
              </span>
              <span className="text-gray-400 cursor-not-allowed" aria-label="Facebook (coming soon)">
                Facebook
              </span>
            </div>
            <div className="border-t border-cream/30 pt-4">
              <Link to="/admin" className="text-xs hover:text-accent transition-colors">
                Admin Panel
              </Link>
            </div>
          </div>
        </div>
        
        <div className="border-t border-cream/30 pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Kenya's Bookstore. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
