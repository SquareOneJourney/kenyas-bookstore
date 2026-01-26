import React, { useState } from 'react';
import { Book, BookCondition, SupplySource } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { formatMoneyFromCents } from '../../lib/money';
import CoverSearchModal from './CoverSearchModal';

interface EditBookModalProps {
    book: Book;
    onClose: () => void;
    onSave: (id: string, updates: Partial<Book>) => void;
}

const EditBookModal: React.FC<EditBookModalProps> = ({ book, onClose, onSave }) => {
    const [title, setTitle] = useState(book.title);
    const [author, setAuthor] = useState(book.author);
    const [price, setPrice] = useState(
        book.list_price_cents
            ? (book.list_price_cents / 100).toFixed(2)
            : (book.price ? book.price.toFixed(2) : '')
    );
    const [stock, setStock] = useState(book.stock?.toString() || '0');
    const [condition, setCondition] = useState<BookCondition>((book.condition as BookCondition) || 'New');
    const [source, setSource] = useState<SupplySource>((book.supply_source as SupplySource) || 'local');
    const [location, setLocation] = useState(book.location || '');
    const [coverUrl, setCoverUrl] = useState(book.cover_url || '');

    // AI Analysis State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showCoverSearch, setShowCoverSearch] = useState(false);
    const [aiRationale, setAiRationale] = useState('');

    const handleRefreshData = async () => {
        const isbn = book.isbn || book.isbn13 || book.isbn10;
        if (!isbn) {
            alert("No ISBN found for this book.");
            return;
        }

        setIsRefreshing(true);
        try {
            // dynamic import to avoid circular dependencies if any (though Service is safe)
            const { BookService } = await import('../../services/bookService');
            const freshData = await BookService.fetchBookDataByISBN(isbn);

            if (freshData) {
                if (freshData.title) setTitle(freshData.title);
                if (freshData.author) setAuthor(freshData.author);
                if (freshData.cover_url) setCoverUrl(freshData.cover_url);

                // Also update price if we have it and current is empty? Maybe later.
                alert("Metadata refreshed! Click 'Save' to apply.");
            } else {
                alert("Could not find data for this ISBN.");
            }
        } catch (e) {
            console.error(e);
            alert("Failed to refresh data.");
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'analyze',
                    type: 'analyze',
                    payload: {
                        title: title,
                        author: author,
                        format: 'paperback' // Default assumption
                    }
                })
            });

            if (!response.ok) throw new Error('Analysis failed');

            const data = await response.json();
            if (data.suggested_price) {
                setPrice(data.suggested_price.toFixed(2));
                setAiRationale(data.rationale || "Price suggested by AI based on market data.");
            }
        } catch (error) {
            console.error("AI Price Check Failed:", error);
            alert("Could not fetch AI pricing. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSave = () => {
        onSave(book.id, {
            title,
            author,
            list_price_cents: Math.round(parseFloat(price) * 100),
            stock: parseInt(stock),
            condition,
            supply_source: source,
            location,
            cover_url: coverUrl
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-2xl font-serif font-bold text-deep-blue">Edit Inventory</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-8 max-h-[70vh] overflow-y-auto">
                    <div className="flex gap-6 mb-8">
                        <div className="w-24 shrink-0 relative group">
                            <img src={coverUrl} alt={title} className="w-full rounded-lg shadow-md aspect-[2/3] object-cover" />
                            <button
                                onClick={() => setShowCoverSearch(true)}
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity rounded-lg"
                            >
                                CHANGE
                            </button>
                        </div>
                        <div className="grow space-y-4">
                            <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} />
                            <Input label="Author" value={author} onChange={e => setAuthor(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Price ($)</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleRefreshData}
                                        disabled={isRefreshing}
                                        className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                        {isRefreshing ? <span className="animate-spin">↻</span> : '↻ REFRESH DATA'}
                                    </button>
                                    <button
                                        onClick={handleAnalyze}
                                        disabled={isAnalyzing}
                                        className="text-[10px] font-bold text-forest hover:underline flex items-center gap-1"
                                    >
                                        {isAnalyzing ? (
                                            <span className="animate-pulse">ANALYZING...</span>
                                        ) : (
                                            <>
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                                                ASK AI
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                            <input
                                type="number"
                                step="0.01"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-bold text-lg focus:ring-2 focus:ring-forest/20 focus:border-forest outline-none transition-all"
                            />
                            {aiRationale && (
                                <p className="text-xs text-green-700 bg-green-50 p-2 rounded-lg mt-1">{aiRationale}</p>
                            )}
                        </div>
                        <div className="space-y-4">
                            <Input label="Stock" type="number" value={stock} onChange={e => setStock(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <Select label="Condition" value={condition} onChange={e => setCondition(e.target.value as BookCondition)}>
                            <option value="New">New</option>
                            <option value="Used - Like New">Like New</option>
                            <option value="Used - Good">Good</option>
                        </Select>
                        <Select label="Source" value={source} onChange={e => setSource(e.target.value as SupplySource)}>
                            <option value="local">Local Stock</option>
                            <option value="ingram">Ingram Drop-ship</option>
                        </Select>
                    </div>

                    {source === 'local' && (
                        <div className="mt-6">
                            <Input label="Shelf Location / Bin" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. A-4, Warehouse 1" />
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 rounded-full font-bold text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
                    <Button onClick={handleSave} className="shadow-lg shadow-forest/20">Save Changes</Button>
                </div>
            </div>
            {showCoverSearch && (
                <CoverSearchModal
                    initialQuery={`${title} ${author}`}
                    onSelect={(url) => {
                        setCoverUrl(url);
                        setShowCoverSearch(false);
                    }}
                    onClose={() => setShowCoverSearch(false)}
                />
            )}
        </div>
    );
};

export default EditBookModal;
