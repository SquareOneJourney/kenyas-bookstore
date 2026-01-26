
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Book } from '../types';
import { getBookById, listActiveBooks, getAvailabilityMessage } from '../services/books';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import Button from '../components/ui/Button';
import BookCard from '../components/BookCard';
import Breadcrumb from '../components/Breadcrumb';
import ImageZoom from '../components/ImageZoom';
import SocialShare from '../components/SocialShare';
import { formatMoneyFromCents } from '../lib/money';

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${filled ? 'text-red-500' : ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);

const BookDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [recommended, setRecommended] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToRecentlyViewed } = useRecentlyViewed();

  useEffect(() => {
    const fetchBook = async () => {
      setLoading(true);
      if (id) {
        try {
          const foundBook = await getBookById(id);
          if (foundBook) {
            setBook(foundBook);
            addToRecentlyViewed(foundBook);
            // Fetch recommended books (just get some other books)
            const recommendedBooks = await listActiveBooks({ limit: 4 });
            setRecommended(recommendedBooks.filter(b => b.id !== id).slice(0, 4));
          }
        } catch (error) {
          console.error('Error fetching book:', error);
        }
      }
      setLoading(false);
    };
    fetchBook();
    window.scrollTo(0, 0);
  }, [id, addToRecentlyViewed]);

  const handleAddToCart = async () => {
    if (!book) return;
    setIsAddingToCart(true);
    addToCart(book);
    setTimeout(() => setIsAddingToCart(false), 500);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3 bg-gray-200 h-96 rounded-md"></div>
          <div className="md:w-2/3 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="text-center p-12">
        <h1 className="font-serif text-3xl font-bold text-deep-blue mb-4">Book not found</h1>
        <p className="text-gray-600 mb-6">The book you're looking for doesn't exist or has been removed.</p>
        <Link to="/catalog">
          <Button>Browse Catalog</Button>
        </Link>
      </div>
    );
  }

  const inWishlist = isInWishlist(book.id);
  const currentUrl = window.location.href;

  const toggleWishlist = () => {
    if (inWishlist) removeFromWishlist(book.id);
    else addToWishlist(book);
  };

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Home', to: '/' },
          { label: 'Catalog', to: '/catalog' },
          { label: book.title },
        ]}
      />
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/5 xl:w-1/3 flex-shrink-0">
            <ImageZoom
              src={book.cover_url || '/placeholder-book.png'}
              alt={`Cover of ${book.title} by ${book.author || 'Unknown Author'}`}
              className="w-full h-auto object-cover rounded-md shadow-xl"
            />
          </div>
          <div className="lg:w-3/5 xl:w-2/3 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h1 className="font-serif text-3xl md:text-4xl font-bold text-deep-blue mb-2 leading-tight">
                  {book.title}
                </h1>
                <p className="text-lg md:text-xl text-gray-700 mb-3">by {book.author || 'Unknown Author'}</p>
                <div className="flex items-center gap-3 mb-4">
                  {book.format && (
                    <span className="bg-forest text-cream text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wider">
                      {book.format}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={toggleWishlist}
                className="p-3 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
              >
                <HeartIcon filled={inWishlist} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-3xl font-bold text-forest mb-2">
                {formatMoneyFromCents(book.list_price_cents, book.currency || 'USD')}
              </p>
              <p className="text-sm text-gray-500">
                {getAvailabilityMessage(book)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-gray-500 text-sm mb-6">
              {book.isbn13 && <span className="bg-gray-100 px-2 py-1 rounded">ISBN-13: {book.isbn13}</span>}
              {book.isbn10 && <span className="bg-gray-100 px-2 py-1 rounded">ISBN-10: {book.isbn10}</span>}
            </div>

            <div className="mb-6">
              <p className="text-gray-800 leading-relaxed text-base mb-6">{book.description || 'No description available.'}</p>
              <SocialShare title={book.title} url={currentUrl} description={book.description || ''} />
            </div>

            {/* Details Section - Technical Metadata */}
            {(book.publisher || book.publication_date || book.page_count || book.isbn13 || book.isbn10) && (
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-deep-blue mb-4 border-b pb-2">Details</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {book.publisher && (
                    <div>
                      <dt className="text-gray-500 uppercase text-[10px] font-bold tracking-wider mb-1">Publisher</dt>
                      <dd className="font-medium text-deep-blue">{book.publisher}</dd>
                    </div>
                  )}
                  {book.publication_date && (
                    <div>
                      <dt className="text-gray-500 uppercase text-[10px] font-bold tracking-wider mb-1">Publication Date</dt>
                      <dd className="font-medium text-deep-blue">
                        {new Date(book.publication_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </dd>
                    </div>
                  )}
                  {book.page_count && (
                    <div>
                      <dt className="text-gray-500 uppercase text-[10px] font-bold tracking-wider mb-1">Page Count</dt>
                      <dd className="font-medium text-deep-blue">{book.page_count}</dd>
                    </div>
                  )}
                  {book.isbn13 && (
                    <div>
                      <dt className="text-gray-500 uppercase text-[10px] font-bold tracking-wider mb-1">ISBN-13</dt>
                      <dd className="font-medium text-deep-blue font-mono">{book.isbn13}</dd>
                    </div>
                  )}
                  {book.isbn10 && (
                    <div>
                      <dt className="text-gray-500 uppercase text-[10px] font-bold tracking-wider mb-1">ISBN-10</dt>
                      <dd className="font-medium text-deep-blue font-mono">{book.isbn10}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            <div className="mt-auto border-t pt-6 space-y-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-4xl font-bold text-forest">
                    {formatMoneyFromCents(book.list_price_cents, book.currency || 'USD')}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {getAvailabilityMessage(book)}
                  </p>
                  {book.estimated_arrival_date && (
                    <p className="text-sm text-gray-600 mt-2 font-medium">
                      📦 Estimated arrival: {new Date(book.estimated_arrival_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="flex-1 min-h-[48px]"
                >
                  {isAddingToCart ? 'Adding to Cart...' : 'Add to Cart'}
                </Button>
                <Link to="/cart" className="flex-1">
                  <Button variant="outline" size="lg" className="w-full min-h-[48px]">
                    View Cart
                  </Button>
                </Link>
              </div>
              <div className="bg-cream/50 p-4 rounded-md text-sm text-gray-700">
                <p className="font-semibold mb-1">🛡️ Secure Checkout</p>
                <p>Free shipping on orders over $25 • Easy returns within 30 days</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {recommended.length > 0 && (
        <div className="mt-16">
          <h2 className="font-serif text-3xl font-bold text-deep-blue mb-6 border-b-2 border-accent pb-2">You Might Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommended.map(recBook => <BookCard key={recBook.id} book={recBook} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookDetailPage;
