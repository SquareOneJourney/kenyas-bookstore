import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="relative mt-16 bg-midnight text-ecru overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-60" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(192,138,58,0.12), transparent 35%), radial-gradient(circle at 80% 10%, rgba(114,47,55,0.14), transparent 30%)' }} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Salon */}
          <div>
            <p className="section-heading text-ecru/80 mb-3">Visit the Salon</p>
            <h3 className="font-serif text-2xl font-semibold mb-3">Kenya's Bookstore</h3>
            <p className="text-ecru/80 text-sm max-w-xs">
              A curated destination for printed worlds. Browse our weekly edits or speak with a concierge for a tailored recommendation.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="section-heading text-ecru/80 mb-2">Concierge</p>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="hover:text-brass">Our Story</Link></li>
                <li><Link to="/contact" className="hover:text-brass">Contact</Link></li>
                <li><Link to="/returns" className="hover:text-brass">Returns</Link></li>
                <li><Link to="/shipping" className="hover:text-brass">Shipping</Link></li>
              </ul>
            </div>
            <div>
              <p className="section-heading text-ecru/80 mb-2">Discover</p>
              <ul className="space-y-2 text-sm">
                <li><Link to="/catalog" className="hover:text-brass">Catalog</Link></li>
                <li><Link to="/gift-finder" className="hover:text-brass">Gift Finder</Link></li>
                <li><Link to="/books-for-kids" className="hover:text-brass">Kids</Link></li>
                <li><Link to="/faq" className="hover:text-brass">FAQ</Link></li>
              </ul>
            </div>
          </div>

          {/* Social & Admin */}
          <div>
            <p className="section-heading text-ecru/80 mb-2">Journal</p>
            <p className="text-sm text-ecru/80 mb-4">Stories behind the shelves, reading lists, and events.</p>
            <div className="flex space-x-4 text-sm">
              <span className="text-ecru/60 cursor-not-allowed">Instagram</span>
              <span className="text-ecru/60 cursor-not-allowed">Newsletter</span>
            </div>
            <div className="border-t border-ecru/20 pt-4 mt-5">
              <Link to="/admin" className="text-xs hover:text-brass transition-colors">
                Admin Panel
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-ecru/20 pt-6 text-center text-sm text-ecru/70">
          <p>&copy; {new Date().getFullYear()} Kenya's Bookstore. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
