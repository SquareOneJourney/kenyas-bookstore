import React, { useState, useEffect } from 'react';
import { Book } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface CoverSearchModalProps {
    initialQuery: string;
    onSelect: (url: string) => void;
    onClose: () => void;
}

const CoverSearchModal: React.FC<CoverSearchModalProps> = ({ initialQuery, onSelect, onClose }) => {
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<Partial<Book>[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [customUrl, setCustomUrl] = useState('');

    useEffect(() => {
        handleSearch();
    }, []);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setIsLoading(true);
        try {
            const { BookService } = await import('../../services/bookService');
            const books = await BookService.searchBooks(query);
            setResults(books.filter(b => b.cover_url)); // Only show books with covers
        } catch (e) {
            console.error("Search failed:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCustomUrlSubmit = () => {
        if (customUrl) onSelect(customUrl);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-deep-blue">Select Cover Image</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-gray-100 flex gap-2">
                    <div className="grow">
                        <Input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search by Title, Author, or ISBN..."
                            className="bg-gray-50"
                        />
                    </div>
                    <Button onClick={handleSearch} disabled={isLoading}>
                        {isLoading ? 'Searching...' : 'Search'}
                    </Button>
                </div>

                {/* Results Grid */}
                <div className="grow overflow-y-auto p-6 bg-gray-50/30">
                    {results.length === 0 && !isLoading && (
                        <div className="text-center text-gray-400 py-10">
                            No results found. Try a different search term.
                        </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {results.map((book, idx) => (
                            <div
                                key={idx}
                                onClick={() => book.cover_url && onSelect(book.cover_url)}
                                className="group cursor-pointer relative aspect-[2/3] bg-gray-200 rounded-lg overflow-hidden border-2 border-transparent hover:border-forest transition-all"
                            >
                                <img src={book.cover_url!} alt={book.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                    <p className="text-white text-xs font-bold line-clamp-2">{book.title}</p>
                                    <p className="text-gray-300 text-[10px] truncate">{(book as any).publishedDate?.substring(0, 4)} • {(book as any).publisher}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer / Custom URL */}
                <div className="p-4 border-t border-gray-100 bg-white">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Or Paste Direct URL</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="grow bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm"
                            placeholder="https://example.com/image.jpg"
                            value={customUrl}
                            onChange={e => setCustomUrl(e.target.value)}
                        />
                        <button
                            onClick={handleCustomUrlSubmit}
                            disabled={!customUrl}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm font-bold text-gray-700"
                        >
                            Use URL
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoverSearchModal;
