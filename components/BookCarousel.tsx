import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Book } from '../types';
import BookCard from './BookCard';

interface BookCarouselProps {
  title: string;
  books: Book[];
  viewAllLink?: string;
  showViewAll?: boolean;
  variant?: 'default' | 'light'; // 'light' for dark backgrounds
}

const ChevronLeftIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

const BookCarousel: React.FC<BookCarouselProps> = ({
  title,
  books,
  viewAllLink = '/catalog',
  showViewAll = true,
  variant = 'default'
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollButtons = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Check on mount and when books change
  useEffect(() => {
    checkScrollButtons();
    // Also check after a brief delay to ensure layout is complete
    const timer = setTimeout(checkScrollButtons, 100);
    return () => clearTimeout(timer);
  }, [books]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 400; // Scroll by 400px
    const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
    scrollContainerRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    // Check buttons after scroll animation
    setTimeout(checkScrollButtons, 300);
  };

  // Show section even if empty (for placeholder state)
  const titleColor = variant === 'light' ? 'text-ecru' : 'text-ink';
  const linkColor = variant === 'light' ? 'text-ecru hover:text-ecru/80' : 'text-oxblood hover:text-oxblood/80';
  const placeholderBg = variant === 'light' ? 'bg-white/10 border-white/20' : 'bg-bone border-bone/60';
  const placeholderText = variant === 'light' ? 'text-cream/80' : 'text-ink/60';

  return (
    <section className="mb-12 md:mb-16">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="section-heading">{title}</p>
          <h2 className={`font-serif text-3xl md:text-4xl font-semibold ${titleColor}`}>{title}</h2>
        </div>
        {showViewAll && (
          <Link
            to={viewAllLink}
            className={`ml-4 ${linkColor} font-semibold transition-colors text-sm md:text-base flex items-center gap-2`}
          >
            See All
            <span aria-hidden>→</span>
          </Link>
        )}
      </div>

      {books.length === 0 ? (
        <div className={`text-center py-12 rounded-2xl border border-dashed ${placeholderBg}`}>
          <p className={placeholderText}>Coming soon - {title.toLowerCase()} will appear here</p>
        </div>
      ) : (
        <div className="relative">
          {/* Left Arrow */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-ecru/80 hover:bg-ecru shadow-md rounded-full p-2 transition-all brass-border"
              aria-label="Scroll left"
            >
              <ChevronLeftIcon />
            </button>
          )}

          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScrollButtons}
            className="flex gap-8 overflow-x-auto scrollbar-hide pb-4 scroll-smooth px-1"
          >
            {books.map((book) => (
              <div key={book.id} className="flex-shrink-0 w-44">
                <BookCard book={book} />
              </div>
            ))}
          </div>

          {/* Right Arrow */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-ecru/80 hover:bg-ecru shadow-md rounded-full p-2 transition-all brass-border"
              aria-label="Scroll right"
            >
              <ChevronRightIcon />
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default BookCarousel;

