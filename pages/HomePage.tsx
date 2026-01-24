
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Book } from '../types';
import { useBooks } from '../hooks/useBooks';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import HeroBanner from '../components/HeroBanner';
import BookCarousel from '../components/BookCarousel';
import TrustBadges from '../components/TrustBadges';
import NewsletterSignup from '../components/NewsletterSignup';
import Button from '../components/ui/Button';
import { formatMoneyFromCents } from '../lib/money';

const HomePage: React.FC = () => {
  const [newReleases, setNewReleases] = useState<Book[]>([]);
  const [bestsellers, setBestsellers] = useState<Book[]>([]);
  const [picks, setPicks] = useState<Book[]>([]);
  const [featured, setFeatured] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const { getBooks } = useBooks();
  const { recentlyViewed } = useRecentlyViewed();

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      const allBooks = await getBooks();
      // Shuffle and slice for variety
      const shuffled = [...allBooks].sort(() => 0.5 - Math.random());
      setFeatured(shuffled.slice(0, 1)); // Featured book
      setNewReleases(shuffled.slice(0, 4));
      setBestsellers(shuffled.slice(4, 8));
      setPicks(shuffled.slice(8, 12));
      setLoading(false);
    };
    fetchBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <HeroBanner />
      <TrustBadges />

      {/* Featured Book Section */}
      {featured.length > 0 && (
        <section className="mb-12 md:mb-16">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/3">
                <img
                  src={featured[0].cover_url || '/placeholder-book.png'}
                  alt={featured[0].title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="md:w-2/3 p-8 md:p-12 flex flex-col justify-center">
                <div className="text-sm font-semibold text-forest uppercase tracking-wider mb-2">
                  Featured This Week
                </div>
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-deep-blue mb-4">
                  {featured[0].title}
                </h2>
                <p className="text-lg text-gray-700 mb-4">by {featured[0].author}</p>
                <p className="text-gray-600 mb-6 line-clamp-3">{featured[0].description}</p>
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-forest">
                    {formatMoneyFromCents(featured[0].list_price_cents ?? 0, featured[0].currency || 'USD')}
                  </span>
                  <Link to={`/book/${featured[0].id}`}>
                    <Button size="lg">Learn More</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <BookCarousel title="New Releases" books={newReleases} />
      <BookCarousel title="Kenya's Picks" books={picks} />
      <BookCarousel title="Bestsellers" books={bestsellers} />

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
        <p className="section-heading mb-2">Browse</p>
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-ink mb-6">By Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
          {[
            { name: 'Fiction', note: 'Modern voices' },
            { name: 'Mystery', note: 'Quiet suspense' },
            { name: 'Sci‑Fi', note: 'Speculative worlds' },
            { name: 'Fantasy', note: 'Myth & magic' },
            { name: 'Classics', note: 'Enduring works' },
            { name: 'Non‑Fiction', note: 'Essays & ideas' },
          ].map((category) => (
            <Link
              key={category.name}
              to={`/catalog?genre=${encodeURIComponent(category.name)}`}
              className="category-tile rounded-2xl p-5 md:p-6 text-left hover:-translate-y-1 transition-all group"
            >
              <div className="text-xs uppercase tracking-[0.14em] text-oxblood mb-2">{category.note}</div>
              <h3 className="font-serif text-xl font-semibold text-ink group-hover:text-oxblood transition-colors">
                {category.name}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      <NewsletterSignup />
    </div>
  );
};

export default HomePage;
