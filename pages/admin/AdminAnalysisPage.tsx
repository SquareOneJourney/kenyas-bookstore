import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Book } from '../../types';
import { useBooks } from '../../hooks/useBooks';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

// AI-related types
interface BookAnalysis {
  suggested_price: number;
  rationale: string;
  target_audience: string;
  marketing_angles: string[];
}

type AnalysisMode = 'library' | 'new';
type IdentifiedBook = { title: string; author: string };

const AdminAnalysisPage: React.FC = () => {
  const { getBooks } = useBooks();
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  
  const [mode, setMode] = useState<AnalysisMode>('library');
  const [newBookQuery, setNewBookQuery] = useState('');
  const [bookFormat, setBookFormat] = useState<'paperback' | 'hardcover'>('paperback');
  
  const [analysis, setAnalysis] = useState<BookAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [identifiedBook, setIdentifiedBook] = useState<IdentifiedBook | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  useEffect(() => {
    getBooks().then(allBooks => {
      setBooks(allBooks);
      if (allBooks.length > 0) {
        setSelectedBookId(allBooks[0].id);
      }
    });
  }, [getBooks]);

  const resetState = () => {
    setError(null);
    setAnalysis(null);
    setIdentifiedBook(null);
    setNeedsConfirmation(false);
  };

  const handleModeChange = (newMode: AnalysisMode) => {
    setMode(newMode);
    resetState();
  };
  
  const handleFindBook = async () => {
    if (!newBookQuery) {
        setError("Please enter a book title or description.");
        return;
    }
    setIsLoading(true);
    resetState();

    try {
        const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
        const prompt = `You are an expert librarian. Based on the user's query, identify the most likely book they are referring to. Query: "${newBookQuery}". Provide ONLY the book's official title and full author name in a JSON object with keys "title" and "author".`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const text = response.text.replace(/```json|```/g, '').trim();
        const foundBook = JSON.parse(text) as IdentifiedBook;
        setIdentifiedBook(foundBook);
        setNeedsConfirmation(true);

    } catch (e) {
        console.error("Error identifying book:", e);
        setError("Could not identify the book. Please try a more specific query.");
    } finally {
        setIsLoading(false);
    }
  };


  const handleAnalyze = async () => {
    let bookToAnalyze: { title: string; author: string; description: string; format: 'paperback' | 'hardcover' };

    if (mode === 'library') {
      const selectedBook = books.find(b => b.id === selectedBookId);
      if (!selectedBook) {
        setError("Selected book not found.");
        return;
      }
      bookToAnalyze = { ...selectedBook, format: 'paperback' }; // Assume library books are paperback for now
    } else {
      if (!identifiedBook) {
        setError("Please find and confirm a book before analyzing.");
        return;
      }
      bookToAnalyze = { title: identifiedBook.title, author: identifiedBook.author, description: `A book titled ${identifiedBook.title} by ${identifiedBook.author}`, format: bookFormat };
    }

    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    setNeedsConfirmation(false);

    try {
      const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

      const prompt = `
        You are a savvy e-commerce pricing manager for "Kenya's Bookstore," an online retailer aiming for competitive market pricing. 
        Your primary goal is to suggest a price that can compete with major online booksellers.

        **CRITICAL INSTRUCTION:** Before answering, use your Google Search tool to find the current average online selling price for the specified book and format. Your final suggested price MUST be informed by this real-time data.

        **Book Details:**
        - Title: "${bookToAnalyze.title}"
        - Author: "${bookToAnalyze.author}"
        - Format: ${bookToAnalyze.format}

        Analyze the book and provide your output in a valid JSON object with the following keys:
        - "suggested_price": A number representing the competitive online price.
        - "rationale": A brief explanation of your pricing decision, explicitly mentioning how the live market data from your search influenced the number.
        - "target_audience": A description of the ideal reader.
        - "marketing_angles": An array of 3-4 creative marketing angles or hooks.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{googleSearch: {}}],
        }
      });

      const text = response.text.replace(/```json|```/g, '').trim();
      const parsedAnalysis = JSON.parse(text) as BookAnalysis;
      setAnalysis(parsedAnalysis);

    } catch (e) {
      console.error("Error analyzing book:", e);
      setError("Failed to get analysis. Please check your API key and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const currentBookForDisplay = mode === 'library' ? books.find(b => b.id === selectedBookId) : identifiedBook;

  return (
    <div>
      <h1 className="font-serif text-2xl md:text-4xl font-bold text-deep-blue mb-6 md:mb-8">AI-Powered Book Analysis</h1>
      
      {/* Mode Toggle */}
      <div className="flex justify-center mb-6">
        <div className="bg-gray-200 p-1 rounded-lg flex space-x-1">
          <Button variant={mode === 'library' ? 'primary' : 'ghost'} onClick={() => handleModeChange('library')}>Analyze from Library</Button>
          <Button variant={mode === 'new' ? 'primary' : 'ghost'} onClick={() => handleModeChange('new')}>Analyze New Book</Button>
        </div>
      </div>
      
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
        {mode === 'library' && (
          <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
            <div className="w-full md:w-2/3">
              <Select label="Select a Book" id="book-select" value={selectedBookId} onChange={e => {setSelectedBookId(e.target.value); resetState();}} disabled={isLoading || books.length === 0}>
                {books.map(book => <option key={book.id} value={book.id}>{book.title}</option>)}
              </Select>
            </div>
            <div className="w-full md:w-1/3">
              <Button onClick={handleAnalyze} disabled={isLoading || !selectedBookId} className="w-full">Analyze Book</Button>
            </div>
          </div>
        )}

        {mode === 'new' && (
          <div className="mb-6 space-y-4">
            <Input label="Find a Book" placeholder="Enter title, author, or description..." value={newBookQuery} onChange={e => setNewBookQuery(e.target.value)} disabled={isLoading} />
            <Select label="Book Format" value={bookFormat} onChange={e => setBookFormat(e.target.value as 'paperback' | 'hardcover')} disabled={isLoading}>
                <option value="paperback">Paperback</option>
                <option value="hardcover">Hardcover</option>
            </Select>
            <Button onClick={handleFindBook} disabled={isLoading || !newBookQuery}>Find Book</Button>
          </div>
        )}

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest mx-auto"></div>
            <p className="mt-4 text-gray-600">Contacting Gemini...</p>
          </div>
        )}

        {needsConfirmation && identifiedBook && (
            <div className="bg-accent/20 p-4 rounded-lg text-center">
                <p className="font-semibold">Is this the correct book?</p>
                <p className="text-lg font-serif">{identifiedBook.title}</p>
                <p className="text-sm text-gray-600">by {identifiedBook.author}</p>
                <div className="mt-4 space-x-2">
                    <Button onClick={handleAnalyze}>Yes, Analyze It</Button>
                    <Button variant="outline" onClick={() => setNeedsConfirmation(false)}>No, Search Again</Button>
                </div>
            </div>
        )}


        {analysis && currentBookForDisplay && (
          <div className="mt-6 space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-deep-blue">{currentBookForDisplay.title}</h2>
              <p className="text-lg text-gray-600">by {currentBookForDisplay.author}</p>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="text-xl font-semibold text-deep-blue mb-2">Suggested Price</h3>
              <p className="text-3xl font-bold text-forest">${analysis.suggested_price.toFixed(2)}</p>
            </div>
            <div className="border-t pt-4">
              <h3 className="text-xl font-semibold text-deep-blue mb-2">Pricing Rationale</h3>
              <p className="bg-accent/10 p-3 rounded-md text-gray-800 whitespace-pre-wrap">{analysis.rationale}</p>
            </div>
            <div className="border-t pt-4">
              <h3 className="text-xl font-semibold text-deep-blue mb-2">Target Audience</h3>
              <p className="bg-accent/10 p-3 rounded-md text-gray-800 whitespace-pre-wrap">{analysis.target_audience}</p>
            </div>
            <div className="border-t pt-4">
              <h3 className="text-xl font-semibold text-deep-blue mb-2">Marketing Angles</h3>
              <ul className="list-disc list-inside bg-accent/10 p-3 rounded-md text-gray-800 space-y-1">
                {analysis.marketing_angles.map((angle, index) => <li key={index}>{angle}</li>)}
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminAnalysisPage;
