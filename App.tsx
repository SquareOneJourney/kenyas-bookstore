
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { BookProvider } from './context/BookContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider } from './context/AuthContext';
import { RecentlyViewedProvider } from './context/RecentlyViewedContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatBot from './components/ChatBot';
import MobileBottomNav from './components/MobileBottomNav';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import BookDetailPage from './pages/BookDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AccountPage from './pages/AccountPage';
import GiftFinderPage from './pages/GiftFinderPage';
import BooksForKidsPage from './pages/BooksForKidsPage';
import ChessPage from './pages/ChessPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import ReturnsPage from './pages/ReturnsPage';
import ShippingPage from './pages/ShippingPage';
import FAQPage from './pages/FAQPage';
import PricingPage from './pages/PricingPage';
import NotFoundPage from './pages/NotFoundPage';
import AccountBillingPage from './pages/AccountBillingPage';

import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminLibraryPage from './pages/admin/AdminLibraryPage';
import AdminAnalysisPage from './pages/admin/AdminAnalysisPage';
import AdminMarketingPage from './pages/admin/AdminMarketingPage';
import AdminWishesPage from './pages/admin/AdminWishesPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <BookProvider>
            <WishlistProvider>
              <RecentlyViewedProvider>
                <CartProvider>
                  <Routes>
                    {/* Admin Routes */}
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<Navigate to="dashboard" replace />} />
                      <Route path="dashboard" element={<AdminDashboardPage />} />
                      <Route path="library" element={<AdminLibraryPage />} />
                      <Route path="orders" element={<AdminOrdersPage />} />
                      <Route path="marketing" element={<AdminMarketingPage />} />
                      <Route path="analysis" element={<AdminAnalysisPage />} />
                      <Route path="wishes" element={<AdminWishesPage />} />
                    </Route>

                    {/* Standalone Chess Page Route for immersive layout */}
                    <Route path="/chess" element={<ChessPage />} />

                    {/* Public Routes */}
                    <Route path="/*" element={<MainApp />} />
                  </Routes>
                </CartProvider>
              </RecentlyViewedProvider>
            </WishlistProvider>
          </BookProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
};


const MainApp: React.FC = () => (
  <div className="flex flex-col min-h-screen font-sans pb-16 lg:pb-0">
    <Navbar />
    <main id="main-content" className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/gift-finder" element={<GiftFinderPage />} />
        <Route path="/books-for-kids" element={<BooksForKidsPage />} />
        <Route path="/book/:id" element={<BookDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/account/billing" element={<AccountBillingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/returns" element={<ReturnsPage />} />
        <Route path="/shipping" element={<ShippingPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </main>
    <Footer />
    <MobileBottomNav />
    <ChatBot />
  </div>
);


export default App;
