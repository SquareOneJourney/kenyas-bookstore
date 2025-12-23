
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

/**
 * 404 Not Found Page
 * 
 * Shown when a route doesn't exist.
 */
const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="bg-white p-12 rounded-lg shadow-lg">
        <h1 className="font-serif text-6xl font-bold text-deep-blue mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
          <Link to="/catalog">
            <Button variant="outline">Browse Catalog</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;

