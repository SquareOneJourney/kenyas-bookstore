import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Book, WishlistContextType } from '../types';
import { useAuth } from './AuthContext';
import { getSupabaseClient, isSupabaseAvailable } from '../lib/supabaseClient';
import { WishlistItemWithBook } from '../types/db';

const WISHLIST_STORAGE_KEY = 'kenyas-bookstore-wishlist';

export const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  // Load wishlist from DB (auth) or localStorage (guest)
  const loadWishlist = useCallback(async () => {
    setLoading(true);
    try {
      if (isAuthenticated && user && isSupabaseAvailable()) {
        // Load from Supabase
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('wishlist_items')
            .select('id, book_id, books(*)')
            .eq('user_id', user.id);

          if (error) {
            console.error('Error loading wishlist:', error);
            setWishlist([]);
          } else {
            // Transform DB wishlist items to Book array
            const books: Book[] = (data || [])
              .map((item: WishlistItemWithBook) => item.books)
              .filter((book: Book | null) => book !== null) as Book[];
            setWishlist(books);
          }
        }
      } else {
        // Load from localStorage (guest) - only if it already exists
        try {
          const localData = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
          if (localData) {
            const items = JSON.parse(localData);
            setWishlist(items);
          } else {
            setWishlist([]);
          }
        } catch (error) {
          console.error('Error loading wishlist from localStorage:', error);
          setWishlist([]);
        }
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Load wishlist when auth state changes
  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  // Save wishlist to DB (auth) or localStorage (guest)
  const saveWishlist = async (books: Book[]) => {
    if (isAuthenticated && user && isSupabaseAvailable()) {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      try {
        // Get current wishlist items
        const { data: existing } = await supabase
          .from('wishlist_items')
          .select('book_id')
          .eq('user_id', user.id);

        const existingBookIds = new Set((existing || []).map(item => item.book_id));
        const newBookIds = new Set(books.map(book => book.id));

        // Remove items not in new wishlist
        const toRemove = Array.from(existingBookIds).filter(id => !newBookIds.has(id));
        if (toRemove.length > 0) {
          await supabase
            .from('wishlist_items')
            .delete()
            .eq('user_id', user.id)
            .in('book_id', toRemove);
        }

        // Add new items
        const toAdd = books
          .filter(book => !existingBookIds.has(book.id))
          .map(book => ({
            user_id: user.id,
            book_id: book.id,
          }));

        if (toAdd.length > 0) {
          await supabase.from('wishlist_items').insert(toAdd);
        }
      } catch (error) {
        console.error('Error saving wishlist to DB:', error);
      }
    } else {
      // Save to localStorage (guest) - only if it already exists
      try {
        const existing = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
        if (existing || books.length > 0) {
          window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(books));
        }
      } catch (error) {
        console.error('Error saving wishlist to localStorage:', error);
      }
    }
  };

  const addToWishlist = async (book: Book) => {
    setWishlist(prev => {
      if (prev.some(item => item.id === book.id)) return prev;
      const newWishlist = [...prev, book];
      saveWishlist(newWishlist);
      return newWishlist;
    });
  };

  const removeFromWishlist = async (bookId: string) => {
    setWishlist(prev => {
      const newWishlist = prev.filter(item => item.id !== bookId);
      saveWishlist(newWishlist);
      return newWishlist;
    });
  };

  const isInWishlist = (bookId: string) => {
    return wishlist.some(item => item.id === bookId);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};
