
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
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'library' | 'scan' | 'insights'>('library');

    const [mode, setMode] = useState<'view' | 'scan'>('view');
    const [scanMethod, setScanMethod] = useState<'manual' | 'camera'>('manual');

    // ... (rest of states)
    const [scanIsbn, setScanIsbn] = useState('');
    const [scannedBook, setScannedBook] = useState<Partial<Book> | null>(null);
    const [isFetching, setIsFetching] = useState(false);
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
        if (activeTab === 'scan' && scanInputRef.current && scanMethod === 'manual') {
            scanInputRef.current.focus();
        }
    }, [activeTab, scannedBook, scanMethod]);

    const processIsbn = async (isbn: string) => {
        setIsFetching(true);
        setScannedBook(null);
        setIngramStatus(null);
        setScanIsbn(isbn);

        let bookData = await BookService.fetchBookDataByISBN(isbn);

        if (bookData) {
            const enrichedData = await BookService.enrichBookData(bookData);
            setScannedBook(enrichedData);
            const suggestedPrice = enrichedData.list_price_cents
                ? (enrichedData.list_price_cents / 100).toFixed(2)
                : '';
            setFormPrice(suggestedPrice);

            const ingram = await IngramService.checkStockAndPrice(isbn);
            if (ingram) setIngramStatus(ingram);
        } else {
            alert("Book not found. You may need to enter details manually.");
        }

        setIsFetching(false);
    };

    const handleCameraScan = (decodedText: string) => {
        if (isFetching) return;
        processIsbn(decodedText);
    };

    const [scanSessionKey, setScanSessionKey] = useState(0);

    const handleSaveScannedBook = () => {
        if (!scannedBook) return;

        const priceCents = Math.round((parseFloat(formPrice) || 0) * 100);
        const newBook: Book = {
            id: self.crypto.randomUUID(), // Use standard UUID for Supabase
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
            is_active: true,
            created_at: scannedBook.created_at || new Date().toISOString(),
        };

        addBooks([newBook]);
        setBooks(prev => [newBook, ...prev]);

        setScannedBook(null);
        setScanIsbn('');
        setFormLocation('');
        setFormStock('1');
        setIngramStatus(null);
        setScanSessionKey(prev => prev + 1);
    };

    const filteredBooks = books.filter(b =>
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.isbn13 && b.isbn13.includes(searchQuery))
    );

    const stats = {
        totalBooks: books.length,
        totalStock: books.reduce((acc, b) => acc + (b.supply_source === 'ingram' ? 0 : (b.stock || 0)), 0),
        inventoryValue: books.reduce((acc, b) => acc + ((b.list_price_cents || 0) * (b.supply_source === 'ingram' ? 0 : (b.stock || 1))), 0) / 100,
        lowStockCount: books.filter(b => b.supply_source === 'local' && (b.stock || 0) < 5).length
    };

    const InsightsView = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Total Titles</p>
                    <p className="text-3xl font-serif font-bold text-deep-blue">{stats.totalBooks}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Stock Items</p>
                    <p className="text-3xl font-serif font-bold text-forest">{stats.totalStock}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Total Value</p>
                    <p className="text-2xl font-serif font-bold text-deep-blue">${stats.inventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Low Stock</p>
                    <p className="text-3xl font-serif font-bold text-rose-500">{stats.lowStockCount}</p>
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
                <h3 className="text-lg font-bold text-deep-blue mb-4">Inventory Health</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 font-medium">Local Stock Density</span>
                        <span className="font-bold text-deep-blue">{Math.round((stats.totalStock / (stats.totalBooks || 1)) * 100) / 100} per title</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-forest rounded-full" style={{ width: '65%' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="pb-32 pt-4 md:pt-0 px-4 md:px-0 max-w-full overflow-x-hidden">
            {/* Desktop Header */}
            <div className="hidden md:flex justify-between items-center mb-10">
                <div>
                    <h1 className="font-serif text-5xl font-bold text-deep-blue tracking-tight">Inventory</h1>
                    <p className="text-gray-500 mt-2 font-medium">Manage your bookstore's physical and digital catalog.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" size="sm" onClick={() => addBooks(MOCK_BOOKS)}>Seed Data</Button>
                    <Button
                        variant={activeTab === 'scan' ? 'primary' : 'outline'}
                        onClick={() => setActiveTab(activeTab === 'scan' ? 'library' : 'scan')}
                    >
                        {activeTab === 'scan' ? 'Close Scanner' : 'Quick Add / Scan'}
                    </Button>
                </div>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden mb-8 flex justify-between items-end">
                <div>
                    <p className="text-[10px] font-bold text-forest tracking-[0.2em] uppercase mb-1">Management</p>
                    <h1 className="font-serif text-4xl font-bold text-deep-blue">
                        {activeTab === 'library' && 'Library'}
                        {activeTab === 'scan' && 'Scanner'}
                        {activeTab === 'insights' && 'Insights'}
                    </h1>
                </div>
                <div className="flex flex-col items-end">
                    <div className="w-10 h-10 rounded-full bg-deep-blue flex items-center justify-center text-cream font-bold text-sm shadow-lg mb-1">
                        AD
                    </div>
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Admin</span>
                </div>
            </div>

            {/* Search Bar (Only for Library Tab) */}
            {activeTab === 'library' && (
                <div className="mb-8 relative group">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400 group-focus-within:text-forest transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search by title, author, or ISBN..."
                        className="w-full bg-white border border-black/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-medium shadow-sm focus:ring-4 focus:ring-forest/10 focus:border-forest outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            )}

            {activeTab === 'insights' && <InsightsView />}

            {activeTab === 'scan' && (
                <div className="mb-10 w-full max-w-4xl mx-auto">
                    <div className="glass-panel p-6 md:p-10 rounded-[2rem] relative overflow-hidden">
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
                                    key={scanSessionKey}
                                    onScanSuccess={handleCameraScan}
                                    onScanFailure={(err) => console.log(err)}
                                />
                            </div>
                        ) : (
                            <form onSubmit={(e) => { e.preventDefault(); processIsbn(scanIsbn); }} className="max-w-xl mx-auto mb-10">
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
                            </form>
                        )}

                        {scannedBook && (
                            <div className="bg-white p-6 md:p-8 rounded-3xl border border-black/5 shadow-2xl flex flex-col md:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="w-40 mx-auto md:mx-0 flex-shrink-0">
                                    <img src={scannedBook.cover_url} alt="Cover" className="w-full aspect-[2/3] object-cover rounded-xl shadow-xl transition-transform group-hover:scale-105" />
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
                                        <button onClick={() => setScannedBook(null)} className="px-6 py-3 rounded-full text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">DISCARD</button>
                                        <Button onClick={handleSaveScannedBook} className="px-10 h-12 shadow-xl shadow-forest/20">SAVE TO CATALOG</Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Inventory Feed (Only in Library Tab) */}
            {activeTab === 'library' && (
                <div className="space-y-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6 md:space-y-0">
                    {filteredBooks.map((book) => (
                        <div key={book.id} className="admin-card group">
                            <div className="flex md:flex-col h-full">
                                <div className="w-24 md:w-full aspect-[2/3] md:aspect-[3/4] relative overflow-hidden flex-shrink-0 bg-gray-100">
                                    <img src={book.cover_url || '/placeholder-book.png'} alt={book.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute top-2 left-2">
                                        <span className={`status-badge border ${book.supply_source === 'ingram' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                            {book.supply_source || 'local'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-grow p-4 md:p-5 flex flex-col justify-between">
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-deep-blue text-sm md:text-base line-clamp-2 leading-snug group-hover:text-forest transition-colors">{book.title}</h3>
                                        <p className="text-[10px] md:text-xs text-gray-500 font-medium line-clamp-1">by {book.author}</p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Price</span>
                                            <span className="text-sm md:text-base font-bold text-deep-blue">{formatMoneyFromCents(book.list_price_cents ?? 0, 'USD')}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Stock</span>
                                            <span className={`text-sm font-bold ${book.supply_source === 'ingram' ? 'text-blue-600' : (book.stock && book.stock < 5 ? 'text-rose-500' : 'text-forest')}`}>
                                                {book.supply_source === 'ingram' ? 'AUTO' : (book.stock ?? 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredBooks.length === 0 && (
                        <div className="col-span-full py-20 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-400">No books found</h3>
                            <p className="text-gray-400 text-sm">Try a different search term or add a new book.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Mobile Bottom Navigation */}
            <nav className="bottom-nav h-24">
                <button
                    onClick={() => setActiveTab('library')}
                    className={`nav-item flex-1 ${activeTab === 'library' ? 'active' : ''}`}
                >
                    <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="nav-label">LIBRARY</span>
                </button>

                <button
                    onClick={() => setActiveTab('scan')}
                    className={`nav-item flex-1 ${activeTab === 'scan' ? 'active' : ''}`}
                >
                    <div className={`p-4 -mt-12 rounded-full shadow-2xl transition-all duration-500 ${activeTab === 'scan' ? 'bg-forest text-cream scale-110 rotate-12' : 'bg-white text-gray-400 hover:scale-105'}`}>
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                    </div>
                    <span className="nav-label mt-2">SCAN</span>
                </button>

                <button
                    onClick={() => setActiveTab('insights')}
                    className={`nav-item flex-1 ${activeTab === 'insights' ? 'active' : ''}`}
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
