
import React, { createContext, useState, ReactNode } from 'react';
import { Book } from '../types';
import { BOOKS as INITIAL_BOOKS } from '../lib/mockData';

interface BookContextType {
  books: Book[];
  addBooks: (newBooks: Book[]) => void;
}

export const BookContext = createContext<BookContextType | undefined>(undefined);

export const BookProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);

  const addBooks = (newBooks: Book[]) => {
    // Prepend new books so they show up first
    setBooks(prev => [...newBooks, ...prev]);
  };

  return (
    <BookContext.Provider value={{ books, addBooks }}>
      {children}
    </BookContext.Provider>
  );
};
