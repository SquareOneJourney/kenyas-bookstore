import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Book } from '../types';
import Button from './ui/Button';
import { useCart } from '../hooks/useCart';
import { formatMoneyFromCents } from '../lib/money';
import { getAvailabilityMessage } from '../services/books';

interface BookListItemProps {
  book: Book;
  index: number;
}

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    className={`w-4 h-4 ${filled ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const BookListItem: React.FC<BookListItemProps> = ({ book, index }) => {
  const { addToCart } = useCart();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Mock rating for now
  const rating = 4.0;
  const reviewCount = 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAddingToCart(true);
    addToCart(book);
    setTimeout(() => setIsAddingToCart(false), 300);
  };

  // Format date if available
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return `(${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`;
    } catch {
      return '';
    }
  };

  return (
    <div className="flex gap-4 py-6 border-b border-gray-200 last:border-b-0">
      {/* Number */}
      <div className="text-gray-400 font-semibold text-sm w-8 flex-shrink-0 pt-1">
        {index + 1}
      </div>

      {/* Cover Image */}
      <Link to={`/book/${book.id}`} className="flex-shrink-0">
        <img
          src={book.cover_url || '/placeholder-book.png'}
          alt={`Cover of ${book.title} by ${book.author || 'Unknown Author'}`}
          className="w-24 h-36 object-cover rounded shadow-sm hover:shadow-md transition-shadow"
          loading="lazy"
        />
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Link to={`/book/${book.id}`} className="block hover:text-forest transition-colors">
          <h3 className="font-serif text-lg font-semibold text-deep-blue mb-1 line-clamp-2">
            {book.title} {formatDate(book.publication_date)}
          </h3>
          <p className="text-sm text-gray-600 mb-2">by {book.author || 'Unknown Author'}</p>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon key={star} filled={star <= Math.round(rating)} />
            ))}
          </div>
          {reviewCount > 0 && (
            <span className="text-xs text-gray-600 ml-1">({reviewCount})</span>
          )}
        </div>

        {/* Format */}
        {book.format && (
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-medium">Format:</span> {book.format}
          </p>
        )}

        {/* Price */}
        <p className="text-xl font-bold text-deep-blue mb-3">
          {formatMoneyFromCents(book.list_price_cents, book.currency || 'USD')}
        </p>

        {/* Availability */}
        <div className="mb-3 text-sm">
          <p className="text-gray-600">{getAvailabilityMessage(book)}</p>
        </div>

        {/* Add to Cart Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={handleAddToCart}
          disabled={isAddingToCart}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isAddingToCart ? 'Adding...' : 'ADD TO CART'}
        </Button>
      </div>
    </div>
  );
};

export default BookListItem;

