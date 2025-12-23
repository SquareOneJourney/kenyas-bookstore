import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Book } from '../types';

interface RecentlyViewedContextType {
  recentlyViewed: Book[];
  addToRecentlyViewed: (book: Book) => void;
  clearRecentlyViewed: () => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType | undefined>(undefined);

const STORAGE_KEY = 'kenyas-bookstore-recently-viewed';
const MAX_ITEMS = 12;

export const RecentlyViewedProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [recentlyViewed, setRecentlyViewed] = useState<Book[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load recently viewed books:', error);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewed));
    } catch (error) {
      console.error('Failed to save recently viewed books:', error);
    }
  }, [recentlyViewed]);

  const addToRecentlyViewed = (book: Book) => {
    setRecentlyViewed((prev) => {
      // Remove if already exists, then add to front
      const filtered = prev.filter((b) => b.id !== book.id);
      return [book, ...filtered].slice(0, MAX_ITEMS);
    });
  };

  const clearRecentlyViewed = () => {
    setRecentlyViewed([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <RecentlyViewedContext.Provider value={{ recentlyViewed, addToRecentlyViewed, clearRecentlyViewed }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
};

export const useRecentlyViewed = (): RecentlyViewedContextType => {
  const context = useContext(RecentlyViewedContext);
  if (context === undefined) {
    throw new Error('useRecentlyViewed must be used within a RecentlyViewedProvider');
  }
  return context;
};

