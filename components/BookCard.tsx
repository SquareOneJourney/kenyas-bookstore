
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
            className="w-full h-80 sm:h-96 object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Format badge */}
          {book.format && (
            <div className="absolute top-3 right-3 bg-midnight/85 backdrop-blur-sm text-ecru text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
              {book.format}
            </div>
          )}

          {/* Wishlist button */}
          <button
            onClick={handleWishlistToggle}
            className="absolute bottom-3 right-3 bg-ecru/90 backdrop-blur-sm p-2 rounded-full shadow-md hover:bg-ecru transition-colors opacity-0 group-hover:opacity-100"
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <HeartIcon filled={inWishlist} />
          </button>
        </div>

        <div className="p-4 space-y-2">
          <div>
            <h3 className="font-serif text-lg font-semibold text-ink line-clamp-2 min-h-[3.5rem] group-hover:text-oxblood transition-colors">
              {book.title}
            </h3>
            <p className="text-sm text-ink/70 mt-1 line-clamp-1">by {book.author}</p>
          </div>

          {/* Rating - placeholder for future reviews */}
          {reviewCount > 0 ? (
            <div className="flex items-center gap-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon key={star} filled={star <= Math.round(rating)} />
                ))}
              </div>
              <span className="text-xs text-ink/60 ml-1">({reviewCount})</span>
            </div>
          ) : (
            <div className="text-xs text-ink/50 italic">No reviews yet</div>
          )}

          {/* Availability message */}
          <p className="text-xs text-ink/60">
            {getAvailabilityMessage(book)}
          </p>

          <div className="flex items-center justify-between pt-3 border-t border-ink/10">
            <div>
              <p className="text-xl font-semibold text-oxblood">
                {formatMoneyFromCents(book.list_price_cents, book.currency || 'USD')}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="min-w-[104px]"
            >
              {isAddingToCart ? 'Adding...' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default BookCard;
