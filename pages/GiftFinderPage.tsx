
import React, { useState, useEffect } from 'react';
import { Book } from '../types';
import { useBooks } from '../hooks/useBooks';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { Link } from 'react-router-dom';
import { formatMoneyFromCents } from '../lib/money';

// Types for the Gift Finder
interface UserPreferences {
  recipient: string;
  mood: string;
  includeGenres: string;
  budget_max?: number;
}

interface Recommendation {
  book: Book;
  kenyaNote: string;
  isOutOfStock: boolean;
  inStockAlternative?: Book;
}

interface OptionalPairing {
  theme: string;
  items: string[];
}

interface Citation {
  uri: string;
  title: string;
}

// API response structure
interface GeminiRecommendation {
  title: string;
  author: string;
  kenyaNote: string;
  isOutOfStock: boolean;
  inStockAlternative?: {
    title: string;
    author: string;
  };
}

interface GiftFinderAPIResponse {
  recommendations: GeminiRecommendation[];
  optionalPairings: OptionalPairing[];
  refineFiltersMessage?: string;
  citations?: Citation[];
}

const GiftFinderPage: React.FC = () => {
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const { getBooks } = useBooks();

  // Form State
  const [recipient, setRecipient] = useState('friend');
  const [mood, setMood] = useState('');
  const [includeGenres, setIncludeGenres] = useState('');
  const [budget, setBudget] = useState('');
  const [webContextOk, setWebContextOk] = useState(true);

  // Results State
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [pairings, setPairings] = useState<OptionalPairing[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getBooks().then(setAllBooks);
  }, [getBooks]);

  const findBook = (title: string, author: string): Book | undefined => {
    const normalizedTitle = title.toLowerCase();
    const normalizedAuthor = author.toLowerCase();
    return allBooks.find((book) => {
      const bookAuthor = (book.author || '').toLowerCase();
      return book.title.toLowerCase() === normalizedTitle && bookAuthor === normalizedAuthor;
    });
  };

  const handleFindGift = async () => {
    if (!mood.trim()) {
      setError('Please describe the mood or vibe you\'re looking for.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);
    setRecommendations([]);
    setPairings([]);
    setCitations([]);

    try {
      const catalogForPrompt = allBooks.map(({ id, title, author, description, genre, list_price_cents, stock }) => ({
        id,
        title,
        author,
        description,
        genre,
        price: list_price_cents ? Number((list_price_cents / 100).toFixed(2)) : 0,
        inventory: stock ?? 0
      }));

      const user_preferences: UserPreferences = {
        recipient,
        mood,
        includeGenres,
      };
      if (budget) {
        user_preferences.budget_max = parseFloat(budget);
      }

      // Call server-side API instead of direct Gemini
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'gift-finder',
          catalog: catalogForPrompt,
          user_preferences,
          web_context_ok: webContextOk
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get recommendations');
      }

      const parsedResponse: GiftFinderAPIResponse = await response.json();

      if (parsedResponse.refineFiltersMessage) {
        setMessage(parsedResponse.refineFiltersMessage);
      }

      if (!parsedResponse.recommendations || parsedResponse.recommendations.length === 0) {
        setError("I couldn't find a perfect match in our library. Try describing it a bit differently!");
        setIsLoading(false);
        return;
      }

      const finalRecommendations: Recommendation[] = parsedResponse.recommendations.map((rec): Recommendation | null => {
        const book = findBook(rec.title, rec.author);
        if (!book) return null;

        const alternativeBook = rec.inStockAlternative ? findBook(rec.inStockAlternative.title, rec.inStockAlternative.author) : undefined;

        return {
          book: book,
          kenyaNote: rec.kenyaNote,
          isOutOfStock: rec.isOutOfStock,
          inStockAlternative: alternativeBook
        };
      }).filter((item): item is Recommendation => item !== null);

      setRecommendations(finalRecommendations);
      setPairings(parsedResponse.optionalPairings || []);
      setCitations(parsedResponse.citations || []);

    } catch (e) {
      console.error("Error finding gift recommendations:", e);
      setError("An unexpected error occurred. The AI might be a bit busy. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const RecommendationCard: React.FC<{ rec: Recommendation }> = ({ rec }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col group">
      <div className="p-4 bg-accent/20">
        <p className="font-serif text-deep-blue italic text-center text-md">"{rec.kenyaNote}"</p>
      </div>

      <Link to={`/book/${rec.book.id}`} className="block">
        <div className="relative">
          <img src={rec.book.cover_url || '/placeholder-book.png'} alt={`Cover of ${rec.book.title}`} className="w-full h-64 object-cover" />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300"></div>
        </div>
      </Link>
      <div className="p-4 flex flex-col flex-grow">
        <Link to={`/book/${rec.book.id}`}>
          <h3 className="font-serif text-lg font-bold text-deep-blue h-14 overflow-hidden hover:text-forest">{rec.book.title}</h3>
        </Link>
        <p className="text-sm text-gray-600 mb-2">{rec.book.author}</p>
        <div className="flex items-center justify-between mt-auto">
          <p className="text-lg font-semibold text-forest">
            {formatMoneyFromCents(rec.book.list_price_cents ?? 0, rec.book.currency || 'USD')}
          </p>
        </div>
      </div>

      {rec.isOutOfStock && (
        <div className="p-4 bg-red-100 text-red-800 text-center border-t-2 border-red-200">
          <p className="font-semibold">Currently Out of Stock</p>
          {rec.inStockAlternative && (
            <p className="text-sm mt-2">
              You might also like: <Link to={`/book/${rec.inStockAlternative.id}`} className="underline font-semibold hover:text-red-900">{rec.inStockAlternative.title}</Link>
            </p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-deep-blue mb-4">Kenya's Gift Finder</h1>
        <p className="text-lg text-gray-700">
          Let's find something that truly resonates. Tell me a bit about who this gift is for, and I'll find the perfect book from our collection.
        </p>
      </div>

      <div className="mt-8 max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Who is this gift for?" value={recipient} onChange={e => setRecipient(e.target.value)}>
            <option value="friend">Friend</option>
            <option value="parent">Parent</option>
            <option value="partner">Partner</option>
            <option value="child">Child</option>
            <option value="colleague">Colleague</option>
            <option value="self">Myself</option>
            <option value="other">Other</option>
          </Select>
          <Input label="Budget (Max)" type="number" placeholder="e.g., 25" value={budget} onChange={e => setBudget(e.target.value)} />
        </div>
        <div className="mt-4">
          <Input label="What's the mood or vibe?" placeholder="e.g., 'cozy comfort', 'mindful reflection', 'an exciting adventure'" value={mood} onChange={e => setMood(e.target.value)} />
        </div>
        <div className="mt-4">
          <Input label="Any preferred genres? (optional)" placeholder="e.g., Sci-Fi, Mystery" value={includeGenres} onChange={e => setIncludeGenres(e.target.value)} />
        </div>
        <div className="mt-4 flex items-center">
          <input type="checkbox" id="web-context" checked={webContextOk} onChange={e => setWebContextOk(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-forest focus:ring-forest" />
          <label htmlFor="web-context" className="ml-2 block text-sm text-gray-900">Allow web search for better results</label>
        </div>
        <Button onClick={handleFindGift} disabled={isLoading} className="w-full mt-6" size="lg">
          {isLoading ? 'Thinking...' : 'Find My Gift'}
        </Button>
      </div>

      {error && <div className="mt-6 text-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg max-w-2xl mx-auto" role="alert">{error}</div>}
      {message && <div className="mt-6 text-center bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-lg max-w-2xl mx-auto" role="alert">{message}</div>}

      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest mx-auto"></div>
          <p className="mt-4 text-gray-600">Kenya is carefully selecting some books...</p>
        </div>
      )}

      {!isLoading && recommendations.length > 0 && (
        <div className="mt-12">
          <h2 className="font-serif text-3xl font-bold text-deep-blue mb-6 border-b-2 border-accent pb-2 text-center">Here's What I Found For You</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recommendations.map((rec) => <RecommendationCard key={rec.book.id} rec={rec} />)}
          </div>

          {pairings.length > 0 && (
            <div className="mt-12">
              <h2 className="font-serif text-3xl font-bold text-deep-blue mb-6 border-b-2 border-accent pb-2 text-center">Create a Themed Gift</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {pairings.map((pairing, index) => (
                  <div key={index} className="bg-white p-6 rounded-lg shadow-md border-t-4 border-forest">
                    <h3 className="font-serif text-xl font-bold text-forest mb-3">{pairing.theme}</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {pairing.items.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {citations.length > 0 && (
            <div className="mt-12 text-center max-w-3xl mx-auto">
              <h3 className="font-serif text-xl font-bold text-deep-blue mb-3">Sourced with help from the web</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                {citations.map((cite, index) => (
                  <li key={index}>
                    <a href={cite.uri} target="_blank" rel="noopener noreferrer" className="underline hover:text-forest transition-colors">
                      {cite.title || 'Source'}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GiftFinderPage;
