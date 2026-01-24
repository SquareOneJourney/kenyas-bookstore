
import React, { useState, useRef, useEffect } from 'react';
import { useBooks } from '../../hooks/useBooks';
import { Book, BookCondition, SupplySource } from '../../types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { BookService } from '../../services/bookService';
import { IngramService } from '../../services/ingramService';

import BarcodeScanner from '../../components/admin/BarcodeScanner';
import { BOOKS as MOCK_BOOKS } from '../../lib/mockData';

// Define the runtime shape of Book objects (which differs from the strict DB type)
interface AppBook {
    id: string;
    title: string;
    author: string;
    genre: string;
    price: number;
    isbn: string;
    description: string;
    stock: number;
    coverUrl: string; // camelCase matching mockData
    condition: string;
    location: string;
    tags: string[];
    supplySource: string;
    costBasis?: number;
}

const AdminLibraryPage: React.FC = () => {
    const { getBooks, addBooks } = useBooks();
    const [books, setBooks] = useState<AppBook[]>([]);

    const [mode, setMode] = useState<'view' | 'scan'>('view');
    const [scanMethod, setScanMethod] = useState<'manual' | 'camera'>('manual');

    const [scanIsbn, setScanIsbn] = useState('');
    const [scannedBook, setScannedBook] = useState<Partial<AppBook> | null>(null);
    const [isFetching, setIsFetching] = useState(false);
    const scanInputRef = useRef<HTMLInputElement>(null);

    const [formCondition, setFormCondition] = useState<BookCondition>('New');
    const [formLocation, setFormLocation] = useState('');
    const [formPrice, setFormPrice] = useState('');
    const [formStock, setFormStock] = useState('1');
    const [formSource, setFormSource] = useState<SupplySource>('local');
    const [ingramStatus, setIngramStatus] = useState<any>(null);

    useEffect(() => {
        getBooks().then((data: any) => setBooks(data));
    }, [getBooks]);

    useEffect(() => {
        if (mode === 'scan' && scanInputRef.current) {
            scanInputRef.current.focus();
        }
    }, [mode, scannedBook]);

    const processIsbn = async (isbn: string) => {
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
            const appBookData = enrichedData as unknown as AppBook;
            setScannedBook(appBookData);
            setFormPrice(appBookData.price?.toString() || '');

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

        const newBook: AppBook = {
            id: `INV-${Date.now()}`,
            title: scannedBook.title || "Unknown",
            author: scannedBook.author || "Unknown",
            genre: scannedBook.genre || "General",
            price: parseFloat(formPrice) || 0,
            stock: formSource === 'ingram' ? 999 : (parseInt(formStock) || 1),
            isbn: scannedBook.isbn || scanIsbn,
            description: scannedBook.description || "",
            coverUrl: scannedBook.coverUrl || "https://picsum.photos/200/300",
            condition: formCondition,
            location: formSource === 'ingram' ? 'Ingram Warehouse' : formLocation,
            tags: scannedBook.tags || [],
            supplySource: formSource,
            costBasis: ingramStatus?.wholesalePrice || 0,
        };

        addBooks([newBook as unknown as Book]);
        setBooks(prev => [newBook, ...prev]);

        setScannedBook(null);
        setScanIsbn('');
        setFormLocation('');
        setFormStock('1');
        setIngramStatus(null);
        if (scanInputRef.current) scanInputRef.current.focus();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="font-serif text-4xl font-bold text-deep-blue">Inventory Management</h1>
                <div className="space-x-4">
                    <Button variant="outline" onClick={() => addBooks(MOCK_BOOKS as any[])}>Seed Mock Data</Button>
                    <Button variant={mode === 'view' ? 'primary' : 'outline'} onClick={() => setMode('view')}>View All</Button>
                    <Button variant={mode === 'scan' ? 'primary' : 'outline'} onClick={() => {
                        setMode('scan');
                        setScanMethod('manual');
                    }}>Quick Scan Mode</Button>
                </div>
            </div>

            {mode === 'scan' && (
                <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-forest/20 animate-in slide-in-from-top-4">
                    <div className="flex justify-center mb-6 gap-4">
                        <button
                            onClick={() => setScanMethod('manual')}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${scanMethod === 'manual' ? 'bg-forest text-cream' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Manual Entry
                        </button>
                        <button
                            onClick={() => setScanMethod('camera')}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${scanMethod === 'camera' ? 'bg-forest text-cream' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Camera Scan
                        </button>
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-deep-blue">Scanner Ready</h2>
                        <p className="text-gray-500">Scan ISBN to auto-populate from Google Books & Ingram.</p>
                    </div>

                    {scanMethod === 'camera' ? (
                        <div className="mb-8 max-w-lg mx-auto">
                            <BarcodeScanner
                                onScanSuccess={handleCameraScan}
                                onScanFailure={(err) => console.log(err)}
                            />
                        </div>
                    ) : (
                        <form onSubmit={handleScan} className="max-w-xl mx-auto mb-8">

                            <div className="relative">
                                <input
                                    ref={scanInputRef}
                                    type="text"
                                    className="w-full text-center text-2xl tracking-widest p-4 border-2 border-forest rounded-lg focus:ring-4 focus:ring-forest/30 focus:outline-none"
                                    placeholder="SCAN ISBN"
                                    value={scanIsbn}
                                    onChange={(e) => setScanIsbn(e.target.value)}
                                    disabled={isFetching}
                                    autoFocus
                                />
                                {isFetching && (
                                    <div className="absolute right-4 top-4">
                                        <div className="animate-spin h-6 w-6 border-2 border-forest border-t-transparent rounded-full"></div>
                                    </div>
                                )}
                            </div>
                        </form>
                    )}

                    {scannedBook && (
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex flex-col md:flex-row gap-8">
                            <div className="w-32 flex-shrink-0">
                                <img src={scannedBook.coverUrl} alt="Cover" className="w-full h-auto rounded shadow-md" />
                                {ingramStatus && (
                                    <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded text-[10px] text-blue-800">
                                        <p className="font-bold uppercase mb-1">Ingram Insight</p>
                                        <p>Stock: {ingramStatus.stockLevel}</p>
                                        <p>Wholesale: ${ingramStatus.wholesalePrice.toFixed(2)}</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <h3 className="text-xl font-bold text-deep-blue">{scannedBook.title}</h3>
                                    <p className="text-gray-600">by {scannedBook.author}</p>
                                </div>

                                <div className="space-y-4">
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

                                <div className="space-y-4">
                                    <Input label="Price ($)" type="number" step="0.01" value={formPrice} onChange={e => setFormPrice(e.target.value)} />
                                    {formSource === 'local' && (
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input label="Quantity" type="number" value={formStock} onChange={e => setFormStock(e.target.value)} />
                                            <Input label="Bin Location" placeholder="A-1" value={formLocation} onChange={e => setFormLocation(e.target.value)} />
                                        </div>
                                    )}
                                </div>

                                <div className="col-span-2 flex justify-end gap-4 mt-4">
                                    <Button variant="outline" onClick={() => setScannedBook(null)}>Cancel</Button>
                                    <Button onClick={handleSaveScannedBook} className="w-40">Save to Inventory</Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md overflow-x-auto mt-8">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 text-xs font-semibold text-gray-500 w-16">Cover</th>
                            <th className="p-4 text-xs font-semibold text-gray-500">Source</th>
                            <th className="p-4 text-xs font-semibold text-gray-500">Details</th>
                            <th className="p-4 text-xs font-semibold text-gray-500">Location</th>
                            <th className="p-4 text-xs font-semibold text-gray-500">Price</th>
                            <th className="p-4 text-xs font-semibold text-gray-500">Stock</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {books.map((book) => (
                            <tr key={book.id} className="hover:bg-gray-50">
                                <td className="p-4">
                                    <img src={book.coverUrl} alt={book.title} className="w-10 h-14 object-cover rounded shadow-sm" />
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-tighter ${book.supplySource === 'ingram' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                        {book.supplySource}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <p className="font-medium text-deep-blue text-sm">{book.title}</p>
                                    <p className="text-[10px] text-gray-400">{book.isbn}</p>
                                </td>
                                <td className="p-4 font-mono text-xs text-gray-600">
                                    {book.location || "N/A"}
                                </td>
                                <td className="p-4 text-sm font-semibold">${book.price.toFixed(2)}</td>
                                <td className="p-4 font-medium">
                                    {book.supplySource === 'ingram' ? (
                                        <span className="text-blue-600 text-xs">Drop-ship (Active)</span>
                                    ) : (
                                        <span className={book.stock < 5 ? 'text-red-600' : 'text-forest'}>{book.stock}</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminLibraryPage;
