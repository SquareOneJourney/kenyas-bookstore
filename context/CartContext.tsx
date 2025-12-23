import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Book, CartItem, CartContextType } from '../types';
import { useAuth } from './AuthContext';
import { getSupabaseClient, isSupabaseAvailable } from '../lib/supabaseClient';
import { CartItemRow, CartItemWithBook } from '../types/db';

const CART_STORAGE_KEY = 'kenyas-bookstore-cart';

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');

  // Load cart from DB (auth) or localStorage (guest)
  const loadCart = useCallback(async () => {
    setLoading(true);
    try {
      if (isAuthenticated && user && isSupabaseAvailable()) {
        // Load from Supabase
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('cart_items')
            .select('id, quantity, book_id, books(*)')
            .eq('user_id', user.id);

          if (error) {
            console.error('Error loading cart:', error);
            setCartItems([]);
          } else {
            // Transform DB cart items to app CartItem format
            const items: CartItem[] = (data || [])
              .filter((item: any) => item.books) // Only include items with book data
              .map((item: any) => {
                const book = Array.isArray(item.books) ? item.books[0] : item.books;
                return {
                  id: item.id,
                  book_id: item.book_id,
                  quantity: item.quantity,
                  books: book,
                  title: book?.title,
                  author: book?.author,
                  list_price_cents: book?.list_price_cents,
                  cover_url: book?.cover_url,
                };
              });
            setCartItems(items);
          }
        }
      } else {
        // Load from localStorage (guest)
        try {
          const localData = window.localStorage.getItem(CART_STORAGE_KEY);
          const items = localData ? JSON.parse(localData) : [];
          setCartItems(items);
        } catch (error) {
          console.error('Error loading cart from localStorage:', error);
          setCartItems([]);
        }
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Merge localStorage cart into DB cart on login
  useEffect(() => {
    if (isAuthenticated && user && isSupabaseAvailable()) {
      const mergeLocalCart = async () => {
        try {
          const localData = window.localStorage.getItem(CART_STORAGE_KEY);
          if (!localData) return;

          const localItems: CartItem[] = JSON.parse(localData);
          if (localItems.length === 0) return;

          const supabase = getSupabaseClient();
          if (!supabase) return;

          // Fetch existing DB cart
          const { data: dbCart } = await supabase
            .from('cart_items')
            .select('book_id, quantity')
            .eq('user_id', user.id);

          const dbCartMap = new Map(
            (dbCart || []).map((item: { book_id: string; quantity: number }) => [
              item.book_id,
              item.quantity,
            ])
          );

          // Merge local items into DB
          for (const localItem of localItems) {
            const bookId = localItem.book_id || localItem.id; // Support old format
            if (!bookId) continue;

            // Check if book exists and is active
            const { data: book } = await supabase
              .from('books')
              .select('id, is_active')
              .eq('id', bookId)
              .eq('is_active', true)
              .single();

            if (!book) continue; // Skip inactive or missing books

            const existingQty = dbCartMap.get(bookId) || 0;
            const newQty = existingQty + (localItem.quantity || 1);

            // Upsert cart item
            await supabase
              .from('cart_items')
              .upsert({
                user_id: user.id,
                book_id: bookId,
                quantity: newQty,
              }, {
                onConflict: 'user_id,book_id',
              });
          }

          // Clear localStorage after merge
          window.localStorage.removeItem(CART_STORAGE_KEY);
          
          // Reload cart from DB
          await loadCart();
        } catch (error) {
          console.error('Error merging cart:', error);
        }
      };

      mergeLocalCart();
    }
  }, [isAuthenticated, user, loadCart]);

  // Load cart when auth state changes
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Save cart to DB (auth) or localStorage (guest)
  const saveCart = async (items: CartItem[]) => {
    if (isAuthenticated && user && isSupabaseAvailable()) {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      try {
        // Delete all existing items
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id);

        // Insert new items
        if (items.length > 0) {
          const inserts = items
            .filter(item => item.book_id) // Only items with valid book_id
            .map(item => ({
              user_id: user.id,
              book_id: item.book_id!,
              quantity: item.quantity,
            }));

          if (inserts.length > 0) {
            await supabase.from('cart_items').insert(inserts);
          }
        }
      } catch (error) {
        console.error('Error saving cart to DB:', error);
      }
    } else {
      // Save to localStorage (guest)
      try {
        window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  };

  const addToCart = async (book: Book) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.book_id === book.id);
      let newItems: CartItem[];
      
      if (existingItem) {
        newItems = prevItems.map(item =>
          item.book_id === book.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [
          ...prevItems,
          {
            id: book.id, // Temporary ID for guest carts
            book_id: book.id,
            quantity: 1,
            books: book,
            title: book.title,
            author: book.author,
            list_price_cents: book.list_price_cents,
            cover_url: book.cover_url,
          },
        ];
      }

      // Save asynchronously
      saveCart(newItems);
      return newItems;
    });
  };

  const removeFromCart = async (bookId: string) => {
    setCartItems(prevItems => {
      const newItems = prevItems.filter(item => item.book_id !== bookId && item.id !== bookId);
      saveCart(newItems);
      return newItems;
    });
  };

  const updateQuantity = async (bookId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(bookId);
    } else {
      setCartItems(prevItems => {
        const newItems = prevItems.map(item =>
          (item.book_id === bookId || item.id === bookId)
            ? { ...item, quantity }
            : item
        );
        saveCart(newItems);
        return newItems;
      });
    }
  };

  const clearCart = async () => {
    setCartItems([]);
    await saveCart([]);
  };

  // Calculate totals (in cents)
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => {
    const price = item.list_price_cents ?? item.books?.list_price_cents ?? 0;
    return total + price * item.quantity;
  }, 0);

  // Tax and shipping (in cents) - simplified for now
  const tax = Math.round(cartTotal * 0.0825); // 8.25% Sales Tax
  const shippingCost = shippingMethod === 'standard' ? 0 : 1500; // $15.00 in cents
  const finalTotal = cartTotal + tax + shippingCost;

  const value: CartContextType = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartCount,
    cartTotal,
    shippingMethod,
    setShippingMethod,
    tax,
    finalTotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
