import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listActiveBooks } from '../services/books';
import { Book } from '../types';

interface SearchBarProps {
  variant?: 'navbar' | 'page';
  onSelect?: (book: Book) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ variant = 'navbar', onSelect }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Book[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      try {
        // Use the books service which handles ISBN normalization and search
        const matches = await listActiveBooks({
          q: query,
          limit: 8,
        });

        setSuggestions(matches);
        setIsOpen(matches.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
        setIsOpen(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSelect = (book: Book) => {
    setQuery('');
    setIsOpen(false);
    if (onSelect) {
      onSelect(book);
    } else {
      navigate(`/book/${book.id}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleSelect(suggestions[selectedIndex]);
    } else if (query.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelect(suggestions[selectedIndex]);
        } else {
          handleSubmit(e);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const isNavbar = variant === 'navbar';
  const [searchCategory, setSearchCategory] = useState('All');

  return (
    <div ref={searchRef} className={`relative ${isNavbar ? 'flex-1 max-w-2xl' : 'w-full'}`}>
      <form onSubmit={handleSubmit} className="relative flex items-stretch">
        {/* Category Dropdown - B&N Style */}
        {isNavbar && (
          <select
            value={searchCategory}
            onChange={(e) => setSearchCategory(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 border-r-0 rounded-l-md bg-gray-200 text-sm text-gray-700 focus:outline-none focus:bg-deep-blue focus:text-cream focus:border-deep-blue appearance-none cursor-pointer transition-colors"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23333\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1rem', paddingRight: '2rem' }}
            onFocus={(e) => {
              e.target.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23FAF5E1\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")';
            }}
            onBlur={(e) => {
              e.target.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23333\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")';
            }}
          >
            <option value="All">All</option>
            <option value="Books">Books</option>
            <option value="Authors">Authors</option>
            <option value="ISBN">ISBN</option>
          </select>
        )}
        
        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && suggestions.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={isNavbar ? "Search by Title, Author, Keyword or ISBN" : "Search by title, author, or ISBN..."}
          className={`flex-1 px-4 py-2.5 border border-gray-300 ${isNavbar ? 'border-l-0 rounded-r-md' : 'rounded-md'} focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest bg-white text-deep-blue placeholder-gray-400 ${
            isNavbar ? 'text-sm' : 'text-base'
          }`}
          aria-label="Search books"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        />
        
        {/* Search Button - B&N Style */}
        <button
          type="submit"
          className="px-4 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-r-md transition-colors flex items-center justify-center"
          aria-label="Search"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
        
        {query && !isNavbar && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-16 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </form>

      {isOpen && suggestions.length > 0 && (
        <div
          className="absolute z-50 w-full mt-1 bg-white border border-accent rounded-md shadow-lg max-h-96 overflow-y-auto"
          role="listbox"
        >
          {suggestions.map((book, index) => (
            <button
              key={book.id}
              type="button"
              onClick={() => handleSelect(book)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-accent/20 transition-colors ${
                index === selectedIndex ? 'bg-accent/20' : ''
              } ${index !== suggestions.length - 1 ? 'border-b border-gray-100' : ''}`}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <img src={book.coverUrl} alt={book.title} className="w-12 h-16 object-cover rounded" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-deep-blue truncate">{book.title}</p>
                <p className="text-sm text-gray-600 truncate">by {book.author}</p>
                <p className="text-xs text-gray-500">${book.price.toFixed(2)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;

