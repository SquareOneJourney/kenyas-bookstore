
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Book } from '../types';
import { listActiveBooks } from '../services/books';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import BookCarousel from '../components/BookCarousel';
import BookCard from '../components/BookCard';
import { getActiveFeaturedSet } from '../services/featuredBooks';
import { BookRow } from '../types/db';

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

const HomePage: React.FC = () => {
  const [newReleases, setNewReleases] = useState<Book[]>([]);
  const [bestsellers, setBestsellers] = useState<Book[]>([]);
  const [picks, setPicks] = useState<Book[]>([]);
  const [featured, setFeatured] = useState<Book[]>([]);
  const [featuredFromSet, setFeaturedFromSet] = useState<BookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { recentlyViewed } = useRecentlyViewed();
  const kenyaPicksScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeftKenya, setCanScrollLeftKenya] = useState(false);
  const [canScrollRightKenya, setCanScrollRightKenya] = useState(true);
  const bestsellersScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeftBestsellers, setCanScrollLeftBestsellers] = useState(false);
  const [canScrollRightBestsellers, setCanScrollRightBestsellers] = useState(true);
  const newReleasesScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeftNewReleases, setCanScrollLeftNewReleases] = useState(false);
  const [canScrollRightNewReleases, setCanScrollRightNewReleases] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        // Fetch featured set first (if exists, it takes priority)
        const featuredSet = await getActiveFeaturedSet();
        
        // Fetch different sets
        const [newReleasesData, bestsellersData, picksData] = await Promise.all([
          listActiveBooks({ sort: 'newest', limit: 4 }),
          listActiveBooks({ sort: 'price-desc', limit: 4 }),
          listActiveBooks({ limit: 4 }), // Random picks
        ]);
        
        setNewReleases(newReleasesData);
        setBestsellers(bestsellersData);
        setPicks(picksData);

        // Use featured set for Kenya's Picks
        if (featuredSet && featuredSet.items.length > 0) {
          const featuredBooks = featuredSet.items
            .sort((a, b) => a.display_order - b.display_order)
            .map(item => item.books);
          setFeaturedFromSet(featuredBooks);
        } else {
          setFeaturedFromSet([]); // Empty if no featured set
        }
        setFeatured([]); // Not used anymore
      } catch (error) {
        console.error('Error fetching books:', error);
        // Set empty arrays on error
        setNewReleases([]);
        setBestsellers([]);
        setPicks([]);
        setFeatured([]);
        setFeaturedFromSet([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  const checkKenyaPicksScroll = () => {
    if (!kenyaPicksScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = kenyaPicksScrollRef.current;
    setCanScrollLeftKenya(scrollLeft > 0);
    setCanScrollRightKenya(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkKenyaPicksScroll();
    const timer = setTimeout(checkKenyaPicksScroll, 100);
    return () => clearTimeout(timer);
  }, [featuredFromSet]);

  const scrollKenyaPicks = (direction: 'left' | 'right') => {
    if (!kenyaPicksScrollRef.current) return;
    const scrollAmount = 400;
    const newScrollLeft = kenyaPicksScrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
    kenyaPicksScrollRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    setTimeout(checkKenyaPicksScroll, 300);
  };

  const checkBestsellersScroll = () => {
    if (!bestsellersScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = bestsellersScrollRef.current;
    setCanScrollLeftBestsellers(scrollLeft > 0);
    setCanScrollRightBestsellers(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkBestsellersScroll();
    const timer = setTimeout(checkBestsellersScroll, 100);
    return () => clearTimeout(timer);
  }, [bestsellers]);

  const scrollBestsellers = (direction: 'left' | 'right') => {
    if (!bestsellersScrollRef.current) return;
    const scrollAmount = 400;
    const newScrollLeft = bestsellersScrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
    bestsellersScrollRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    setTimeout(checkBestsellersScroll, 300);
  };

  const checkNewReleasesScroll = () => {
    if (!newReleasesScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = newReleasesScrollRef.current;
    setCanScrollLeftNewReleases(scrollLeft > 0);
    setCanScrollRightNewReleases(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkNewReleasesScroll();
    const timer = setTimeout(checkNewReleasesScroll, 100);
    return () => clearTimeout(timer);
  }, [newReleases]);

  const scrollNewReleases = (direction: 'left' | 'right') => {
    if (!newReleasesScrollRef.current) return;
    const scrollAmount = 400;
    const newScrollLeft = newReleasesScrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
    newReleasesScrollRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    setTimeout(checkNewReleasesScroll, 300);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-12">
        <div className="bg-gray-200 h-64 rounded-lg"></div>
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 h-96 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Background Section Above the Fold - Full Width */}
      <div 
        className="relative min-h-screen flex items-start -mt-8"
        style={{
          width: '100vw',
          marginLeft: 'calc(-50vw + 50%)',
          backgroundImage: "url('/Bookstore 2.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Faded background image overlay - 60% transparency */}
        <div className="absolute inset-0 bg-white/60 pointer-events-none"></div>
        
        {/* Additional overlay for better readability */}
        <div className="absolute inset-0 bg-deep-blue/20 pointer-events-none"></div>
        
        {/* Content Container */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          <div className="mb-12 md:mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 
                className="font-serif text-3xl md:text-4xl font-bold text-white"
                style={{
                  textShadow: '0 2px 4px rgba(0,0,0,0.3), 0 0 8px rgba(0,0,0,0.2)'
                }}
              >
                Kenya's Picks
              </h2>
              <Link
                to="/catalog"
                className="ml-4 text-white hover:text-white/80 font-semibold transition-colors text-sm md:text-base"
                style={{
                  textShadow: '0 1px 3px rgba(0,0,0,0.3), 0 0 6px rgba(0,0,0,0.2)'
                }}
              >
                See All
              </Link>
            </div>
            {featuredFromSet.length === 0 ? (
              <div className="text-center py-12 bg-white/10 rounded-lg border border-dashed border-white/20">
                <p className="text-white/80">Coming soon - kenya's picks will appear here</p>
              </div>
            ) : (
              <div className="relative">
                {canScrollLeftKenya && (
                  <button
                    onClick={() => scrollKenyaPicks('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all"
                    aria-label="Scroll left"
                  >
                    <ChevronLeftIcon />
                  </button>
                )}
                <div
                  ref={kenyaPicksScrollRef}
                  onScroll={checkKenyaPicksScroll}
                  className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
                >
                  {featuredFromSet.map((book) => (
                    <div key={book.id} className="flex-shrink-0 w-48">
                      <BookCard book={book} />
                    </div>
                  ))}
                </div>
                {canScrollRightKenya && (
                  <button
                    onClick={() => scrollKenyaPicks('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all"
                    aria-label="Scroll right"
                  >
                    <ChevronRightIcon />
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="mb-12 md:mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 
                className="font-serif text-3xl md:text-4xl font-bold text-white"
                style={{
                  textShadow: '0 2px 4px rgba(0,0,0,0.3), 0 0 8px rgba(0,0,0,0.2)'
                }}
              >
                Bestsellers
              </h2>
              <Link
                to="/catalog?sort=price-desc"
                className="ml-4 text-white hover:text-white/80 font-semibold transition-colors text-sm md:text-base"
                style={{
                  textShadow: '0 1px 3px rgba(0,0,0,0.3), 0 0 6px rgba(0,0,0,0.2)'
                }}
              >
                See All
              </Link>
            </div>
            {bestsellers.length === 0 ? (
              <div className="text-center py-12 bg-white/10 rounded-lg border border-dashed border-white/20">
                <p className="text-white/80">Coming soon - bestsellers will appear here</p>
              </div>
            ) : (
              <div className="relative">
                {canScrollLeftBestsellers && (
                  <button
                    onClick={() => scrollBestsellers('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all"
                    aria-label="Scroll left"
                  >
                    <ChevronLeftIcon />
                  </button>
                )}
                <div
                  ref={bestsellersScrollRef}
                  onScroll={checkBestsellersScroll}
                  className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
                >
                  {bestsellers.map((book) => (
                    <div key={book.id} className="flex-shrink-0 w-48">
                      <BookCard book={book} />
                    </div>
                  ))}
                </div>
                {canScrollRightBestsellers && (
                  <button
                    onClick={() => scrollBestsellers('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all"
                    aria-label="Scroll right"
                  >
                    <ChevronRightIcon />
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="mb-12 md:mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 
                className="font-serif text-3xl md:text-4xl font-bold text-white"
                style={{
                  textShadow: '0 2px 4px rgba(0,0,0,0.3), 0 0 8px rgba(0,0,0,0.2)'
                }}
              >
                New Releases
              </h2>
              <Link
                to="/catalog?sort=newest"
                className="ml-4 text-white hover:text-white/80 font-semibold transition-colors text-sm md:text-base"
                style={{
                  textShadow: '0 1px 3px rgba(0,0,0,0.3), 0 0 6px rgba(0,0,0,0.2)'
                }}
              >
                See All
              </Link>
            </div>
            {newReleases.length === 0 ? (
              <div className="text-center py-12 bg-white/10 rounded-lg border border-dashed border-white/20">
                <p className="text-white/80">Coming soon - new releases will appear here</p>
              </div>
            ) : (
              <div className="relative">
                {canScrollLeftNewReleases && (
                  <button
                    onClick={() => scrollNewReleases('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all"
                    aria-label="Scroll left"
                  >
                    <ChevronLeftIcon />
                  </button>
                )}
                <div
                  ref={newReleasesScrollRef}
                  onScroll={checkNewReleasesScroll}
                  className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
                >
                  {newReleases.map((book) => (
                    <div key={book.id} className="flex-shrink-0 w-48">
                      <BookCard book={book} />
                    </div>
                  ))}
                </div>
                {canScrollRightNewReleases && (
                  <button
                    onClick={() => scrollNewReleases('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all"
                    aria-label="Scroll right"
                  >
                    <ChevronRightIcon />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rest of the sections */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <BookCarousel 
          title="Recently Viewed" 
          books={recentlyViewed.slice(0, 4)} 
          viewAllLink="/account"
        />
      )}

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <BookCarousel 
            title="Recently Viewed" 
            books={recentlyViewed.slice(0, 4)} 
            viewAllLink="/account"
          />
        )}

        {/* Browse by Category */}
        <section className="mb-12 md:mb-16">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-deep-blue mb-6 border-b-2 border-accent pb-2">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {['Fiction', 'Mystery', 'Sci-Fi', 'Fantasy', 'Classic', 'Non-Fiction'].map((category) => (
              <Link
                key={category}
                to={`/catalog?genre=${encodeURIComponent(category)}`}
                className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                  📚
                </div>
                <h3 className="font-semibold text-deep-blue group-hover:text-forest transition-colors">
                  {category}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;