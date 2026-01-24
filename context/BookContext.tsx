
import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { Book } from '../types';
import { BOOKS as INITIAL_BOOKS } from '../lib/mockData';
import { getSupabaseClient } from '../lib/supabaseClient';

interface BookContextType {
  books: Book[];
  addBooks: (newBooks: Book[]) => void;
}

export const BookContext = createContext<BookContextType | undefined>(undefined);

export const BookProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch books from Supabase on mount
  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      const supabase = getSupabaseClient();

      if (!supabase) {
        console.log('Supabase not configured, using mock data');
        setBooks(INITIAL_BOOKS);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching books:", error);
        setBooks([]);
      } else {
        setBooks(data ?? []);
      }
      setLoading(false);
    };

    fetchBooks();
  }, []);

  const addBooks = async (newBooks: Book[]) => {
    setBooks(prev => [...newBooks, ...prev]);

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const dbBooks = newBooks.map((book) => ({
      id: book.id,
      title: book.title,
      author: book.author ?? null,
      description: book.description ?? null,
      cover_url: book.cover_url ?? null,
      isbn10: book.isbn10 ?? null,
      isbn13: book.isbn13 ?? null,
      list_price_cents: book.list_price_cents ?? null,
      // currency: book.currency ?? null,
      // publisher: book.publisher ?? null,
      // publication_date: book.publication_date ?? null,
      // page_count: book.page_count ?? null,
      // format: book.format ?? null,
      // language: book.language ?? null,
      // availability_message: book.availability_message ?? null,
      // estimated_arrival_date: book.estimated_arrival_date ?? null,
      // stock: book.stock ?? 0,
      // genre: book.genre ?? null,
      // location: book.location ?? null,
      // tags: book.tags ?? null,
      // supply_source: book.supply_source ?? 'local',
      // cost_basis: book.cost_basis ?? null,
      // ingram_stock_level: book.ingram_stock_level ?? null,
      // last_stock_sync: book.last_stock_sync ?? null,
      is_active: book.is_active ?? true,
    }));

    console.log("Attempting to insert books:", dbBooks);
    const { error } = await supabase.from('books').insert(dbBooks);
    if (error) {
      console.error('Error adding books to DB:', error);
      console.error('Error details:', error.message, error.details, error.hint);
      alert(`Database Error: ${error.message} (${error.details || ''})`);
    } else {
      console.log("Books added successfully");
    }
  };

  return (
    <BookContext.Provider value={{ books, addBooks }}>
      {children}
    </BookContext.Provider>
  );
};
