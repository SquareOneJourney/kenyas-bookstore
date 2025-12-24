
import React, { useState, useRef, useEffect } from 'react';
import { useBooks } from '../../hooks/useBooks';
import { Book, BookCondition, SupplySource } from '../../types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { BookService } from '../../services/bookService';
import { IngramService } from '../../services/ingramService';

const AdminLibraryPage: React.FC = () => {
  const { getBooks, addBooks } = useBooks();
  const [books, setBooks] = useState<Book[]>([]);
  
  const [mode, setMode] = useState<'view' | 'scan'>('view');
  
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
    if (mode === 'scan' && scanInputRef.current) {
        scanInputRef.current.focus();
    }
  }, [mode, scannedBook]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanIsbn.trim()) return;

    setIsFetching(true);
    setScannedBook(null);
    setIngramStatus(null);

    // 1. Fetch Hard Facts
    let bookData = await BookService.fetchBookDataByISBN(scanIsbn);
    
    if (bookData) {
        // 2. Enrich with AI
        bookData = await BookService.enrichBookData(bookData);
        setScannedBook(bookData);
        setFormPrice(bookData.price?.toString() || '');
        
        // 3. Optional Ingram check
        const ingram = await IngramService.checkStockAndPrice(scanIsbn);
        if (ingram) setIngramStatus(ingram);
    } else {
        alert("Book not found. You may need to enter details manually.");
    }
    
    setIsFetching(false);
  };

  const handleSaveScannedBook = () => {
    if (!scannedBook) return;

    const newBook: Book = {
        id: `INV-${Date.now()}`,
        title: scannedBook.title || "Unknown",
        author: scannedBook.author || "Unknown",
        genre: scannedBook.genre || "General",
        price: parseFloat(formPrice) || 0,
        // TODO: Revisit stock representation for Ingram items
        // Currently using 999 as placeholder for "unlimited" drop-ship inventory
        // Consider: Use null/undefined, or a special flag, or rely on ingramStockLevel instead
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
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 md:mb-8">
          <h1 className="font-serif text-2xl md:text-4xl font-bold text-deep-blue">Inventory Management</h1>
          <div className="flex gap-2 md:space-x-4">
            <Button variant={mode === 'view' ? 'primary' : 'outline'} onClick={() => setMode('view')} className="flex-1 md:flex-none">View All</Button>
            <Button variant={mode === 'scan' ? 'primary' : 'outline'} onClick={() => setMode('scan')} className="flex-1 md:flex-none">Quick Scan</Button>
          </div>
      </div>

      {mode === 'scan' && (
          <div className="bg-white p-4 md:p-8 rounded-lg shadow-lg border-2 border-forest/20 animate-in slide-in-from-top-4">
              <div className="text-center mb-6 md:mb-8">
                  <h2 className="text-xl md:text-2xl font-bold text-deep-blue">Scanner Ready</h2>
                  <p className="text-sm md:text-base text-gray-500">Scan ISBN to auto-populate from Google Books & Ingram.</p>
              </div>

              <form onSubmit={handleScan} className="max-w-xl mx-auto mb-6 md:mb-8">
                  <div className="relative">
                      <input
                          ref={scanInputRef}
                          type="text"
                          className="w-full text-center text-lg md:text-2xl tracking-widest p-3 md:p-4 border-2 border-forest rounded-lg focus:ring-4 focus:ring-forest/30 focus:outline-none"
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

              {scannedBook && (
                  <div className="bg-gray-50 p-4 md:p-6 rounded-lg border border-gray-200 flex flex-col md:flex-row gap-4 md:gap-8">
                      <div className="w-24 md:w-32 flex-shrink-0 mx-auto md:mx-0">
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

      <div className="bg-white rounded-lg shadow-md overflow-x-auto mt-6 md:mt-8">
        <table className="w-full text-left min-w-[600px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-2 md:p-4 text-xs font-semibold text-gray-500 w-16">Cover</th>
              <th className="p-2 md:p-4 text-xs font-semibold text-gray-500">Source</th>
              <th className="p-2 md:p-4 text-xs font-semibold text-gray-500">Details</th>
              <th className="p-2 md:p-4 text-xs font-semibold text-gray-500">Location</th>
              <th className="p-2 md:p-4 text-xs font-semibold text-gray-500">Price</th>
              <th className="p-2 md:p-4 text-xs font-semibold text-gray-500">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {books.map((book) => (
              <tr key={book.id} className="hover:bg-gray-50">
                <td className="p-2 md:p-4">
                  <img src={book.coverUrl} alt={book.title} className="w-10 h-14 object-cover rounded shadow-sm" />
                </td>
                <td className="p-2 md:p-4">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-tighter ${book.supplySource === 'ingram' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {book.supplySource}
                    </span>
                </td>
                <td className="p-2 md:p-4">
                    <p className="font-medium text-deep-blue text-xs md:text-sm">{book.title}</p>
                    <p className="text-[10px] text-gray-400">{book.isbn}</p>
                </td>
                <td className="p-2 md:p-4 font-mono text-xs text-gray-600">
                    {book.location || "N/A"}
                </td>
                <td className="p-2 md:p-4 text-xs md:text-sm font-semibold">${book.price.toFixed(2)}</td>
                <td className="p-2 md:p-4 font-medium">
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
