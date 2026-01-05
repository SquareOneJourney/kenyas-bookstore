
import React, { useState, useEffect } from 'react';
import { useBooks } from '../../hooks/useBooks';
import { Book } from '../../types';
import Button from '../../components/ui/Button';
import { GoogleGenAI } from '@google/genai';

const AdminMarketingPage: React.FC = () => {
  const { getBooks } = useBooks();
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [generatedBundle, setGeneratedBundle] = useState<{name: string, description: string, price: number} | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getBooks().then(setBooks);
  }, [getBooks]);

  const toggleBookSelection = (id: string) => {
    setSelectedBooks(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const handleGenerateBundle = async () => {
    if (selectedBooks.length < 2) return;
    setIsLoading(true);

    try {
        const selectedData = books.filter(b => selectedBooks.includes(b.id));
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const prompt = `
            I want to sell these specific books as a "Curated Bundle" or "Mystery Box".
            Books: ${selectedData.map(b => `"${b.title}" by ${b.author} (${b.genre})`).join(', ')}
            
            Create a marketing campaign for this bundle. Return JSON:
            {
                "name": "Creative catchy name for the bundle",
                "description": "2 sentences selling the 'vibe' of this combination."
            }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        
        const text = response.text.replace(/```json|```/g, '').trim();
        const data = JSON.parse(text);
        
        const totalPrice = selectedData.reduce((sum, b) => sum + b.price, 0);
        const discountPrice = totalPrice * 0.85; // 15% discount for bundles

        setGeneratedBundle({
            name: data.name,
            description: data.description,
            price: discountPrice
        });

    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div>
        <h1 className="font-serif text-4xl font-bold text-deep-blue mb-2">Marketing & Bundles</h1>
        <p className="text-gray-600 mb-8">Move slow inventory by creating curated, AI-named bundles.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* INVENTORY SELECTOR */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Select Inventory</h2>
                <div className="overflow-y-auto max-h-[500px] space-y-2">
                    {books.map(book => (
                        <div key={book.id} 
                             onClick={() => toggleBookSelection(book.id)}
                             className={`p-3 rounded border flex justify-between items-center cursor-pointer transition-colors ${selectedBooks.includes(book.id) ? 'border-forest bg-forest/5' : 'border-gray-200 hover:border-accent'}`}>
                            <div className="flex items-center gap-3">
                                <input type="checkbox" checked={selectedBooks.includes(book.id)} readOnly className="h-4 w-4 text-forest" />
                                <img src={book.coverUrl} className="w-8 h-12 object-cover rounded" alt="" />
                                <div>
                                    <p className="font-medium text-sm">{book.title}</p>
                                    <p className="text-xs text-gray-500">{book.stock} in stock • {book.condition}</p>
                                </div>
                            </div>
                            <p className="font-bold text-sm">${book.price}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* GENERATOR PANEL */}
            <div className="bg-deep-blue text-cream rounded-lg shadow-xl p-6 h-fit sticky top-6">
                <h2 className="text-xl font-bold mb-4">Bundle Creator</h2>
                <div className="space-y-4">
                    <p className="text-sm text-cream/80">Selected Items: {selectedBooks.length}</p>
                    <Button 
                        onClick={handleGenerateBundle} 
                        disabled={selectedBooks.length < 2 || isLoading}
                        className="w-full bg-accent text-deep-blue hover:bg-white"
                    >
                        {isLoading ? 'Dreaming up ideas...' : 'Generate Campaign'}
                    </Button>

                    {generatedBundle && (
                        <div className="mt-6 p-4 bg-white/10 rounded border border-white/20 animate-in fade-in">
                            <p className="text-xs text-accent uppercase tracking-wider mb-1">Proposed Bundle</p>
                            <h3 className="text-2xl font-serif font-bold mb-2">{generatedBundle.name}</h3>
                            <p className="text-sm italic mb-4 opacity-90">"{generatedBundle.description}"</p>
                            <div className="flex justify-between items-center border-t border-white/20 pt-4">
                                <span className="text-sm">Bundle Price</span>
                                <span className="text-xl font-bold text-accent">${generatedBundle.price.toFixed(2)}</span>
                            </div>
                            <button className="w-full mt-4 py-2 bg-green-700 hover:bg-green-600 rounded text-sm font-bold">
                                Create Product & Publish
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default AdminMarketingPage;
