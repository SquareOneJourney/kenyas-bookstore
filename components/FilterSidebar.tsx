import React from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { BookCondition } from '../types';

interface FilterSidebarProps {
  genreFilter: string;
  onGenreChange: (genre: string) => void;
  minPrice: number;
  maxPrice: number;
  onPriceChange: (min: number, max: number) => void;
  formatFilters: string[];
  onFormatChange: (formats: string[]) => void;
  conditionFilters: BookCondition[];
  onConditionChange: (conditions: BookCondition[]) => void;
  onClearFilters: () => void;
  genres: string[];
  resultCount: number;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  genreFilter,
  onGenreChange,
  minPrice,
  maxPrice,
  onPriceChange,
  formatFilters,
  onFormatChange,
  conditionFilters,
  onConditionChange,
  onClearFilters,
  genres,
  resultCount,
}) => {
  const formats = ['Hardcover', 'Paperback', 'Mass Market', 'Other'];
  const conditions: BookCondition[] = ['New', 'Like New', 'Very Good', 'Good', 'Acceptable'];

  const handleFormatToggle = (format: string) => {
    if (formatFilters.includes(format)) {
      onFormatChange(formatFilters.filter((f) => f !== format));
    } else {
      onFormatChange([...formatFilters, format]);
    }
  };

  const handleConditionToggle = (condition: BookCondition) => {
    if (conditionFilters.includes(condition)) {
      onConditionChange(conditionFilters.filter((c) => c !== condition));
    } else {
      onConditionChange([...conditionFilters, condition]);
    }
  };

  const hasActiveFilters =
    genreFilter !== 'all' ||
    formatFilters.length > 0 ||
    conditionFilters.length > 0 ||
    minPrice > 0 ||
    maxPrice < 1000;

  const [searchParams] = useSearchParams();
  const currentGenre = genreFilter !== 'all' ? genreFilter : searchParams.get('genre') || '';
  const isFiction = currentGenre === 'Fiction' || genres.includes('Fiction');
  const isNonfiction = currentGenre === 'Non-Fiction' || genres.includes('Non-Fiction');

  // B&N style navigation sections
  const browseSections = isFiction
    ? [
        { label: 'Bestsellers', href: '/catalog?genre=Fiction&sort=price-desc' },
        { label: 'New Releases', href: '/catalog?genre=Fiction&sort=newest' },
        { label: 'Coming Soon', href: '/catalog?genre=Fiction' },
        { label: 'Fiction eBooks', href: '/catalog?genre=Fiction' },
        { label: 'Fiction Audiobooks', href: '/catalog?genre=Fiction' },
        { label: 'Fiction Home', href: '/catalog?genre=Fiction' },
      ]
    : isNonfiction
    ? [
        { label: 'Bestsellers', href: '/catalog?genre=Non-Fiction&sort=price-desc' },
        { label: 'New Releases', href: '/catalog?genre=Non-Fiction&sort=newest' },
        { label: 'Coming Soon', href: '/catalog?genre=Non-Fiction' },
        { label: 'Nonfiction eBooks', href: '/catalog?genre=Non-Fiction' },
        { label: 'Nonfiction Audiobooks', href: '/catalog?genre=Non-Fiction' },
        { label: 'Nonfiction Home', href: '/catalog?genre=Non-Fiction' },
      ]
    : [
        { label: 'Bestsellers', href: '/catalog?sort=price-desc' },
        { label: 'New Releases', href: '/catalog?sort=newest' },
        { label: 'Coming Soon', href: '/catalog' },
      ];

  // Subject/genre links for sidebar
  const subjectLinks = genres.slice(0, 12); // Show top 12 genres

  return (
    <div className="bg-white sticky top-24">
      {/* BROWSE Section */}
      <div className="mb-8">
        <h3 className="text-[11px] font-semibold tracking-widest uppercase mb-3 text-deep-blue border-b border-gray-200 pb-2">
          {isFiction ? 'BROWSE FICTION' : isNonfiction ? 'BROWSE NONFICTION' : 'BROWSE BOOKS'}
        </h3>
        <ul className="space-y-2">
          {browseSections.map((section) => (
            <li key={section.label}>
              <Link
                to={section.href}
                className="text-sm text-gray-700 hover:text-forest hover:underline transition-colors block"
              >
                {section.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* BESTSELLERS BY SUBJECT Section */}
      <div className="mb-8">
        <h3 className="text-[11px] font-semibold tracking-widest uppercase mb-3 text-deep-blue border-b border-gray-200 pb-2">
          {isFiction ? 'FICTION BY SUBJECT' : isNonfiction ? 'BESTSELLERS BY SUBJECT' : 'BROWSE BY SUBJECT'}
        </h3>
        <ul className="space-y-2">
          {subjectLinks.map((genre) => (
            <li key={genre}>
              <Link
                to={`/catalog?genre=${encodeURIComponent(genre)}`}
                className="text-sm text-gray-700 hover:text-forest hover:underline transition-colors block"
              >
                {genre}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Filters Section */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-deep-blue">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs text-forest hover:text-forest/80 font-medium"
            >
              Clear All
            </button>
          )}
        </div>

      {/* Genre Filter */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-deep-blue mb-2">Genre</label>
        <select
          value={genreFilter}
          onChange={(e) => onGenreChange(e.target.value)}
          className="w-full px-3 py-2 border border-accent rounded-md focus:outline-none focus:ring-2 focus:ring-forest"
        >
          <option value="all">All Genres</option>
          {genres.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-deep-blue mb-2">
          Price Range: ${minPrice} - ${maxPrice}
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="100"
            value={minPrice}
            onChange={(e) => onPriceChange(Number(e.target.value), maxPrice)}
            className="w-full"
          />
          <input
            type="range"
            min="0"
            max="100"
            value={maxPrice}
            onChange={(e) => onPriceChange(minPrice, Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>$0</span>
          <span>$100+</span>
        </div>
      </div>

      {/* Format Filter */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-deep-blue mb-2">Format</label>
        <div className="space-y-2">
          {formats.map((format) => (
            <label key={format} className="flex items-center">
              <input
                type="checkbox"
                checked={formatFilters.includes(format)}
                onChange={() => handleFormatToggle(format)}
                className="rounded border-accent text-forest focus:ring-forest"
              />
              <span className="ml-2 text-sm text-gray-700">{format}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Condition Filter */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-deep-blue mb-2">Condition</label>
        <div className="space-y-2">
          {conditions.map((condition) => (
            <label key={condition} className="flex items-center">
              <input
                type="checkbox"
                checked={conditionFilters.includes(condition)}
                onChange={() => handleConditionToggle(condition)}
                className="rounded border-accent text-forest focus:ring-forest"
              />
              <span className="ml-2 text-sm text-gray-700">{condition}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="pt-4 border-t">
          <p className="text-sm font-semibold text-deep-blue mb-2">Active Filters:</p>
          <div className="flex flex-wrap gap-2">
            {genreFilter !== 'all' && (
              <span className="bg-forest text-cream text-xs px-2 py-1 rounded">
                {genreFilter} ×
              </span>
            )}
            {formatFilters.map((format) => (
              <span key={format} className="bg-accent text-deep-blue text-xs px-2 py-1 rounded">
                {format} ×
              </span>
            ))}
            {conditionFilters.map((condition) => (
              <span key={condition} className="bg-accent text-deep-blue text-xs px-2 py-1 rounded">
                {condition} ×
              </span>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default FilterSidebar;

