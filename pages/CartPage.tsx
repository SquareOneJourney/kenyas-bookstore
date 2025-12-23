
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Breadcrumb from '../components/Breadcrumb';
import { formatMoneyFromCents, centsToDollars } from '../lib/money';
import { getAvailabilityMessage } from '../services/books';

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);


const CartPage: React.FC = () => {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, cartCount, tax, finalTotal, shippingMethod } = useCart();
  const { addToWishlist } = useWishlist();
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [savedForLater, setSavedForLater] = useState<string[]>([]);

  const handleSaveForLater = (bookId: string) => {
    const book = cartItems.find(item => item.book_id === bookId || item.id === bookId);
    if (book && book.books) {
      addToWishlist(book.books);
      removeFromCart(bookId);
      setSavedForLater([...savedForLater, bookId]);
    }
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with promo code validation
    if (promoCode.trim()) {
      setPromoApplied(true);
      // In real implementation, calculate discount here
    }
  };

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Home', to: '/' },
          { label: 'Cart' },
        ]}
      />
      <h1 className="font-serif text-4xl font-bold text-deep-blue mb-8">Your Cart</h1>
      {cartItems.length === 0 ? (
        <div className="text-center bg-white p-12 rounded-lg shadow-md">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-xl text-gray-600 mb-4">Your cart is empty.</p>
          <p className="text-gray-500 mb-6">Start adding books to your cart to continue shopping.</p>
          <Link to="/catalog">
            <Button size="lg">Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Items ({cartCount})</h2>
              <div className="space-y-4">
                {cartItems.map(item => {
                  const bookId = item.book_id || item.id;
                  const book = item.books;
                  const priceCents = item.list_price_cents ?? book?.list_price_cents ?? 0;
                  
                  return (
                    <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b pb-4 last:border-b-0">
                      <Link to={`/book/${bookId}`} className="flex-shrink-0">
                        <img 
                          src={item.cover_url || book?.cover_url || '/placeholder-book.png'} 
                          alt={`${item.title || book?.title} by ${item.author || book?.author || 'Unknown Author'}`} 
                          className="w-20 h-28 object-cover rounded-md hover:opacity-80 transition-opacity" 
                        />
                      </Link>
                      <div className="flex-grow min-w-0">
                        <Link to={`/book/${bookId}`}>
                          <h3 className="font-semibold text-deep-blue hover:text-forest transition-colors">
                            {item.title || book?.title}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-500">{item.author || book?.author || 'Unknown Author'}</p>
                        {book?.format && (
                          <p className="text-xs text-gray-400 mt-1">{book.format}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {book ? getAvailabilityMessage(book) : 'Available for order'}
                        </p>
                        <p className="text-forest font-bold text-lg mt-2">
                          {formatMoneyFromCents(priceCents, book?.currency || 'USD')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-2">
                          <label htmlFor={`qty-${item.id}`} className="text-sm text-gray-600 sr-only">Quantity</label>
                          <input
                            id={`qty-${item.id}`}
                            type="number"
                            min="1"
                            max="99"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (val > 0 && val <= 99) {
                                updateQuantity(bookId, val);
                              }
                            }}
                            className="w-20 p-2 border border-accent rounded-md text-center focus:outline-none focus:ring-2 focus:ring-forest"
                            aria-label={`Quantity for ${item.title || book.title}`}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleSaveForLater(bookId)}
                            title="Save for later"
                            aria-label={`Save ${item.title || book.title} for later`}
                          >
                            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeFromCart(bookId)}
                            title="Remove from cart"
                            aria-label={`Remove ${item.title || book.title} from cart`}
                          >
                            <TrashIcon className="w-5 h-5 text-gray-500 hover:text-red-500 transition-colors" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Continue Shopping */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Link to="/catalog" className="text-forest hover:text-forest/80 font-semibold transition-colors flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Continue Shopping
              </Link>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-md sticky top-24 space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Order Summary</h2>
              
              {/* Promo Code */}
              <div className="border-b pb-4">
                <form onSubmit={handleApplyPromo} className="space-y-2">
                  <label htmlFor="promo-code" className="text-sm font-semibold text-deep-blue block">
                    Promo Code
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="promo-code"
                      type="text"
                      placeholder="Enter code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      disabled={promoApplied}
                      className="flex-1"
                    />
                    {!promoApplied ? (
                      <Button type="submit" variant="outline" size="sm">
                        Apply
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPromoApplied(false);
                          setPromoCode('');
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  {promoApplied && (
                    <p className="text-xs text-green-600 font-semibold">✓ Promo code applied!</p>
                  )}
                </form>
              </div>

              {/* Order Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal ({cartCount} {cartCount === 1 ? 'item' : 'items'})</span>
                  <span>{formatMoneyFromCents(cartTotal)}</span>
                </div>
                {promoApplied && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatMoneyFromCents(Math.round(cartTotal * 0.1))}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Est. Tax (8.25%)</span>
                  <span>{formatMoneyFromCents(tax)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping ({shippingMethod === 'standard' ? 'Standard' : 'Express'})</span>
                  <span>{shippingMethod === 'standard' ? 'Free' : formatMoneyFromCents(1500)}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold text-xl">
                    <span>Total</span>
                    <span className="text-forest">
                      {formatMoneyFromCents(promoApplied ? finalTotal - Math.round(cartTotal * 0.1) : finalTotal)}
                    </span>
                  </div>
                </div>
              </div>

              <Link to="/checkout" className="block">
                <Button size="lg" className="w-full">Proceed to Checkout</Button>
              </Link>

              {/* Trust Badges */}
              <div className="pt-4 border-t space-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <span>🔒</span>
                  <span>Secure checkout</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>↩️</span>
                  <span>Easy returns</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🚚</span>
                  <span>Free shipping over $25</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
