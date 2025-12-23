
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Breadcrumb from '../components/Breadcrumb';
import CheckoutProgress from '../components/CheckoutProgress';
import { getSupabaseClient, isSupabaseAvailable } from '../lib/supabaseClient';
import { formatMoneyFromCents } from '../lib/money';
import { getAvailabilityMessage } from '../services/books';

type CheckoutStep = 'shipping' | 'payment' | 'review' | 'confirmation';

const CheckoutPage: React.FC = () => {
  const [step, setStep] = useState<CheckoutStep>('shipping');
  const [isGuest, setIsGuest] = useState(false);
  const { cartItems, cartTotal, tax, finalTotal, shippingMethod, setShippingMethod, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleNextStep = () => {
    if (step === 'shipping') setStep('payment');
    else if (step === 'payment') setStep('review');
  };
  
  const handlePlaceOrder = async () => {
    try {
      // Create order in Supabase
      if (isSupabaseAvailable()) {
        const supabase = getSupabaseClient();
        if (supabase) {
          // Calculate totals
          const subtotalCents = cartTotal;
          const taxCents = tax;
          const shippingCents = shippingMethod === 'standard' ? 0 : 1500; // $15.00 in cents
          const totalCents = finalTotal;

          // Get email (from form or user)
          const emailInput = document.getElementById('email') as HTMLInputElement;
          const email = isAuthenticated ? user?.email : (emailInput?.value || null);

          // Create order
          const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
              user_id: user?.id || null,
              status: 'created',
              currency: 'USD',
              subtotal_cents: subtotalCents,
              tax_cents: taxCents,
              shipping_cents: shippingCents,
              total_cents: totalCents,
              email: email,
            })
            .select()
            .single();

          if (orderError) {
            console.error('Error creating order:', orderError);
            alert('Failed to create order. Please try again.');
            return;
          }

          // Create order items
          const orderItems = cartItems
            .filter(item => item.book_id || item.books)
            .map(item => {
              const book = item.books || item;
              const bookId = item.book_id || item.id;
              const priceCents = item.list_price_cents ?? book.list_price_cents ?? 0;
              
              return {
                order_id: order.id,
                book_id: bookId,
                title: item.title || book.title,
                unit_price_cents: priceCents,
                quantity: item.quantity,
              };
            });

          if (orderItems.length > 0) {
            const { error: itemsError } = await supabase
              .from('order_items')
              .insert(orderItems);

            if (itemsError) {
              console.error('Error creating order items:', itemsError);
              // Order was created but items failed - this is a problem
              // In production, you might want to delete the order or handle this better
            }
          }
        }
      }

      // Clear cart and show confirmation
      clearCart();
      setStep('confirmation');
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  if (cartItems.length === 0 && step !== 'confirmation') {
      return (
          <div className="text-center bg-white p-12 rounded-lg shadow-md">
              <h1 className="font-serif text-3xl font-bold mb-4">Checkout</h1>
              <p className="text-xl text-gray-600 mb-4">Your cart is empty. You can't proceed to checkout.</p>
              <Link to="/catalog">
                  <Button>Continue Shopping</Button>
              </Link>
          </div>
      );
  }
  
  return (
    <div className="max-w-5xl mx-auto">
      <Breadcrumb
        items={[
          { label: 'Home', to: '/' },
          { label: 'Cart', to: '/cart' },
          { label: 'Checkout' },
        ]}
      />
      <h1 className="font-serif text-4xl font-bold text-deep-blue mb-8 text-center">Checkout</h1>
      
      {step === 'confirmation' ? (
        <div className="bg-white p-12 rounded-lg shadow-lg text-center">
            <h2 className="text-3xl font-semibold text-forest mb-4">Thank You For Your Order!</h2>
            <p className="text-gray-700 mb-8">Your order has been placed successfully. A confirmation email has been sent to you.</p>
            <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      ) : (
        <>
          <CheckoutProgress currentStep={step} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 bg-white p-8 rounded-lg shadow-lg">
                {step === 'shipping' && (
                    <div>
                        {!isAuthenticated && !isGuest && (
                          <div className="mb-6 p-4 bg-cream/50 rounded-lg border border-accent">
                            <p className="text-sm text-gray-700 mb-3">
                              Already have an account? <Link to="/account" className="text-forest font-semibold hover:underline">Sign in</Link> for faster checkout.
                            </p>
                            <Button variant="outline" size="sm" onClick={() => setIsGuest(true)}>
                              Continue as Guest
                            </Button>
                          </div>
                        )}
                        <h2 className="text-2xl font-semibold mb-6">Shipping Information</h2>
                        <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {!isAuthenticated && (
                              <div className="md:col-span-2">
                                <Input label="Email" id="email" type="email" placeholder="your@email.com" required />
                              </div>
                            )}
                            <Input label="First Name" id="fname" placeholder="John" required />
                            <Input label="Last Name" id="lname" placeholder="Doe" required />
                            <div className="md:col-span-2">
                              <Input label="Address" id="address" placeholder="123 Bookworm Lane" required />
                            </div>
                            <Input label="City" id="city" placeholder="New York" required />
                            <Input label="State" id="state" placeholder="NY" required />
                            <Input label="Zip Code" id="zip" placeholder="10001" required />
                            <div className="md:col-span-2">
                              <label htmlFor="order-notes" className="block text-sm font-medium text-gray-700 mb-1">
                                Order Notes (Optional)
                              </label>
                              <textarea
                                id="order-notes"
                                rows={3}
                                placeholder="Gift message, delivery instructions, etc."
                                className="w-full px-3 py-2 border border-accent rounded-md focus:outline-none focus:ring-2 focus:ring-forest"
                              />
                            </div>
                        </form>
                        
                        <div className="mt-8 border-t pt-6">
                             <h3 className="text-lg font-semibold mb-4">Shipping Method</h3>
                             <div className="space-y-3">
                                {/* TODO: Make shipping times dynamic based on:
                                    - Supply source (local vs Ingram)
                                    - Actual stock availability
                                    - Geographic location
                                */}
                                <label className={`flex items-center justify-between p-4 border rounded cursor-pointer ${shippingMethod === 'standard' ? 'border-forest bg-forest/5' : 'border-gray-200'}`}>
                                    <div className="flex items-center">
                                        <input type="radio" name="shipping" checked={shippingMethod === 'standard'} onChange={() => setShippingMethod('standard')} className="text-forest focus:ring-forest" />
                                        <span className="ml-3 font-medium">Standard Shipping (5-7 Days)</span>
                                    </div>
                                    <span>Free</span>
                                </label>
                                <label className={`flex items-center justify-between p-4 border rounded cursor-pointer ${shippingMethod === 'express' ? 'border-forest bg-forest/5' : 'border-gray-200'}`}>
                                    <div className="flex items-center">
                                        <input type="radio" name="shipping" checked={shippingMethod === 'express'} onChange={() => setShippingMethod('express')} className="text-forest focus:ring-forest" />
                                        <span className="ml-3 font-medium">Express Shipping (2 Days)</span>
                                    </div>
                                    <span>$15.00</span>
                                </label>
                             </div>
                        </div>

                        <div className="flex justify-between mt-8">
                            <Link to="/cart">
                              <Button variant="outline">Back to Cart</Button>
                            </Link>
                            <Button onClick={handleNextStep} size="lg">Continue to Payment</Button>
                        </div>
                    </div>
                )}
                {step === 'payment' && (
                    <div>
                        <h2 className="text-2xl font-semibold mb-6">Payment Details</h2>
                        <form className="grid grid-cols-1 gap-4">
                            {/*// TODO: Replace with Stripe Elements for PCI compliance */}
                            <Input label="Card Number" id="card-number" placeholder="**** **** **** 1234" />
                            <Input label="Name on Card" id="card-name" placeholder="John M. Doe" />
                            <div className="flex gap-4">
                                <Input label="Expiry Date (MM/YY)" id="expiry" placeholder="12/25" />
                                <Input label="CVC" id="cvc" placeholder="123" />
                            </div>
                        </form>
                        <div className="flex justify-between mt-8">
                            <Button variant="outline" onClick={() => setStep('shipping')}>Back to Shipping</Button>
                            <Button onClick={handleNextStep}>Review Order</Button>
                        </div>
                    </div>
                )}
                {step === 'review' && (
                    <div>
                        <h2 className="text-2xl font-semibold mb-6">Review Your Order</h2>
                        <div className="border rounded-lg p-4">
                            {cartItems.map(item => {
                              const book = item.books;
                              const bookId = item.book_id || item.id;
                              const priceCents = item.list_price_cents ?? book?.list_price_cents ?? 0;
                              const totalCents = priceCents * item.quantity;
                              
                              return (
                                <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                                    <div>
                                        <p className="font-medium">{item.title || book?.title}</p>
                                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                          {book ? getAvailabilityMessage(book) : 'Available for order'}
                                        </p>
                                    </div>
                                    <span>{formatMoneyFromCents(totalCents, book?.currency || 'USD')}</span>
                                </div>
                              );
                            })}
                        </div>
                        <div className="flex justify-between mt-8">
                            <Button variant="outline" onClick={() => setStep('payment')}>Back to Payment</Button>
                            <Button onClick={handlePlaceOrder}>Place Order</Button>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="md:col-span-1">
                 <div className="bg-white p-6 rounded-lg shadow-md sticky top-6">
                    <h3 className="text-xl font-bold mb-4 border-b pb-2">Order Summary</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>{formatMoneyFromCents(cartTotal)}</span>
                        </div>
                         <div className="flex justify-between">
                            <span>Tax</span>
                            <span>{formatMoneyFromCents(tax)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Shipping</span>
                            <span>{shippingMethod === 'standard' ? formatMoneyFromCents(0) : formatMoneyFromCents(1500)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                            <span>Total</span>
                            <span>{formatMoneyFromCents(finalTotal)}</span>
                        </div>
                    </div>
                 </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CheckoutPage;
