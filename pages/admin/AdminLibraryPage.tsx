
import React, { useState, useRef, useEffect } from 'react';
import { useBooks } from '../../hooks/useBooks';
import { Book, BookCondition, SupplySource } from '../../types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { BookService } from '../../services/bookService';
import { IngramService } from '../../services/ingramService';
import { formatMoneyFromCents } from '../../lib/money';

import BarcodeScanner from '../../components/admin/BarcodeScanner';
import { BOOKS as MOCK_BOOKS } from '../../lib/mockData';

const AdminLibraryPage: React.FC = () => {
    const { getBooks, addBooks } = useBooks();
    const [books, setBooks] = useState<Book[]>([]);

    const [mode, setMode] = useState<'view' | 'scan'>('view');
    const [scanMethod, setScanMethod] = useState<'manual' | 'camera'>('manual');

    const [scanIsbn, setScanIsbn] = useState('');
    const [scannedBook, setScannedBook] = useState<Partial<Book> | null>(null);
    const [isFetching, setIsFetching] = useState(false);
    const [debugError, setDebugError] = useState<string | null>(null);
    const scanInputRef = useRef<HTMLInputElement>(null);

    const [formCondition, setFormCondition] = useState<BookCondition>('New');
    const [formLocation, setFormLocation] = useState('');
    const [formPrice, setFormPrice] = useState('');
    const [formStock, setFormStock] = useState('1');
    const [formSource, setFormSource] = useState<SupplySource>('local');
    const [ingramStatus, setIngramStatus] = useState<any>(null);

    useEffect(() => {
        getBooks().then(setBooks);
    }, [getBooks]);

    useEffect(() => {
        if (mode === 'scan' && scanInputRef.current) {
            scanInputRef.current.focus();
        }
    }, [mode, scannedBook]);

    const processIsbn = async (isbn: string) => {
        console.log("Processing Scanned ISBN:", isbn);
        if (!isbn.trim()) return;

        // Avoid re-processing if we are already busy with this exact ISBN? 
        // Ideally we want to allow re-scans, but maybe debounce camera input.
        // For now, simple busy check:
        // Actually, don't return if isFetching, just set it true. 
        // But for camera specifically, we want to pause.

        setIsFetching(true);
        setScannedBook(null);
        setIngramStatus(null);
        setScanIsbn(isbn); // Ensure input reflects the scan

        // 1. Fetch Hard Facts
        let bookData = await BookService.fetchBookDataByISBN(isbn);

        if (bookData) {
            // 2. Enrich with AI
            const enrichedData = await BookService.enrichBookData(bookData);
            setScannedBook(enrichedData);
            const suggestedPrice = enrichedData.list_price_cents
                ? (enrichedData.list_price_cents / 100).toFixed(2)
                : '';
            setFormPrice(suggestedPrice);

            // 3. Optional Ingram check
            const ingram = await IngramService.checkStockAndPrice(isbn);
            if (ingram) setIngramStatus(ingram);
        } else {
            alert("Book not found. You may need to enter details manually.");
        }

        setIsFetching(false);
    };

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();
        await processIsbn(scanIsbn);
    };

    const handleCameraScan = (decodedText: string) => {
        // If we are already fetching, ignore new scans to prevent flood
        if (isFetching) return;

        // Additional check: if duplicate scan of the *same* book effectively?
        // For now, let's just process it.
        processIsbn(decodedText);
    };

    const handleSaveScannedBook = () => {
        if (!scannedBook) return;

        const priceCents = Math.round((parseFloat(formPrice) || 0) * 100);
        const newBook: Book = {
            id: `INV-${Date.now()}`,
            title: scannedBook.title || "Unknown",
            author: scannedBook.author || "Unknown",
            genre: scannedBook.genre || "General",
            list_price_cents: priceCents || null,
            stock: formSource === 'ingram' ? 999 : (parseInt(formStock) || 1),
            isbn13: scannedBook.isbn13 || (scanIsbn.length === 13 ? scanIsbn : null),
            isbn10: scannedBook.isbn10 || (scanIsbn.length === 10 ? scanIsbn : null),
            description: scannedBook.description || "",
            cover_url: scannedBook.cover_url || "https://picsum.photos/200/300",
            condition: formCondition,
            location: formSource === 'ingram' ? 'Ingram Warehouse' : formLocation,
            tags: scannedBook.tags || [],
            supply_source: formSource,
            cost_basis: ingramStatus?.wholesalePrice || 0,
            currency: scannedBook.currency || 'USD',
            is_active: true,
            created_at: scannedBook.created_at || new Date().toISOString(),
            updated_at: scannedBook.updated_at || new Date().toISOString(),
        };

        addBooks([newBook]);
        setBooks(prev => [newBook, ...prev]);

        setScannedBook(null);
        setScanIsbn('');
        setFormLocation('');
        setFormStock('1');
        setIngramStatus(null);
        if (scanInputRef.current) scanInputRef.current.focus();
    };

    return (
        <div className="pb-24 pt-4 md:pt-0">
            {/* Desktop Header */}
            <div className="hidden md:flex justify-between items-center mb-10">
                <div>
                    <h1 className="font-serif text-5xl font-bold text-deep-blue tracking-tight">Inventory</h1>
                    <p className="text-gray-500 mt-2 font-medium">Manage your bookstore's physical and digital catalog.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" size="sm" onClick={() => addBooks(MOCK_BOOKS)}>Seed Data</Button>
                    <Button
                        variant={mode === 'scan' ? 'primary' : 'outline'}
                        onClick={() => {
                            setMode(mode === 'scan' ? 'view' : 'scan');
                            setScanMethod('manual');
                        }}
                    >
                        {mode === 'scan' ? 'Close Scanner' : 'Quick Add / Scan'}
                    </Button>
                </div>
            </div>

            {/* Mobile Header (Minimal) */}
            <div className="md:hidden mb-6 flex justify-between items-center px-2">
                <h1 className="font-serif text-3xl font-bold text-deep-blue">Library</h1>
                <div className="text-xs font-bold text-forest bg-forest/10 px-3 py-1 rounded-full uppercase tracking-widest">
                    Admin
                </div>
            </div>

            {mode === 'scan' && (
                <div className="mb-10 max-w-4xl mx-auto">
                    <div className="glass-panel p-6 md:p-10 rounded-[2rem] relative overflow-hidden">
                        {/* Decorative Background Element */}
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-forest/5 rounded-full blur-3xl -z-10"></div>

                        <div className="flex justify-center mb-8 bg-gray-100/50 p-1.5 rounded-full w-fit mx-auto ring-1 ring-black/5">
                            <button
                                onClick={() => setScanMethod('manual')}
                                className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${scanMethod === 'manual' ? 'bg-forest text-cream shadow-lg shadow-forest/20' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                MANUAL ENTRY
                            </button>
                            <button
                                onClick={() => setScanMethod('camera')}
                                className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${scanMethod === 'camera' ? 'bg-forest text-cream shadow-lg shadow-forest/20' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                CAMERA SCAN
                            </button>
                        </div>

                        {scanMethod === 'camera' ? (
                            <div className="mb-10 max-w-md mx-auto">
                                <BarcodeScanner
                                    onScanSuccess={handleCameraScan}
                                    onScanFailure={(err) => console.log(err)}
                                />
                            </div>
                        ) : (
                            <form onSubmit={handleScan} className="max-w-xl mx-auto mb-10">
                                <div className="group relative">
                                    <input
                                        ref={scanInputRef}
                                        type="text"
                                        className="w-full text-center text-3xl font-bold tracking-[0.2em] p-6 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-forest/15 focus:border-forest outline-none transition-all placeholder:text-gray-300"
                                        placeholder="0000000000000"
                                        value={scanIsbn}
                                        onChange={(e) => setScanIsbn(e.target.value)}
                                        disabled={isFetching}
                                        autoFocus
                                    />
                                    {isFetching && (
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                            <div className="animate-spin h-6 w-6 border-2 border-forest border-t-transparent rounded-full"></div>
                                        </div>
                                    )}
                                </div>
                                <p className="text-center text-gray-400 text-xs mt-4 font-medium tracking-wide uppercase">Enter ISBN-13 or ISBN-10</p>
                            </form>
                        )}

                        {scannedBook && (
                            <div className="bg-white p-6 md:p-8 rounded-3xl border border-black/5 shadow-2xl flex flex-col md:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="w-40 mx-auto md:mx-0 flex-shrink-0">
                                    <div className="relative group">
                                        <img src={scannedBook.cover_url} alt="Cover" className="w-full aspect-[2/3] object-cover rounded-xl shadow-xl transition-transform group-hover:scale-105" />
                                        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/10"></div>
                                    </div>
                                    {ingramStatus && (
                                        <div className="mt-6 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl overflow-hidden">
                                            <p className="font-bold text-[9px] text-indigo-900 uppercase tracking-widest mb-2 opacity-60">Ingram Insights</p>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] text-indigo-700">Stock</span>
                                                <span className="text-[10px] font-bold text-indigo-900">{ingramStatus.stockLevel}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-indigo-700">Cost</span>
                                                <span className="text-[10px] font-bold text-indigo-900">${ingramStatus.wholesalePrice.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-grow space-y-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-deep-blue leading-tight">{scannedBook.title}</h3>
                                        <p className="text-gray-500 font-medium">by {scannedBook.author}</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                                        <div className="space-y-5">
                                            <Select label="Supply Source" value={formSource} onChange={e => setFormSource(e.target.value as SupplySource)}>
                                                <option value="local">Local Physical Stock</option>
                                                <option value="ingram">Ingram Drop-ship</option>
                                            </Select>
                                            <Select label="Condition" value={formCondition} onChange={e => setFormCondition(e.target.value as BookCondition)}>
                                                <option value="New">New</option>
                                                <option value="Used - Like New">Like New</option>
                                                <option value="Used - Good">Good</option>
                                            </Select>
                                        </div>

                                        <div className="space-y-5">
                                            <Input label="Sale Price ($)" type="number" step="0.01" value={formPrice} onChange={e => setFormPrice(e.target.value)} />
                                            {formSource === 'local' && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <Input label="Quantity" type="number" value={formStock} onChange={e => setFormStock(e.target.value)} />
                                                    <Input label="Bin" placeholder="A-1" value={formLocation} onChange={e => setFormLocation(e.target.value)} />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-6">
                                        <button
                                            onClick={() => setScannedBook(null)}
                                            className="px-6 py-3 rounded-full text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            DISCARD
                                        </button>
                                        <Button onClick={handleSaveScannedBook} className="px-10 h-12 shadow-xl shadow-forest/20">
                                            SAVE TO CATALOG
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Inventory Feed (Mobile Cards / Desktop Grid) */}
            <div className="space-y-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6 md:space-y-0">
                {books.map((book) => (
                    <div key={book.id} className="admin-card group">
                        <div className="flex md:flex-col h-full">
                            {/* Card Image */}
                            <div className="w-24 md:w-full aspect-[2/3] md:aspect-[3/4] relative overflow-hidden flex-shrink-0 bg-gray-100">
                                <img
                                    src={book.cover_url || '/placeholder-book.png'}
                                    alt={book.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

                                {/* Quick Badges */}
                                <div className="absolute top-2 left-2 flex flex-col gap-1">
                                    <span className={`status-badge border ${book.supply_source === 'ingram' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                        {book.supply_source || 'local'}
                                    </span>
                                </div>
                            </div>

                            {/* Card Content */}
                            <div className="flex-grow p-4 md:p-5 flex flex-col justify-between">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-deep-blue text-sm md:text-base line-clamp-2 leading-snug group-hover:text-forest transition-colors">
                                        {book.title}
                                    </h3>
                                    <p className="text-[10px] md:text-xs text-gray-500 font-medium line-clamp-1">by {book.author}</p>

                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[10px] font-mono text-gray-400">{book.isbn13 || book.isbn10 || 'NO ISBN'}</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Price</span>
                                        <span className="text-sm md:text-base font-bold text-deep-blue">
                                            {formatMoneyFromCents(book.list_price_cents ?? 0, book.currency || 'USD')}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Stock</span>
                                        {book.supply_source === 'ingram' ? (
                                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">AUTO</span>
                                        ) : (
                                            <span className={`text-sm font-bold ${book.stock && book.stock < 5 ? 'text-rose-500' : 'text-forest'}`}>
                                                {book.stock ?? 0}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="bottom-nav">
                <button
                    onClick={() => setMode('view')}
                    className={`nav-item ${mode === 'view' ? 'active' : ''}`}
                >
                    <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="nav-label text-[10px]">LIBRARY</span>
                </button>

                <button
                    onClick={() => {
                        setMode('scan');
                        setScanMethod('camera');
                    }}
                    className={`nav-item ${mode === 'scan' ? 'active' : ''}`}
                >
                    <div className={`p-3 -mt-10 rounded-full shadow-lg transition-transform ${mode === 'scan' ? 'bg-forest text-cream scale-110' : 'bg-white text-gray-400 hover:scale-105'}`}>
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                    </div>
                    <span className="nav-label mt-1">SCAN</span>
                </button>

                <button
                    onClick={() => setMode('view')} // Placeholder for analytics
                    className="nav-item opacity-50"
                >
                    <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="nav-label">INSIGHTS</span>
                </button>
            </nav>
        </div>
    );
};

export default AdminLibraryPage;
