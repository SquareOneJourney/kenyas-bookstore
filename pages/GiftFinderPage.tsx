
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Book } from '../types';
import { useBooks } from '../hooks/useBooks';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { Link } from 'react-router-dom';
import { env } from '../lib/env';
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

// Gemini's expected response structure
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

interface GeminiGiftResponse {
  recommendations: GeminiRecommendation[];
  optionalPairings: OptionalPairing[];
  refineFiltersMessage?: string;
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
      const ai = new GoogleGenAI({ apiKey: env.gemini.apiKey || '' });

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

      const prompt = `
        Role

        You are Kenya, the mindful owner of a small online bookstore. Your job is to help people find the right book as a gift, drawing on (a) the user’s answers (recipient, mood, genres, budget), (b) the store’s local catalog (provided at runtime), and (c) reputable web sources for context (awards lists, notable reviews, author interviews, year-end lists). You must always prefer in-stock catalog items and clearly mark when a great match is out-of-stock (offer an in-stock alternative).

        Goals

        - Suggest 3–6 strong book matches from the catalog ranked by fit.
        - For each pick, add a short, warm, Kenya-style note that explains why it fits the recipient & mood.
        - Propose optional pairings (gift add-ons, mini “kits”) based on themes/mood.
        - When you use web information, your citations will be automatically collected by the system.
        - Output in the JSON schema provided. Keep copy concise and readable in UI cards.

        Voice & Tone (Kenya)

        - Mindful, calm, human: “Let’s find something that truly resonates.”
        - Brief, confident guidance. Avoid jargon. No hype, no pushiness.
        - Never overwhelm—explain why succinctly.

        Inputs
        - catalog: ${JSON.stringify(catalogForPrompt)}
        - user_preferences: ${JSON.stringify(user_preferences)}
        - web_context_ok: ${webContextOk}

        Tools & Behaviors

        - If web_context_ok = true, use the web tool to search briefly for context that improves confidence (e.g., recent awards, critic praise, similar-book clusters).
        - Never recommend a title that isn’t in the catalog.
        - If inventory <= 0, set isOutOfStock: true and provide an in-stock alternative from the catalog.
        - Respect budget. If constraints are very tight, include a quick “Refine filters” message in the 'refineFiltersMessage' field.
        - Ranking heuristic (explain briefly in reasoning for each pick): 1) Mood & theme fit; 2) Recipient fit (audience, content); 3) In-stock & budget; 4) Recent acclaim (with citations).

        Your entire output must be a single, valid JSON object that adheres to the schema provided in the 'config' of this request. Do not include any text outside of the JSON object.
      `;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          recommendations: {
            type: Type.ARRAY,
            description: "An array of 3-6 recommended books, ranked by relevance.",
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "The exact title of the book from the catalog." },
                author: { type: Type.STRING, description: "The exact author of the book from the catalog." },
                kenyaNote: { type: Type.STRING, description: "A short, warm, Kenya-style note explaining why it's a good fit." },
                isOutOfStock: { type: Type.BOOLEAN, description: "Set to true if the book's inventory is 0." },
                inStockAlternative: {
                  type: Type.OBJECT,
                  description: "An in-stock alternative if the primary recommendation is out of stock. Optional.",
                  properties: {
                    title: { type: Type.STRING, description: "The title of the alternative book." },
                    author: { type: Type.STRING, description: "The author of the alternative book." },
                  }
                }
              },
              required: ["title", "author", "kenyaNote", "isOutOfStock"]
            }
          },
          optionalPairings: {
            type: Type.ARRAY,
            description: "An array of 1-2 optional gift pairings or mini-kits based on themes.",
            items: {
              type: Type.OBJECT,
              properties: {
                theme: { type: Type.STRING, description: "The theme of the pairing, e.g., 'A Cozy Reading Night'." },
                items: {
                  type: Type.ARRAY,
                  description: "A list of items for the gift kit.",
                  items: { type: Type.STRING }
                }
              },
              required: ["theme", "items"]
            }
          },
          refineFiltersMessage: {
            type: Type.STRING,
            description: "A brief message to the user if their filters are too restrictive. Optional."
          }
        },
        required: ["recommendations"]
      };

      const genAIConfig = {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        ...(webContextOk && { tools: [{ googleSearch: {} }] })
      };

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: genAIConfig
      });
      
      const text = response.text.replace(/```json|```/g, '').trim();
      const parsedResponse: GeminiGiftResponse = JSON.parse(text);

      if (parsedResponse.refineFiltersMessage) {
        setMessage(parsedResponse.refineFiltersMessage);
      }

      if (!parsedResponse.recommendations || parsedResponse.recommendations.length === 0) {
        setError("I couldn't find a perfect match in our library. Try describing it a bit differently!");
        setIsLoading(false);
        return;
      }

      // FIX: Explicitly set the return type of the map function to `Recommendation | null` to help TypeScript's type inference.
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
      
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        const webCitations = groundingChunks
          .filter(chunk => chunk.web)
          .map(chunk => ({
              uri: chunk.web.uri,
              title: chunk.web.title
          }));
        setCitations(webCitations);
      }

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
          Let’s find something that truly resonates. Tell me a bit about who this gift is for, and I'll find the perfect book from our collection.
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
