
import React, { useState, useEffect } from 'react';
import { useBooks } from '../../hooks/useBooks';
import { Book } from '../../types';
import Button from '../../components/ui/Button';
import { formatMoneyFromCents } from '../../lib/money';

const AdminMarketingPage: React.FC = () => {
    const { getBooks, addBooks, updateBook } = useBooks(); // Added updateBook
    const [books, setBooks] = useState<Book[]>([]);
    const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
    const [generatedBundle, setGeneratedBundle] = useState<{ name: string, description: string, price_cents: number } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        getBooks().then(setBooks);
    }, [getBooks]);

    const toggleBookSelection = (id: string) => {
        setSelectedBooks(prev =>
            prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
        );
    };

    const handleToggleFeatured = async (book: Book) => {
        try {
            await updateBook(book.id, { is_featured: !book.is_featured });
            // Optimistic update locally
            setBooks(prev => prev.map(b => b.id === book.id ? { ...b, is_featured: !b.is_featured } : b));
        } catch (e) {
            console.error("Failed to toggle features", e);
            alert("Failed to update book");
        }
    };

    const handleGenerateBundle = async () => {
        if (selectedBooks.length < 2) return;
        setIsLoading(true);

        try {
            const selectedData = books.filter(b => selectedBooks.includes(b.id));

            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'bundle',
                    books: selectedData.map(b => ({ title: b.title, author: b.author, genre: b.genre }))
                })
            });

            if (!response.ok) {
                // Mock response if AI service fails or not implemented
                // throw new Error('Failed to generate bundle');
                setGeneratedBundle({
                    name: "Curated Collection",
                    description: "A selection of fine books.",
                    price_cents: Math.round(selectedData.reduce((s, b) => s + (b.list_price_cents || 0), 0) * 0.85)
                });
                return;
            }

            const data = await response.json();

            const totalPriceCents = selectedData.reduce((sum, b) => sum + (b.list_price_cents ?? 0), 0);
            const discountPriceCents = Math.round(totalPriceCents * 0.85); // 15% discount for bundles

            setGeneratedBundle({
                name: data.name || "New Book Bundle",
                description: data.description || "A curated collection of books.",
                price_cents: discountPriceCents
            });

        } catch (e) {
            console.error(e);
            // Fallback for demo
            const selectedData = books.filter(b => selectedBooks.includes(b.id));
            setGeneratedBundle({
                name: "Curated Collection",
                description: "A selection of fine books.",
                price_cents: Math.round(selectedData.reduce((s, b) => s + (b.list_price_cents || 0), 0) * 0.85)
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateBundle = async () => {
        if (!generatedBundle) return;

        const newBundle: Book = {
            id: self.crypto.randomUUID(),
            title: generatedBundle.name,
            author: "Kenya's Bookstore Bundles", // Virtual Author
            description: generatedBundle.description,
            isbn13: null,
            isbn10: null,
            list_price_cents: generatedBundle.price_cents,
            stock: 99, // Virtual stock for now
            condition: 'New',
            supply_source: 'bundle', // Mark as bundle
            tags: ['Bundle', ...selectedBooks], // Store component IDs in tags for reference
            cover_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1000', // Generic Bundle Image
            is_active: true,
            created_at: new Date().toISOString(),
            genre: "Book Bundle"
        };

        try {
            await addBooks([newBundle]);
            alert(`Bundle "${generatedBundle.name}" created successfully! Check the Library.`);
            setGeneratedBundle(null);
            setSelectedBooks([]);
        } catch (err) {
            console.error(err);
            alert("Failed to create bundle.");
        }
    };

    return (
        <div>
            <h1 className="font-serif text-4xl font-bold text-deep-blue mb-2">Marketing & Bundles</h1>
            <p className="text-gray-600 mb-8">Move slow inventory by creating curated, AI-named bundles.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* INVENTORY SELECTOR */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-bold mb-4">Select Inventory for Bundle</h2>
                        <div className="overflow-y-auto max-h-[400px] space-y-2">
                            {books.filter(b => b.genre !== 'Book Bundle').map(book => (
                                <div key={book.id}
                                    onClick={() => toggleBookSelection(book.id)}
                                    className={`p-3 rounded border flex justify-between items-center cursor-pointer transition-colors ${selectedBooks.includes(book.id) ? 'border-forest bg-forest/5' : 'border-gray-200 hover:border-accent'}`}>
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" checked={selectedBooks.includes(book.id)} readOnly className="h-4 w-4 text-forest" />
                                        <img src={book.cover_url || '/placeholder-book.png'} className="w-8 h-12 object-cover rounded" alt="" />
                                        <div>
                                            <p className="font-medium text-sm">{book.title}</p>
                                            <p className="text-xs text-gray-500">{book.stock ?? 0} in stock • {book.condition || 'New'}</p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-sm">
                                        {formatMoneyFromCents(book.list_price_cents ?? 0, 'USD')}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* FEATURED BOOKS MANAGER */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-bold mb-4">Featured Books Manager</h2>
                        <p className="text-sm text-gray-600 mb-4">Select books to feature on the Home Page hero section.</p>
                        <div className="overflow-y-auto max-h-[400px] space-y-2">
                            {books.filter(b => b.genre !== 'Book Bundle').map(book => (
                                <div key={book.id} className="flex justify-between items-center p-3 border-b hover:bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <img src={book.cover_url || '/placeholder-book.png'} className="w-10 h-14 object-cover rounded" alt="" />
                                        <div>
                                            <p className="font-medium text-sm text-deep-blue">{book.title}</p>
                                            <p className="text-xs text-gray-500">by {book.author}</p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant={book.is_featured ? 'primary' : 'outline'}
                                        onClick={() => handleToggleFeatured(book)}
                                    >
                                        {book.is_featured ? 'Featured ★' : 'Feature'}
                                    </Button>
                                </div>
                            ))}
                        </div>
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

                                {/* List included books */}
                                <div className="mb-4 bg-black/20 p-3 rounded text-sm space-y-1">
                                    <p className="text-xs font-bold text-accent uppercase mb-2">Included Books:</p>
                                    {books.filter(b => selectedBooks.includes(b.id)).map(b => (
                                        <div key={b.id} className="flex justify-between">
                                            <span className="truncate pr-2">• {b.title}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-between items-center border-t border-white/20 pt-4">
                                    <span className="text-sm">Bundle Price</span>
                                    <span className="text-xl font-bold text-accent">
                                        {formatMoneyFromCents(generatedBundle.price_cents)}
                                    </span>
                                </div>
                                <button
                                    onClick={handleCreateBundle}
                                    className="w-full mt-4 py-2 bg-green-700 hover:bg-green-600 rounded text-sm font-bold transition-colors shadow-lg"
                                >
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
