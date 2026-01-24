import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Wish, Book } from '../types';
import { env } from '../lib/env';
import Button from './ui/Button';

interface GeminiRecommendation {
  title: string;
  author: string;
}

const DonationModal: React.FC<{
  wish: Wish;
  allBooks: Book[];
  onClose: () => void;
  onConfirm: (wish: Wish) => void;
}> = ({ wish, allBooks, onClose, onConfirm }) => {
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [donorNote, setDonorNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const ai = new GoogleGenAI({ apiKey: env.gemini.apiKey || '' });
        const libraryForPrompt = allBooks.map(({ title, author, genre, description }) => ({ title, author, genre, description }));

        const prompt = `
          You are a compassionate bookseller helping a donor choose a book for a child.
          The request is for a ${wish.age}-year-old who is interested in "${wish.interests}" and needs a book with the theme: "${wish.theme}".
          
          From the following library, please recommend the 3 most suitable, age-appropriate books.
          Library: ${JSON.stringify(libraryForPrompt)}

          Provide your response as a valid JSON object with a single key "recommendations" which is an array of objects. Each object must have "title" and "author" keys that exactly match the library data.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
        });

        const text = response.text.replace(/```json|```/g, '').trim();
        const parsed: { recommendations: GeminiRecommendation[] } = JSON.parse(text);

        const foundBooks = parsed.recommendations.map(rec => 
          allBooks.find(b => b.title === rec.title && b.author === rec.author)
        ).filter((b): b is Book => !!b);

        setRecommendations(foundBooks);
      } catch (e) {
        console.error("Error fetching recommendations:", e);
        setError("Could not get AI recommendations. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecommendations();
  }, [wish, allBooks]);

  const handleSuggestNote = async () => {
    if (!selectedBook) return;
    setIsSuggesting(true);
    try {
        const ai = new GoogleGenAI({ apiKey: env.gemini.apiKey || '' });
        const prompt = `
            Write a short, anonymous, encouraging message (2-3 sentences) to a ${wish.age}-year-old child who will receive the book "${selectedBook.title}". The message should be warm, supportive, and reflect the book's positive themes.
            The child's interests are "${wish.interests}" and the requested theme was "${wish.theme}".
        `;
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
        });
        setDonorNote(response.text.trim());
    } catch(e) {
        console.error("Error suggesting note:", e);
    } finally {
        setIsSuggesting(false);
    }
  };

  const handleConfirm = () => {
    if (selectedBook) {
      onConfirm({
        ...wish,
        status: 'Fulfilled',
        donatedBook: selectedBook,
        donorNote,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-cream rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="font-serif text-3xl font-bold text-deep-blue mb-4">Fulfill a Wish</h2>
          <p className="text-gray-700 mb-2">For a <strong>{wish.age}-year-old</strong> who likes <strong>{wish.interests}</strong>.</p>
          <p className="text-gray-700 mb-6">Theme: <em>"{wish.theme}"</em></p>

          <h3 className="text-xl font-semibold text-deep-blue mb-2">Step 1: Choose a Book</h3>
          {isLoading && <p>Getting AI recommendations...</p>}
          {error && <p className="text-red-500">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {recommendations.map(book => (
              <div 
                key={book.id} 
                className={`p-2 border-2 rounded-lg cursor-pointer transition-all ${selectedBook?.id === book.id ? 'border-forest bg-forest/10' : 'border-transparent hover:border-accent'}`}
                onClick={() => setSelectedBook(book)}
              >
                <img src={book.cover_url || '/placeholder-book.png'} alt={book.title} className="w-full h-48 object-cover rounded" />
                <p className="font-semibold text-sm mt-2 text-center">{book.title}</p>
              </div>
            ))}
          </div>

          <h3 className="text-xl font-semibold text-deep-blue mb-2">Step 2: Write an Anonymous Note (Optional)</h3>
          <textarea
            className="w-full p-3 border border-accent rounded-md focus:ring-2 focus:ring-forest transition-colors"
            placeholder="Write a kind, encouraging message..."
            value={donorNote}
            onChange={e => setDonorNote(e.target.value)}
            rows={3}
            disabled={!selectedBook}
          />
          <Button onClick={handleSuggestNote} size="sm" variant="outline" className="mt-2" disabled={!selectedBook || isSuggesting}>
            {isSuggesting ? 'Thinking...' : 'Get a Suggestion'}
          </Button>

          <div className="flex justify-end space-x-4 mt-8 border-t pt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={!selectedBook}>Confirm Donation</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationModal;
