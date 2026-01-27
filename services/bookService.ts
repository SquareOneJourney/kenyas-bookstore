
import { Book, BookCondition } from '../types';
import { env } from '../lib/env';

interface GoogleBooksVolume {
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    pageCount?: number;
    categories?: string[];
    imageLinks?: {
      thumbnail: string;
      smallThumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
      extraLarge?: string;
    };
    publisher?: string;
    publishedDate?: string;
  };
}

/**
 * BookService - Handles fetching book metadata from external sources
 * 
 * This service fetches reliable book data from Google Books API and optionally
 * enriches it with AI-generated content. Used primarily in admin workflows.
 * 
 * NOTE: AI enrichment requires GEMINI_API_KEY environment variable.
 * TODO: Add support for ISBN-10 and ISBN-13 format detection/normalization
 */
export const BookService = {

  /**
   * Fetches book metadata from Google Books API using ISBN
   * Returns partial Book object with available data, or null if not found
   */
  async fetchBookDataByISBN(isbn: string): Promise<Partial<Book> | null> {
    try {
      // Basic cleaning
      const cleanIsbn = isbn.replace(/[^0-9X]/gi, '');
      const apiKey = env.gemini.apiKey;

      console.log(`Fetching from Google Books. ISBN: ${cleanIsbn}, Key Available: ${!!apiKey}`);

      const url = new URL('https://www.googleapis.com/books/v1/volumes');
      url.searchParams.append('q', `isbn:${cleanIsbn}`);
      if (apiKey) {
        url.searchParams.append('key', apiKey);
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Google Books API Error Status:", response.status, errorData);
        return null;
      }

      const data = await response.json();

      if (data.totalItems > 0 && data.items && data.items.length > 0) {
        const info = data.items[0].volumeInfo as GoogleBooksVolume['volumeInfo'];

        const images = info.imageLinks;
        let coverUrl = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`; // Default fallback

        if (images) {
          // Find best quality image
          const rawUrl = images.extraLarge || images.large || images.medium || images.thumbnail || images.smallThumbnail;
          if (rawUrl) {
            // Force secure and remove quality-limiting params
            coverUrl = rawUrl.replace('http:', 'https:')
              .replace('&edge=curl', '')
              .replace('&zoom=1', '') // Zoom=1 often gets a tiny thumbnail
              .replace('&zoom=5', ''); // Just in case
          }
        }

        // Clean up the title - remove common subtitle patterns like ": [novel]" or "(novel)"
        let cleanTitle = info.title;
        cleanTitle = cleanTitle
          .replace(/\s*:\s*\[.*?\]\s*$/i, '')  // Remove : [anything] at end
          .replace(/\s*\(novel\)\s*$/i, '')     // Remove (novel) at end
          .replace(/\s*:\s*a novel\s*$/i, '')   // Remove : a novel at end
          .trim();

        return {
          title: cleanTitle,
          author: info.authors ? info.authors.join(', ') : 'Unknown Author',
          description: info.description || '',
          page_count: info.pageCount,
          publisher: info.publisher,
          publication_date: info.publishedDate,
          cover_url: coverUrl,
          genre: info.categories ? info.categories[0] : 'General',
          isbn13: cleanIsbn.length === 13 ? cleanIsbn : null,
          isbn10: cleanIsbn.length === 10 ? cleanIsbn : null,
        } as any;
      }
      return null;
      return null;
    } catch (error) {
      console.error("Google Books API Error:", error);
      return null;
    }
  },

  /**
   * Searches for books by query (title/author)
   * Returns a list of potential matches from Google Books and OpenLibrary
   */
  async searchBooks(query: string): Promise<Partial<Book>[]> {
    try {
      const apiKey = env.gemini.apiKey;

      // 1. Google Books Query
      const googlePromise = (async () => {
        try {
          const url = new URL('https://www.googleapis.com/books/v1/volumes');
          url.searchParams.append('q', query);
          url.searchParams.append('maxResults', '10');
          if (apiKey) url.searchParams.append('key', apiKey);

          const res = await fetch(url.toString());
          if (!res.ok) return [];
          const data = await res.json();

          return (data.items || []).map((item: any) => {
            const info = item.volumeInfo;
            const images = info.imageLinks;
            let coverUrl = null;

            if (images) {
              const rawUrl = images.extraLarge || images.large || images.medium || images.thumbnail || images.smallThumbnail;
              if (rawUrl) {
                coverUrl = rawUrl.replace('http:', 'https:')
                  .replace('&edge=curl', '')
                  .replace('&zoom=1', '')
                  .replace('&zoom=5', '');
              }
            }
            return {
              title: info.title,
              author: info.authors ? info.authors.join(', ') : 'Unknown Author',
              cover_url: coverUrl,
              publisher: info.publisher,
              publishedDate: info.publishedDate,
              description: info.description
            };
          });
        } catch (e) {
          console.error("Google Books Search Error:", e);
          return [];
        }
      })();

      // 2. OpenLibrary Query
      const openLibPromise = (async () => {
        try {
          const url = new URL('https://openlibrary.org/search.json');
          url.searchParams.append('q', query);
          url.searchParams.append('limit', '10');

          const res = await fetch(url.toString());
          if (!res.ok) return [];
          const data = await res.json();

          return (data.docs || [])
            .filter((doc: any) => doc.cover_i) // Only items with covers
            .map((doc: any) => ({
              title: doc.title,
              author: doc.author_name ? doc.author_name.join(', ') : 'Unknown Author',
              cover_url: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
              publisher: doc.publisher ? doc.publisher[0] : undefined,
              publishedDate: doc.first_publish_year ? doc.first_publish_year.toString() : undefined,
              description: `Edition count: ${doc.edition_count}`
            }));
        } catch (e) {
          console.error("OpenLibrary Search Error:", e);
          return [];
        }
      })();

      // 3. Combine Results
      const [googleResults, openLibResults] = await Promise.all([googlePromise, openLibPromise]);

      // Simple interleave or content-based merge could happen here, 
      // but simply concatenating gives the user both options.
      return [...googleResults, ...openLibResults];

    } catch (error) {
      console.error("Book Search Error:", error);
      return [];
    }
  },

  /**
   * Enriches book data with AI-generated content (description, tags, pricing estimate)
   * 
   * WARNING: AI-generated pricing is an estimate only. Actual pricing should be:
   * - Validated against Ingram wholesale prices
   * - Adjusted based on business margins
   * - Reviewed by store owner before publishing
   * 
   * TODO: Remove hardcoded fallback price ($15.00) - require manual pricing entry
   * TODO: Add validation that AI-generated price is within reasonable bounds
   */
  async enrichBookData(partialBook: Partial<Book>): Promise<Partial<Book>> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', type: 'enrich', payload: partialBook })
      });

      if (!response.ok) throw new Error('AI Enrichment failed');
      const data = await response.json();

      const priceCents = data.price ? Math.round(data.price * 100) : null;

      return {
        ...partialBook,
        description: partialBook.description || data.description || '',
        tags: data.tags || [],
        list_price_cents: partialBook.list_price_cents || priceCents || 1500,
        price: data.price || 15.00,
      } as any;
    } catch (e) {
      console.error("AI Error:", e);
      return partialBook;
    }
  }
};
