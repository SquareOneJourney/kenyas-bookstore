
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
      if (!apiKey) return partialBook;

      const ai = new GoogleGenAI({ apiKey });
      // @ts-ignore
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        I have a book: "${partialBook.title}" by "${partialBook.author}".
        Return a JSON object with: 
        "description": 2-sentence marketing hook.
        "tags": [5 tag strings].
        "price": Estimated USD price.
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const data = JSON.parse(text.replace(/```json|```/g, '').trim());

      return {
        ...partialBook,
        description: partialBook.description || data.description || '',
        tags: data.tags || [],
        price: data.price || 15.00,
      } as any;
    } catch (e) {
      console.error("AI Error:", e);
      return partialBook;
    }
  }
};
