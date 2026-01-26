
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Book } from '../types';
import Button from './ui/Button';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { formatMoneyFromCents } from '../lib/money';
import { getAvailabilityMessage } from '../services/books';

interface BookCardProps {
  book: Book;
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

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg
    className={`w-5 h-5 ${filled ? 'text-red-500 fill-current' : 'text-gray-400'}`}
    fill={filled ? 'currentColor' : 'none'}
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const BookCard: React.FC<BookCardProps> = ({ book }) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const inWishlist = isInWishlist(book.id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAddingToCart(true);
    addToCart(book);
    // Brief delay for visual feedback
    setTimeout(() => setIsAddingToCart(false), 300);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(book.id);
    } else {
      addToWishlist(book);
    }
  };

  // Mock rating for now (will be replaced with real data when reviews are implemented)
  const rating = 4.5;
  const reviewCount = 0;

  return (
    <div className="group relative rounded-2xl overflow-hidden transition-all duration-300 transform hover:-translate-y-1.5 brass-border bg-bone/40 backdrop-blur-sm">
      <Link to={`/book/${book.id}`} className="block">
        <div className="relative">
          <img
            src={book.cover_url || '/placeholder-book.png'}
            alt={`Cover of ${book.title} by ${book.author || 'Unknown Author'}`}
            className="w-full h-64 object-contain bg-gray-50 transition-transform duration-300 group-hover:scale-[1.02] p-2"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

          {/* Format badge */}
          {book.format && (
            <div className="absolute top-2 right-2 bg-midnight/85 backdrop-blur-sm text-ecru text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
              {book.format}
            </div>
          )}

          {/* Wishlist button */}
          <button
            onClick={handleWishlistToggle}
            className="absolute bottom-2 right-2 bg-ecru/90 backdrop-blur-sm p-1.5 rounded-full shadow-md hover:bg-ecru transition-colors opacity-0 group-hover:opacity-100"
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <HeartIcon filled={inWishlist} />
          </button>
        </div>

        <div className="p-3 space-y-1.5">
          <div>
            <h3 className="font-serif text-base font-semibold text-ink line-clamp-2 min-h-[3rem] group-hover:text-oxblood transition-colors leading-tight">
              {book.title}
            </h3>
            <p className="text-xs text-ink/70 mt-1 line-clamp-1">by {book.author}</p>
          </div>

          {/* Rating - placeholder for future reviews */}
          {reviewCount > 0 ? (
            <div className="flex items-center gap-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon key={star} filled={star <= Math.round(rating)} />
                ))}
              </div>
              <span className="text-[10px] text-ink/60 ml-1">({reviewCount})</span>
            </div>
          ) : (
            <div className="text-[10px] text-ink/50 italic h-4"></div>
          )}

          {/* Availability message */}
          <p className="text-[10px] text-ink/60">
            {getAvailabilityMessage(book)}
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-ink/10 gap-2">
            <div>
              <p className="text-lg font-semibold text-oxblood">
                {formatMoneyFromCents(book.list_price_cents, book.currency || 'USD')}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="px-3 py-1.5 text-xs sm:text-sm flex-1 sm:flex-none whitespace-nowrap"
            >
              {isAddingToCart ? '...' : <span className="sm:hidden">Add</span>}
              <span className="hidden sm:inline">{isAddingToCart ? 'Adding...' : 'Add to Cart'}</span>
            </Button>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default BookCard;
