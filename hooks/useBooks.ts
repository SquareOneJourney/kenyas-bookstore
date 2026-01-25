
import { useContext, useCallback } from 'react';
import { BookContext } from '../context/BookContext';
import { Book } from '../types';

export const useBooks = () => {
  const context = useContext(BookContext);

  if (!context) {
    throw new Error('useBooks must be used within a BookProvider');
  }

  const { books, addBooks, updateBook } = context;

  const getBooks = useCallback((): Promise<Book[]> => {
    // Return a promise to maintain the existing async interface used by components
    return Promise.resolve(books);
  }, [books]);

  const getBookById = useCallback((id: string): Promise<Book | undefined> => {
    return Promise.resolve(books.find(book => book.id === id));
  }, [books]);

  const getRecommendedBooks = useCallback((currentBookId: string, genre: string): Promise<Book[]> => {
    const recommended = books.filter(book => book.genre === genre && book.id !== currentBookId).slice(0, 4);
    return Promise.resolve(recommended);
  }, [books]);

  return { getBooks, getBookById, getRecommendedBooks, addBooks, updateBook };
};
