
import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { Book } from '../types';
import { BOOKS as INITIAL_BOOKS } from '../lib/mockData';
import { getSupabaseClient } from '../lib/supabaseClient';

interface BookContextType {
  books: Book[];
  addBooks: (newBooks: Book[]) => void;
  updateBook: (id: string, updates: Partial<Book>) => Promise<void>;
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
    console.log("BOOK_CONTEXT_VERSION: 1.2_STRICT_SCHEMA");

    // Validate inputs
    const validBooks = newBooks.filter(b => b.title && b.title.trim() !== '');
    if (validBooks.length !== newBooks.length) {
      console.warn("Filtered out books with missing titles:", newBooks.length - validBooks.length);
    }

    setBooks(prev => [...validBooks, ...prev]);

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const dbBooks = validBooks.map((book) => ({
      id: book.id,
      title: book.title,
      author: book.author ?? null,
      description: book.description ?? null,
      cover_url: book.cover_url ?? null,
      isbn: book.isbn || book.isbn13 || book.isbn10 || null, // Map primarily to 'isbn' column
      price: book.price || (book.list_price_cents ? book.list_price_cents / 100 : 15.00), // Handle both dollar and cent formats
      stock: book.stock ?? 0,
      genre: book.genre ?? null,
      condition: book.condition ?? 'New', // DB has 'condition'
      location: book.location ?? null,
      tags: book.tags ?? null,
      supply_source: book.supply_source ?? 'local',
      cost_basis: book.cost_basis ?? null,
      ingram_stock_level: book.ingram_stock_level ?? null,
      last_stock_sync: book.last_stock_sync ?? null,
      availability_message: book.availability_message ?? null,
      estimated_arrival_date: book.estimated_arrival_date ?? null,
      // Removed columns that don't exist in DB:
      // currency, publisher, publication_date, page_count, format, language, is_active
    }));

    console.log("Attempting to insert books with CORRECTED Schema:", dbBooks);
    const { error } = await supabase.from('books').insert(dbBooks);
    if (error) {
      console.error('Error adding books to DB:', error);
      console.error('Error details:', error.message, error.details, error.hint);
      alert(`Database Error: ${error.message} (${error.details || ''})`);
    } else {
      console.log("Books added successfully");
    }
  };

  const updateBook = async (id: string, updates: Partial<Book>) => {
    console.log("updateBook called for:", id, "updates:", updates);

    // 1. Optimistic Update
    setBooks(prev => prev.map(book => book.id === id ? { ...book, ...updates } : book));

    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn("No Supabase client available for update");
      return;
    }

    // 2. Map to DB Schema (similar to insert but partial)
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.author !== undefined) dbUpdates.author = updates.author;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.cover_url !== undefined) dbUpdates.cover_url = updates.cover_url;
    if (updates.stock !== undefined) dbUpdates.stock = updates.stock;
    if (updates.genre !== undefined) dbUpdates.genre = updates.genre;
    if (updates.condition !== undefined) dbUpdates.condition = updates.condition;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.supply_source !== undefined) dbUpdates.supply_source = updates.supply_source;
    if (updates.cost_basis !== undefined) dbUpdates.cost_basis = updates.cost_basis;

    // Handle Price mapping
    if (updates.price !== undefined) {
      dbUpdates.price = updates.price;
    } else if (updates.list_price_cents !== undefined) {
      if (!isNaN(updates.list_price_cents)) {
        dbUpdates.price = updates.list_price_cents / 100;
      } else {
        console.warn("Skipping price update: list_price_cents is NaN");
      }
    }

    // Handle ISBN mapping
    if (updates.isbn13 || updates.isbn10 || updates.isbn) {
      dbUpdates.isbn = updates.isbn13 || updates.isbn10 || updates.isbn;
    }

    console.log("Sending Database Update:", id, dbUpdates);

    const { error } = await supabase
      .from('books')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error("Error updating book in DB:", error);
      alert("Failed to save changes: " + error.message);
      // Optional: Rollback state here if critical
    } else {
      console.log("DB Update Successful");
    }
  };

  return (
    <BookContext.Provider value={{ books, addBooks, updateBook }}>
      {children}
    </BookContext.Provider>
  );
};
