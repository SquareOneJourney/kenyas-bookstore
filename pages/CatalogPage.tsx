import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Book } from '../types';
import { listActiveBooks, BookSortOption } from '../services/books';
import BookListItem from '../components/BookListItem';
import Select from '../components/ui/Select';
import SearchBar from '../components/SearchBar';
import Breadcrumb from '../components/Breadcrumb';
import { centsToDollars } from '../lib/money';

const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get search and sort from URL params
  const searchTerm = searchParams.get('search') || searchParams.get('q') || '';
  const sortParam = searchParams.get('sort') || 'newest';
  const genreParam = searchParams.get('genre'); // Ignored but kept for URL compatibility
  
  // Map URL sort param to service sort option
  const sortOrder: BookSortOption = 
    sortParam === 'price-asc' ? 'price-asc' :
    sortParam === 'price-desc' ? 'price-desc' :
    'newest';

  // Fetch books from Supabase
  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      setError(null);
      try {
        const books = await listActiveBooks({
          q: searchTerm || undefined,
          sort: sortOrder,
        });
        setAllBooks(books);
      } catch (err) {
        console.error('Error fetching books:', err);
        setError('Unable to load books. Please try again.');
        setAllBooks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, [searchTerm, sortOrder]);

  // Client-side filtering (price range, format)
  const [minPriceCents, setMinPriceCents] = useState<number>(0);
  const [maxPriceCents, setMaxPriceCents] = useState<number>(10000); // $100 in cents
  const [formatFilters, setFormatFilters] = useState<string[]>([]);

  useMemo(() => {
    let books = [...allBooks];

    // Filter by price range (in cents)
    books = books.filter(book => {
      const price = book.list_price_cents ?? 0;
      return price >= minPriceCents && price <= maxPriceCents;
    });

    // Filter by format
    if (formatFilters.length > 0) {
      books = books.filter(book => 
        book.format && formatFilters.includes(book.format)
      );
    }

    setFilteredBooks(books);
  }, [allBooks, minPriceCents, maxPriceCents, formatFilters]);

  const handleClearFilters = () => {
    setMinPriceCents(0);
    setMaxPriceCents(10000);
    setFormatFilters([]);
    setSearchParams({});
  };

  // Determine page title
  const getPageTitle = () => {
    if (searchTerm) return `Search Results for "${searchTerm}"`;
    if (sortOrder === 'price-desc') return 'Bestsellers';
    if (sortOrder === 'newest') return 'New Releases';
    if (genreParam) {
      // Genre param is ignored but we can still show it in title
      return `${genreParam} Books`;
    }
    return 'Our Catalog';
  };

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', to: '/' },
    { label: 'Books', to: '/catalog' },
  ];
  if (searchTerm) {
    breadcrumbItems.push({ label: 'Search' });
  } else {
    breadcrumbItems.push({ label: getPageTitle() });
  }

  // Get unique formats from books for filter
  const availableFormats = useMemo(() => {
    const formats = new Set<string>();
    allBooks.forEach(book => {
      if (book.format) {
        formats.add(book.format);
      }
    });
    return Array.from(formats).sort();
  }, [allBooks]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={breadcrumbItems} />
      
      {/* Page Title */}
      <h1 className="font-serif text-3xl md:text-4xl font-bold text-deep-blue mb-6">
        {getPageTitle()}
      </h1>

      {/* Store Availability Banner */}
      <div className="bg-accent/30 border border-accent/50 rounded-md px-4 py-3 mb-6 text-sm text-gray-700">
        Viewing availability for Buy Online, Pick up in Store at Kenya's Bookstore
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3 mb-6 text-sm text-red-700">
          {error}
          <button
            onClick={() => window.location.reload()}
            className="ml-2 underline font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Mobile Search */}
      <div className="md:hidden mb-6">
        <SearchBar variant="page" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Filter Sidebar - Simplified */}
        <div className="hidden lg:block lg:col-span-3">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <h2 className="font-semibold text-lg mb-4">Filters</h2>
            
            {/* Price Range */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="1000"
                  step="1"
                  value={centsToDollars(minPriceCents)}
                  onChange={(e) => setMinPriceCents(Math.round(parseFloat(e.target.value) * 100) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Min"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  step="1"
                  value={centsToDollars(maxPriceCents)}
                  onChange={(e) => setMaxPriceCents(Math.round(parseFloat(e.target.value) * 100) || 10000)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Max"
                />
              </div>
            </div>

            {/* Format Filter */}
            {availableFormats.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format
                </label>
                <div className="space-y-2">
                  {availableFormats.map(format => (
                    <label key={format} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formatFilters.includes(format)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormatFilters([...formatFilters, format]);
                          } else {
                            setFormatFilters(formatFilters.filter(f => f !== format));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{format}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Note about removed filters */}
            {(genreParam || searchParams.get('condition')) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2 text-xs text-yellow-800 mb-4">
                Some filters are not available. Showing all matching results.
              </div>
            )}

            <button
              onClick={handleClearFilters}
              className="w-full text-sm text-forest underline hover:text-forest/80"
            >
              Clear all filters
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-9">
          {/* Results Count and Sort */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
            <div className="text-sm text-gray-600">
              {loading ? (
                <span>Loading...</span>
              ) : filteredBooks.length > 0 ? (
                <span>{filteredBooks.length} result{filteredBooks.length !== 1 ? 's' : ''}</span>
              ) : (
                <span>0 results</span>
              )}
            </div>
            <div className="hidden md:block">
              <Select 
                label="Sort By" 
                id="sort-order" 
                value={sortParam} 
                onChange={e => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('sort', e.target.value);
                  setSearchParams(newParams);
                }}
                className="min-w-[200px]"
              >
                <option value="newest">Newest First</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
              </Select>
            </div>
          </div>

          {/* Mobile Filters */}
          <div className="lg:hidden mb-6 space-y-4">
            <Select 
              label="Sort By" 
              id="sort-order-mobile" 
              value={sortParam} 
              onChange={e => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('sort', e.target.value);
                setSearchParams(newParams);
              }}
            >
              <option value="newest">Newest First</option>
              <option value="price-asc">Price (Low to High)</option>
              <option value="price-desc">Price (High to Low)</option>
            </Select>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <div className="animate-pulse text-gray-400">Loading books...</div>
            </div>
          )}

          {/* Book List */}
          {!loading && filteredBooks.length > 0 ? (
            <div className="bg-white rounded-lg">
              {filteredBooks.map((book, index) => (
                <BookListItem key={book.id} book={book} index={index} />
              ))}
            </div>
          ) : !loading ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-lg text-gray-600 mb-2">No books found</p>
              <p className="text-sm text-gray-500 mb-4">
                {searchTerm ? `No results for "${searchTerm}"` : 'Try adjusting your filters'}
              </p>
              <button 
                onClick={handleClearFilters}
                className="text-forest underline font-medium hover:text-forest/80"
              >
                Clear all filters
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default CatalogPage;
