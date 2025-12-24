
import React, { useState, useEffect } from 'react';
import { useBooks } from '../../hooks/useBooks';
import { Book } from '../../types';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { getActiveFeaturedSet } from '../../services/featuredBooks';

interface FeaturedRecommendation {
  book_id: string;
  reasoning: string;
  display_order: number;
  book?: {
    id: string;
    title: string;
    author: string | null;
    cover_url: string | null;
    list_price_cents: number | null;
  };
}

const AdminMarketingPage: React.FC = () => {
  const { getBooks } = useBooks();
  const { session } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [generatedBundle, setGeneratedBundle] = useState<{
    name: string;
    description: string;
    price: number;
    bundle_price_cents?: number;
    discount_percentage?: number;
    total_price_cents?: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Featured books state
  const [featuredRecommendations, setFeaturedRecommendations] = useState<FeaturedRecommendation[] | null>(null);
  const [isGeneratingFeatured, setIsGeneratingFeatured] = useState(false);
  const [isPublishingFeatured, setIsPublishingFeatured] = useState(false);
  const [currentFeaturedSet, setCurrentFeaturedSet] = useState<any>(null);

  useEffect(() => {
    getBooks().then(setBooks);
    loadCurrentFeaturedSet();
  }, [getBooks]);

  const loadCurrentFeaturedSet = async () => {
    const set = await getActiveFeaturedSet();
    setCurrentFeaturedSet(set);
  };

  const toggleBookSelection = (id: string) => {
    setSelectedBooks(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const handleGenerateBundle = async () => {
    if (selectedBooks.length < 2) {
      alert('Please select at least 2 books to create a bundle.');
      return;
    }

    if (!session?.access_token) {
      alert('Please sign in to generate bundle campaigns.');
      return;
    }

    setIsLoading(true);
    setGeneratedBundle(null);

    try {
      const response = await fetch('/api/marketing/generate-bundle-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ book_ids: selectedBooks }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate bundle campaign');
      }

      const data = await response.json();
      setGeneratedBundle({
        name: data.name,
        description: data.description,
        price: data.bundle_price_cents / 100, // Convert cents to dollars for display
        bundle_price_cents: data.bundle_price_cents,
        discount_percentage: data.discount_percentage,
        total_price_cents: data.total_price_cents,
      });
    } catch (error: any) {
      console.error('Error generating bundle campaign:', error);
      alert(`Error: ${error.message || 'Failed to generate bundle campaign'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishBundle = async () => {
    if (!session?.access_token || !generatedBundle || !generatedBundle.bundle_price_cents) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/marketing/publish-bundle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: generatedBundle.name,
          description: generatedBundle.description,
          bundle_price_cents: generatedBundle.bundle_price_cents,
          discount_percentage: generatedBundle.discount_percentage || 15,
          book_ids: selectedBooks,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to publish bundle');
      }

      const data = await response.json();
      alert(`Bundle "${data.name}" created and published successfully!`);
      setGeneratedBundle(null);
      setSelectedBooks([]);
    } catch (error: any) {
      console.error('Error publishing bundle:', error);
      alert(`Error: ${error.message || 'Failed to publish bundle'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateFeaturedBooks = async () => {
    if (!session?.access_token) {
      alert('Please sign in to generate featured books.');
      return;
    }

    setIsGeneratingFeatured(true);
    setFeaturedRecommendations(null);

    try {
      const response = await fetch('/api/marketing/generate-featured-books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate featured books');
      }

      const data = await response.json();
      setFeaturedRecommendations(data.recommendations);
    } catch (error: any) {
      console.error('Error generating featured books:', error);
      alert(`Error: ${error.message || 'Failed to generate featured books'}`);
    } finally {
      setIsGeneratingFeatured(false);
    }
  };

  const handlePublishFeaturedBooks = async () => {
    if (!session?.access_token || !featuredRecommendations) {
      return;
    }

    setIsPublishingFeatured(true);

    try {
      const items = featuredRecommendations.map(rec => ({
        book_id: rec.book_id,
        display_order: rec.display_order,
        ai_reasoning: rec.reasoning,
      }));

      const response = await fetch('/api/marketing/publish-featured-books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to publish featured books');
      }

      const data = await response.json();
      alert(`Featured books published successfully! The homepage has been updated.`);
      setFeaturedRecommendations(null);
      await loadCurrentFeaturedSet();
    } catch (error: any) {
      console.error('Error publishing featured books:', error);
      alert(`Error: ${error.message || 'Failed to publish featured books'}`);
    } finally {
      setIsPublishingFeatured(false);
    }
  };

  return (
    <div>
        <h1 className="font-serif text-2xl md:text-4xl font-bold text-deep-blue mb-2">Marketing & Bundles</h1>
        <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8">AI-powered featured books and curated bundles.</p>

        {/* AI Generate Featured Books Section */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">AI Generate Featured Books</h2>
          <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
            Let AI analyze your inventory and recommend 5 books to feature on the homepage. 
            These recommendations will automatically update the homepage when published.
          </p>

          {currentFeaturedSet && (
            <div className="mb-6 p-4 bg-forest/10 rounded-lg border border-forest/20">
              <p className="text-sm font-semibold text-forest mb-2">Currently Active Featured Set</p>
              <p className="text-sm text-gray-700">
                <strong>Label:</strong> {currentFeaturedSet.label} • 
                <strong> Created:</strong> {new Date(currentFeaturedSet.created_at).toLocaleDateString()} • 
                <strong> Books:</strong> {currentFeaturedSet.items.length}
              </p>
            </div>
          )}

          <div className="flex gap-4 mb-6">
            <Button
              onClick={handleGenerateFeaturedBooks}
              disabled={isGeneratingFeatured}
              className="bg-forest text-cream hover:bg-forest/90"
            >
              {isGeneratingFeatured ? 'Generating Recommendations...' : 'Generate Featured Books'}
            </Button>
          </div>

          {featuredRecommendations && (
            <div className="mt-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                <h3 className="text-lg md:text-xl font-bold">AI Recommendations</h3>
                <Button
                  onClick={handlePublishFeaturedBooks}
                  disabled={isPublishingFeatured}
                  className="bg-green-600 text-white hover:bg-green-700 text-sm md:text-base"
                >
                  {isPublishingFeatured ? 'Publishing...' : 'Publish to Homepage'}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredRecommendations
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((rec) => (
                    <div key={rec.book_id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex gap-4 mb-3">
                        {rec.book?.cover_url && (
                          <img
                            src={rec.book.cover_url}
                            alt={rec.book.title}
                            className="w-16 h-24 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{rec.book?.title || 'Loading...'}</p>
                          <p className="text-xs text-gray-600">{rec.book?.author || ''}</p>
                          {rec.book?.list_price_cents && (
                            <p className="text-sm font-bold text-forest mt-1">
                              ${(rec.book.list_price_cents / 100).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-700 bg-white p-2 rounded border">
                        <strong>AI Reasoning:</strong> {rec.reasoning}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Display Order: {rec.display_order}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Existing Bundle Creator Section */}
        <div className="border-t pt-8">
          <h2 className="text-2xl font-bold mb-4">Bundle Creator</h2>
          <p className="text-gray-600 mb-6">Move slow inventory by creating curated, AI-named bundles.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
            {/* INVENTORY SELECTOR */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Select Inventory</h2>
                <div className="overflow-y-auto max-h-[400px] md:max-h-[500px] space-y-2">
                    {books.map(book => (
                        <div key={book.id} 
                             onClick={() => toggleBookSelection(book.id)}
                             className={`p-3 rounded border flex justify-between items-center cursor-pointer transition-colors ${selectedBooks.includes(book.id) ? 'border-forest bg-forest/5' : 'border-gray-200 hover:border-accent'}`}>
                            <div className="flex items-center gap-3">
                                <input type="checkbox" checked={selectedBooks.includes(book.id)} readOnly className="h-4 w-4 text-forest" />
                                {book.cover_url && (
                                  <img src={book.cover_url} className="w-8 h-12 object-cover rounded" alt={book.title || ''} />
                                )}
                                <div>
                                    <p className="font-medium text-sm">{book.title}</p>
                                    <p className="text-xs text-gray-500">
                                      {book.author || 'Unknown Author'} • {book.format || 'Unknown Format'}
                                    </p>
                                </div>
                            </div>
                            {book.list_price_cents && (
                              <p className="font-bold text-sm">${(book.list_price_cents / 100).toFixed(2)}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* GENERATOR PANEL */}
            <div className="bg-deep-blue text-cream rounded-lg shadow-xl p-4 md:p-6 h-fit lg:sticky lg:top-6">
                <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Bundle Creator</h2>
                <div className="space-y-4">
                    <p className="text-sm text-cream/80">Selected Items: {selectedBooks.length}</p>
                    <Button 
                        onClick={handleGenerateBundle} 
                        disabled={selectedBooks.length < 2 || isLoading}
                        className="w-full bg-accent text-deep-blue hover:bg-white"
                    >
                        {isLoading ? 'Dreaming up ideas...' : 'Generate Campaign'}
                    </Button>

                    {generatedBundle && (
                        <div className="mt-6 p-4 bg-white/10 rounded border border-white/20 animate-in fade-in">
                            <p className="text-xs text-accent uppercase tracking-wider mb-1">Proposed Bundle</p>
                            <h3 className="text-2xl font-serif font-bold mb-2">{generatedBundle.name}</h3>
                            <p className="text-sm italic mb-4 opacity-90">"{generatedBundle.description}"</p>
                            <div className="flex justify-between items-center border-t border-white/20 pt-4">
                                <span className="text-sm">Bundle Price</span>
                                <span className="text-xl font-bold text-accent">${generatedBundle.price.toFixed(2)}</span>
                            </div>
                            <Button
                              onClick={handlePublishBundle}
                              disabled={isLoading}
                              className="w-full mt-4 bg-green-700 hover:bg-green-600 text-white"
                            >
                              {isLoading ? 'Publishing...' : 'Create Product & Publish'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
        </div>
    </div>
  );
};

export default AdminMarketingPage;
