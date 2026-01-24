
import { GoogleGenAI } from '@google/genai';
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

        return {
          title: info.title,
          author: info.authors ? info.authors.join(', ') : 'Unknown Author',
          description: info.description || '',
          page_count: info.pageCount,
          publisher: info.publisher,
          publication_date: info.publishedDate,
          cover_url: info.imageLinks?.thumbnail?.replace('http:', 'https:') || `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`,
          genre: info.categories ? info.categories[0] : 'General',
          isbn13: cleanIsbn.length === 13 ? cleanIsbn : null,
          isbn10: cleanIsbn.length === 10 ? cleanIsbn : null,
        } as any;
      }
      return null;
    } catch (error) {
      console.error("Google Books API Error:", error);
      return null;
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
      const apiKey = env.gemini.apiKey || '';
      if (!apiKey) {
        return {
          ...partialBook,
          format: partialBook.format || 'Paperback',
        };
      }
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
        I have a book with the following details:
        Title: ${partialBook.title}
        Author: ${partialBook.author}
        
        Please provide the following in a JSON object:
        1. "short_description": A compelling 2-sentence marketing hook for an online store.
        2. "tags": An array of 5 SEO-friendly tags (lowercase) for finding this book (e.g., "historical fiction", "booktok", "classic").
        3. "market_price_new": An estimated USD price for a New copy.
        4. "format": The standard binding for this edition (one of: "Hardcover", "Paperback", "Mass Market").
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-pro',
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        config: { responseMimeType: 'application/json' }
      });

      const text = response.text.replace(/```json|```/g, '').trim();
      const aiData = JSON.parse(text);

      return {
        ...partialBook,
        description: partialBook.description ? partialBook.description.substring(0, 300) + "..." : aiData.short_description,
        tags: aiData.tags || [],
        // Convert to dollars for the UI field
        price: aiData.market_price_new || 15.00,
        list_price_cents: Math.round((aiData.market_price_new || 15.00) * 100),
        format: aiData.format || 'Paperback',
      } as any;

    } catch (error) {
      console.error("AI Enrichment Error:", error);
      return {
        ...partialBook,
        format: 'Paperback'
      };
    }
  }
};
