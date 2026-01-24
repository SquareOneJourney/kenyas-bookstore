
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
        console.log("Supabase not configured, using mock data");
        setBooks(INITIAL_BOOKS as any[]);
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
        if (data && data.length > 0) {
          // Cast to any because local Supabase types are outdated
          setBooks(data as any[]);
        } else {
          setBooks([]);
        }
      }
      setLoading(false);
    };

    fetchBooks();
  }, []);

  const addBooks = async (newBooks: Book[]) => {
    // Optimistic update
    setBooks(prev => [...newBooks, ...prev]);

    // Sync with Supabase
    const supabase = getSupabaseClient();
    if (supabase) {
      // Map Book type to DB Insert type (decamelize if needed, 
      // but our types/db.ts suggests they match snake_case key names mostly?
      // Wait, 'Book' type in 'types.ts' is 'BookRow' (snake_case).
      // BUT 'mockData.ts' uses camelCase (coverUrl) ??
      // Let's check 'types.ts' (Step 22). 'export type Book = BookRow'.
      // BookRow (Step 46) uses 'cover_url', 'availability_message'.
      // MockData (Step 55) uses 'coverUrl', 'supplySource'.

      // This mismatch is dangerous. 
      // 'mockData' seems to define 'Book' interface manually or types.ts is inconsistent.
      // Step 22: 'Book' is alias for 'BookRow' (snake_case).
      // Step 55: MOCK_BOOKS has 'coverUrl'. 
      // TypeScript should have yelled about this mismatch!
      // Ah, AdminLibraryPage defined 'AppBook' causing issues earlier.

      // We need to ensure we insert correct shape.
      // Assuming 'newBooks' are matching the DB shape (snake_case) effectively 
      // OR we need to transform them.

      // Let's look at 'AdminLibraryPage' (Step 127).
      // It uses 'AppBook' (camelCase).

      // If we want to support Supabase, we MUST use snake_case for DB.

      const dbBooks = newBooks.map(b => {
        const anyBook = b as any;
        return {
          id: b.id,
          title: b.title,
          author: b.author,
          genre: anyBook.genre,
          price: anyBook.price,
          stock: anyBook.stock,
          isbn: anyBook.isbn || anyBook.isbn13,
          description: b.description,
          cover_url: anyBook.coverUrl || anyBook.cover_url,
          condition: anyBook.condition,
          location: anyBook.location,
          tags: anyBook.tags,
          supply_source: anyBook.supplySource || anyBook.supply_source,
          cost_basis: anyBook.costBasis || anyBook.cost_basis,
        };
      });

      const { error } = await supabase.from('books').insert(dbBooks);
      if (error) console.error("Error adding books to DB:", error);
    }
  };

  return (
    <BookContext.Provider value={{ books, addBooks }}>
      {children}
    </BookContext.Provider>
  );
};
