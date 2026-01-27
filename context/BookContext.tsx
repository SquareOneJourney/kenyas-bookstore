
import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { Book } from '../types';
import { BOOKS as INITIAL_BOOKS } from '../lib/mockData';
import { getSupabaseClient } from '../lib/supabaseClient';

interface BookContextType {
  books: Book[];
  addBooks: (newBooks: Book[]) => void;
  updateBook: (id: string, updates: Partial<Book>) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
}

export const BookContext = createContext<BookContextType | undefined>(undefined);

export const BookProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [books, setBooks] = useState<Book[]>([]);

  // Fetch books from Supabase on mount
  useEffect(() => {
    // ... (logic remains same, just ensuring closure integrity)
    const fetchBooks = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setBooks(INITIAL_BOOKS);
        return;
      }
      const { data, error } = await supabase.from('books').select('*').order('created_at', { ascending: false });
      if (error) {
        setBooks([]);
      } else {
        const mappedBooks = (data ?? []).map(b => {
          let finalCents = b.list_price_cents;
          if ((finalCents === null || finalCents === undefined) && b.price) {
            finalCents = Math.round(b.price * 100);
          }
          return { ...b, list_price_cents: finalCents };
        });
        setBooks(mappedBooks);
      }
    };
    fetchBooks();
  }, []);

  const addBooks = async (newBooks: Book[]) => {
    // Update local state immediately
    setBooks(prev => [...newBooks, ...prev]);

    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('Supabase not configured, book only saved locally');
      return;
    }

    // Map to actual database columns (from database_setup.sql)
    // DB has: id, title, author, genre, price, stock, isbn, description, 
    //         cover_url, condition, location, tags, supply_source, cost_basis, created_at
    const dbBooks = newBooks.map(b => ({
      id: b.id,
      title: b.title,
      author: b.author,
      genre: b.genre || null,
      description: b.description || null,
      isbn: b.isbn13 || b.isbn10 || b.isbn || null, // DB uses single 'isbn' column
      cover_url: b.cover_url || null,
      price: b.list_price_cents ? b.list_price_cents / 100 : 0, // DB uses 'price' not 'list_price_cents'
      stock: b.stock ?? 1,
      condition: b.condition || 'New',
      location: b.location || null,
      supply_source: b.supply_source || 'local',
      cost_basis: b.cost_basis || 0,
      tags: b.tags || [],
      created_at: b.created_at || new Date().toISOString(),
    }));

    const { error } = await supabase.from('books').insert(dbBooks);
    if (error) {
      console.error('Failed to save book(s) to Supabase:', error);
    } else {
      console.log('Book(s) saved to Supabase successfully');
    }
  };

  const updateBook = async (id: string, updates: Partial<Book>) => {
    setBooks(prev => prev.map(book => book.id === id ? { ...book, ...updates } : book));
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // Map updates to DB keys
    const dbUpdates: any = { ...updates };
    if (updates.list_price_cents) dbUpdates.price = updates.list_price_cents / 100;

    await supabase.from('books').update(dbUpdates).eq('id', id);
  };

  const deleteBook = async (id: string) => {
    setBooks(prev => prev.filter(b => b.id !== id));
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase.from('books').delete().eq('id', id);
  };

  return (
    <BookContext.Provider value={{ books, addBooks, updateBook, deleteBook }}>
      {children}
    </BookContext.Provider>
  );
};
