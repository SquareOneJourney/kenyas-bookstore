
import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { useAuth } from '../hooks/useAuth';
import SearchBar from './SearchBar';
import MegaMenu, { MegaMenuData } from './MegaMenu';

const BookIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
);

const CartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
);

const HeartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
);

const UserIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
);

const MenuIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);


const LocationIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const ChevronDownIcon = () => (
    <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);

const Navbar: React.FC = () => {
    const { cartCount } = useCart();
    const { wishlist } = useWishlist();
    const { user, signOut, isAuthenticated } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
    const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
    const accountMenuRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLElement>(null);
    const [navHeight, setNavHeight] = useState(164);
    const navigate = useNavigate();

    const navLinkClasses = "text-deep-blue hover:text-forest transition-colors duration-200 text-sm font-medium";
    const activeLinkClasses = { color: '#244B3C', textDecoration: 'underline', textUnderlineOffset: '4px' };

    // Calculate nav height for mega menu viewport constraint
    useEffect(() => {
        if (headerRef.current) {
            setNavHeight(headerRef.current.offsetHeight);
        }
    }, []);

    // Mega menu data structure - B&N style format (condensed, no scroll)
    const fictionMenuData: MegaMenuData = {
        left: [
            {
                title: 'BESTSELLERS',
                links: [
                    { label: 'Fiction Bestsellers', href: '/catalog?genre=Fiction&sort=price-desc' },
                    { label: 'B&N Bestsellers', href: '/catalog?sort=price-desc' },
                    { label: 'NY Times Bestsellers', href: '/catalog?sort=price-desc' },
                ],
                maxLinks: 4,
                seeAllHref: '/catalog?sort=price-desc'
            },
            {
                title: 'SHOP FICTION',
                links: [
                    { label: 'Fiction New Releases', href: '/catalog?genre=Fiction&sort=newest' },
                    { label: 'Fiction Coming Soon', href: '/catalog?genre=Fiction' },
                ],
                maxLinks: 2,
                seeAllHref: '/catalog?genre=Fiction'
            },
        ],
        columns: [
            {
                title: 'FICTION',
                links: [
                    { label: 'General Fiction', href: '/catalog?genre=Fiction' },
                    { label: 'Classics', href: '/catalog?genre=Classic' },
                    { label: 'Fiction in Translation', href: '/catalog?genre=Fiction' },
                    { label: 'Folklore & Mythology', href: '/catalog?genre=Fantasy' },
                    { label: 'Historical Fiction', href: '/catalog?genre=Fiction' },
                    { label: 'Literary Fiction', href: '/catalog?genre=Fiction' },
                    { label: 'Poetry', href: '/catalog?genre=Fiction' },
                ],
                maxLinks: 5,
                seeAllHref: '/catalog?genre=Fiction'
            },
            {
                title: 'MYSTERY',
                links: [
                    { label: 'Mystery & Thrillers', href: '/catalog?genre=Mystery' },
                    { label: 'Thrillers', href: '/catalog?genre=Thriller' },
                ],
                maxLinks: 5,
                seeAllHref: '/catalog?genre=Mystery'
            },
            {
                title: 'ROMANCE',
                links: [
                    { label: 'Romance', href: '/catalog?genre=Fiction' },
                    { label: 'Rom-Coms', href: '/catalog?genre=Fiction' },
                ],
                maxLinks: 5,
                seeAllHref: '/catalog?genre=Fiction'
            },
            {
                title: 'SCI-FI, FANTASY, & HORROR',
                links: [
                    { label: 'Sci-Fi & Fantasy', href: '/catalog?genre=Sci-Fi' },
                    { label: 'Horror', href: '/catalog?genre=Horror' },
                    { label: 'Romantasy', href: '/catalog?genre=Fantasy' },
                ],
                maxLinks: 5,
                seeAllHref: '/catalog?genre=Sci-Fi'
            },
            {
                title: 'GRAPHIC NOVELS & MANGA',
                links: [
                    { label: 'Graphic Novels', href: '/catalog?genre=Fiction' },
                    { label: 'Manga', href: '/catalog?genre=Fiction' },
                    { label: 'Light Novels', href: '/catalog?genre=Fiction' },
                ],
                maxLinks: 5,
                seeAllHref: '/catalog?genre=Fiction'
            },
            {
                title: 'BROWSE',
                links: [
                    { label: 'Banned Books', href: '/catalog' },
                    { label: 'Book Awards', href: '/catalog' },
                    { label: 'Book Club Picks', href: '/catalog' },
                    { label: 'Boxed Sets', href: '/catalog' },
                    { label: 'Page & Screen', href: '/catalog' },
                    { label: 'Signed & Special Editions', href: '/catalog' },
                ],
                maxLinks: 5,
                seeAllHref: '/catalog'
            },
        ],
        // Removed promo for now to ensure it fits - can add back if needed
        // promo: {
        //     title: 'The Best Books of 2025',
        //     subtitle: 'Discover our curated selection',
        //     cta: 'SHOP NOW',
        //     href: '/catalog?sort=newest'
        // }
    };

    const nonfictionMenuData: MegaMenuData = {
        left: [
            {
                title: 'BESTSELLERS',
                links: [
                    { label: 'Nonfiction Bestsellers', href: '/catalog?genre=Non-Fiction&sort=price-desc' },
                    { label: 'B&N Bestsellers', href: '/catalog?sort=price-desc' },
                    { label: 'NY Times Bestsellers', href: '/catalog?sort=price-desc' },
                    { label: 'All Bestsellers', href: '/catalog?sort=price-desc' },
                ],
                maxLinks: 4,
                seeAllHref: '/catalog?sort=price-desc'
            },
            {
                title: 'SHOP NONFICTION',
                links: [
                    { label: 'Nonfiction New Releases', href: '/catalog?genre=Non-Fiction&sort=newest' },
                    { label: 'Nonfiction Coming Soon', href: '/catalog?genre=Non-Fiction' },
                ],
                maxLinks: 2,
                seeAllHref: '/catalog?genre=Non-Fiction'
            },
        ],
        columns: [
            {
                title: 'ART & ENTERTAINMENT',
                links: [
                    { label: 'Art, Fashion & Photography', href: '/catalog?genre=Non-Fiction' },
                    { label: 'Music, Movies & Performing Arts', href: '/catalog?genre=Non-Fiction' },
                    { label: 'Humor', href: '/catalog?genre=Non-Fiction' },
                ],
                maxLinks: 5,
                seeAllHref: '/catalog?genre=Non-Fiction'
            },
            {
                title: 'BIOGRAPHY & TRUE STORIES',
                links: [
                    { label: 'Biography & Memoir', href: '/catalog?genre=Biography' },
                    { label: 'True Crime', href: '/catalog?genre=Non-Fiction' },
                ],
                maxLinks: 5,
                seeAllHref: '/catalog?genre=Biography'
            },
            {
                title: 'BUSINESS & SELF-HELP',
                links: [
                    { label: 'Business', href: '/catalog?genre=Non-Fiction' },
                    { label: 'Self-Help & Relationships', href: '/catalog?genre=Self-Help' },
                ],
                maxLinks: 5,
                seeAllHref: '/catalog?genre=Non-Fiction'
            },
            {
                title: 'HISTORY & POLITICS',
                links: [
                    { label: 'History', href: '/catalog?genre=Non-Fiction' },
                    { label: 'Military History', href: '/catalog?genre=Non-Fiction' },
                    { label: 'Current Affairs & Politics', href: '/catalog?genre=Non-Fiction' },
                ],
                maxLinks: 5,
                seeAllHref: '/catalog?genre=Non-Fiction'
            },
            {
                title: 'HOME & LIFESTYLE',
                links: [
                    { label: 'Cookbooks, Food & Wine', href: '/catalog?genre=Non-Fiction' },
                    { label: 'Diet, Health & Fitness', href: '/catalog?genre=Non-Fiction' },
                    { label: 'Home & Garden', href: '/catalog?genre=Non-Fiction' },
                    { label: 'Parenting & Family', href: '/catalog?genre=Non-Fiction' },
                ],
                maxLinks: 5,
                seeAllHref: '/catalog?genre=Non-Fiction'
            },
            {
                title: 'THE OUTDOORS',
                links: [
                    { label: 'Travel', href: '/catalog?genre=Non-Fiction' },
                    { label: 'Nature', href: '/catalog?genre=Non-Fiction' },
                    { label: 'Pets', href: '/catalog?genre=Non-Fiction' },
                ],
                maxLinks: 5,
                seeAllHref: '/catalog?genre=Non-Fiction'
            },
            {
                title: 'RELIGION & SPIRITUALITY',
                links: [
                    { label: 'Bibles & Christianity', href: '/catalog?genre=Non-Fiction' },
                    { label: 'Religion', href: '/catalog?genre=Non-Fiction' },
                    { label: 'New Age & Alternative Beliefs', href: '/catalog?genre=Non-Fiction' },
                    { label: 'Astrology & Tarot', href: '/catalog?genre=Non-Fiction' },
                ],
                maxLinks: 5,
                seeAllHref: '/catalog?genre=Non-Fiction'
            },
            {
                title: 'SMART THINKING',
                links: [
                    { label: 'Science & Technology', href: '/catalog?genre=Non-Fiction' },
                    { label: 'Social Sciences', href: '/catalog?genre=Non-Fiction' },
                    { label: 'Philosophy', href: '/catalog?genre=Non-Fiction' },
                    { label: 'Psychology', href: '/catalog?genre=Non-Fiction' },
                    { label: 'Economics', href: '/catalog?genre=Non-Fiction' },
                ],
                maxLinks: 5,
                seeAllHref: '/catalog?genre=Non-Fiction'
            },
            {
                title: 'SPORTS, GAMES & HOBBIES',
                links: [
                    { label: 'Sports', href: '/catalog?genre=Non-Fiction' },
                    { label: 'Activity & Game Books', href: '/catalog?genre=Non-Fiction' },
                    { label: 'Crafts & Hobbies', href: '/catalog?genre=Non-Fiction' },
                ],
                maxLinks: 5,
                seeAllHref: '/catalog?genre=Non-Fiction'
            },
            {
                title: 'BROWSE',
                links: [
                    { label: 'All Subjects', href: '/catalog' },
                    { label: 'Book Awards', href: '/catalog' },
                    { label: 'Signed & Exclusive Books', href: '/catalog' },
                ],
                maxLinks: 5,
                seeAllHref: '/catalog'
            },
        ],
        // Removed promo for now to ensure it fits - can add back if needed
        // promo: {
        //     title: 'The Best Books of 2025',
        //     subtitle: 'Discover our curated selection',
        //     cta: 'SHOP NOW',
        //     href: '/catalog?sort=newest'
        // }
    };


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
                setIsAccountMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        await signOut();
        setIsAccountMenuOpen(false);
        navigate('/');
    };

    return (
        <header
            className="sticky top-0 z-50 shadow-sm relative"
            style={{
                backgroundImage: "url('/Book Background.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-cream/75 pointer-events-none"></div>

            {/* Main Header - Logo, Search, Account/Wishlist/Cart */}
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex items-center justify-between h-20 gap-6">
                    {/* Logo */}
                    <Link to="/" className="flex items-center shrink-0 gap-3">
                        <img src="/Kenya Favicon.PNG" alt="Kenya's Bookstore Logo" className="h-10 w-auto object-contain" />
                        <span className="text-2xl font-serif font-bold">
                            <span className="text-deep-blue">KENYA'S</span>
                            <span className="text-forest"> BOOKSTORE</span>
                        </span>
                    </Link>

                    {/* Search Bar - Center */}
                    <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
                        <SearchBar variant="navbar" />
                    </div>

                    {/* Account, Wishlist, Cart - Right */}
                    <div className="flex items-center gap-4 shrink-0">
                        {/* Account Menu */}
                        <div className="relative hidden md:block" ref={accountMenuRef}>
                            <button
                                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                                className="flex items-center gap-1 text-deep-blue hover:text-forest transition-colors text-sm"
                                aria-label="Account menu"
                                aria-expanded={isAccountMenuOpen}
                            >
                                <UserIcon className="w-5 h-5" />
                                <span className="hidden lg:inline">MY ACCOUNT</span>
                                <ChevronDownIcon />
                            </button>
                            {isAccountMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50">
                                    {isAuthenticated ? (
                                        <>
                                            <div className="px-4 py-2 border-b border-gray-100">
                                                <p className="text-sm font-semibold text-deep-blue truncate">
                                                    {user?.email || 'Account'}
                                                </p>
                                            </div>
                                            <Link
                                                to="/account"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                onClick={() => setIsAccountMenuOpen(false)}
                                            >
                                                My Account
                                            </Link>
                                            <Link
                                                to="/account/billing"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                onClick={() => setIsAccountMenuOpen(false)}
                                            >
                                                Billing
                                            </Link>
                                            <button
                                                onClick={handleSignOut}
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                Sign Out
                                            </button>
                                        </>
                                    ) : (
                                        <Link
                                            to="/account"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            onClick={() => setIsAccountMenuOpen(false)}
                                        >
                                            Sign In
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Separator */}
                        <span className="hidden md:block text-gray-300">|</span>

                        {/* Wishlist */}
                        <NavLink
                            to="/account"
                            className="hidden md:flex items-center gap-1 text-deep-blue hover:text-forest transition-colors text-sm"
                            title="Wishlist"
                            aria-label="Wishlist"
                        >
                            <HeartIcon className="w-5 h-5" />
                            <span className="hidden lg:inline">WISHLIST</span>
                            {wishlist.length > 0 && (
                                <span className="ml-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-semibold">
                                    {wishlist.length > 9 ? '9+' : wishlist.length}
                                </span>
                            )}
                        </NavLink>

                        {/* Separator */}
                        <span className="hidden md:block text-gray-300">|</span>

                        {/* Cart */}
                        <NavLink
                            to="/cart"
                            className="relative text-deep-blue hover:text-forest transition-colors"
                            aria-label="Shopping cart"
                        >
                            <CartIcon className="w-6 h-6" />
                            {cartCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-forest text-cream text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                                    {cartCount > 9 ? '9+' : cartCount}
                                </span>
                            )}
                        </NavLink>

                        {/* Mobile Menu Button */}
                        <button
                            className="lg:hidden text-deep-blue hover:text-forest transition-colors p-2"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label="Menu"
                            aria-expanded={isMenuOpen}
                        >
                            <MenuIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Mobile Search Bar */}
                <div className="lg:hidden pb-4">
                    <SearchBar variant="page" />
                </div>

                {/* Primary Navigation Bar - B&N Style */}
                <div className="hidden md:flex items-center justify-center border-t border-gray-200 pt-3 pb-3 h-12 relative z-10">
                    <NavLink
                        to="/catalog"
                        className={`${navLinkClasses} flex items-center h-full no-underline ${activeMegaMenu === 'books' ? 'text-forest' : ''}`}
                        style={({ isActive }) => isActive ? activeLinkClasses : undefined}
                        onMouseEnter={() => setActiveMegaMenu(null)}
                    >
                        Books
                    </NavLink>
                    <span className="text-gray-300 mx-1 flex items-center h-full">|</span>

                    {/* Fiction with Mega Menu */}
                    <div
                        className="relative flex items-center h-full"
                        onMouseEnter={() => setActiveMegaMenu('fiction')}
                    >
                        <NavLink
                            to="/catalog?genre=Fiction"
                            className={`${navLinkClasses} flex items-center h-full underline ${activeMegaMenu === 'fiction' ? 'text-forest' : ''}`}
                            style={({ isActive }) => isActive ? activeLinkClasses : undefined}
                            aria-expanded={activeMegaMenu === 'fiction'}
                            aria-haspopup="true"
                        >
                            Fiction
                        </NavLink>
                    </div>
                    <span className="text-gray-300 mx-1 flex items-center h-full">|</span>

                    {/* Nonfiction with Mega Menu */}
                    <div
                        className="relative flex items-center h-full"
                        onMouseEnter={() => setActiveMegaMenu('nonfiction')}
                    >
                        <NavLink
                            to="/catalog?genre=Non-Fiction"
                            className={`${navLinkClasses} flex items-center h-full underline ${activeMegaMenu === 'nonfiction' ? 'text-forest' : ''}`}
                            style={({ isActive }) => isActive ? activeLinkClasses : undefined}
                            aria-expanded={activeMegaMenu === 'nonfiction'}
                            aria-haspopup="true"
                        >
                            Nonfiction
                        </NavLink>
                    </div>
                    <span className="text-gray-300 mx-1 flex items-center h-full">|</span>

                    <NavLink
                        to="/catalog?sort=newest"
                        className={`${navLinkClasses} flex items-center h-full no-underline`}
                        style={({ isActive }) => isActive ? activeLinkClasses : undefined}
                    >
                        New Releases
                    </NavLink>
                    <span className="text-gray-300 mx-1 flex items-center h-full">|</span>

                    <NavLink
                        to="/catalog?sort=price-desc"
                        className={`${navLinkClasses} flex items-center h-full no-underline`}
                        style={({ isActive }) => isActive ? activeLinkClasses : undefined}
                    >
                        Bestsellers
                    </NavLink>
                    <span className="text-gray-300 mx-1 flex items-center h-full">|</span>

                    {/* Kids section hidden for now */}
                    {/* <NavLink 
                        to="/books-for-kids" 
                        className={`${navLinkClasses} flex items-center justify-center h-full`}
                        style={({isActive}) => isActive ? activeLinkClasses : undefined}
                    >
                        Kids
                    </NavLink>
                    <span className="text-gray-300 mx-1 flex items-center h-full">|</span> */}

                    <NavLink
                        to="/gift-finder"
                        className={`${navLinkClasses} flex items-center h-full`}
                        style={({ isActive }) => isActive ? activeLinkClasses : undefined}
                    >
                        Gift Finder
                    </NavLink>
                    <span className="text-gray-300 mx-1 flex items-center h-full">|</span>

                    <NavLink
                        to="/chess"
                        className={`${navLinkClasses} flex items-center h-full`}
                        style={({ isActive }) => isActive ? activeLinkClasses : undefined}
                    >
                        Chess w/ Kenya
                    </NavLink>
                </div>
                {isMenuOpen && (
                    <div className="md:hidden py-4 flex flex-col items-center space-y-4">
                        <NavLink to="/" className={navLinkClasses} style={({ isActive }) => isActive ? activeLinkClasses : undefined} onClick={() => setIsMenuOpen(false)}>Home</NavLink>
                        <NavLink to="/catalog?genre=Fiction" className={navLinkClasses} style={({ isActive }) => isActive ? activeLinkClasses : undefined} onClick={() => setIsMenuOpen(false)}>Fiction</NavLink>
                        <NavLink to="/catalog?genre=Non-Fiction" className={navLinkClasses} style={({ isActive }) => isActive ? activeLinkClasses : undefined} onClick={() => setIsMenuOpen(false)}>Nonfiction</NavLink>
                        <NavLink to="/catalog?sort=newest" className={navLinkClasses} style={({ isActive }) => isActive ? activeLinkClasses : undefined} onClick={() => setIsMenuOpen(false)}>New Releases</NavLink>
                        <NavLink to="/catalog?sort=price-desc" className={navLinkClasses} style={({ isActive }) => isActive ? activeLinkClasses : undefined} onClick={() => setIsMenuOpen(false)}>Bestsellers</NavLink>
                        <NavLink to="/gift-finder" className={navLinkClasses} style={({ isActive }) => isActive ? activeLinkClasses : undefined} onClick={() => setIsMenuOpen(false)}>Gift Finder</NavLink>
                        {/* Kids section hidden for now */}
                        {/* <NavLink to="/books-for-kids" className={navLinkClasses} style={({isActive}) => isActive ? activeLinkClasses : undefined} onClick={() => setIsMenuOpen(false)}>Kids</NavLink> */}
                        <NavLink to="/chess" className={navLinkClasses} style={({ isActive }) => isActive ? activeLinkClasses : undefined} onClick={() => setIsMenuOpen(false)}>Chess w/ Kenya</NavLink>
                        <NavLink to="/about" className={navLinkClasses} style={({ isActive }) => isActive ? activeLinkClasses : undefined} onClick={() => setIsMenuOpen(false)}>About</NavLink>
                        <NavLink to="/contact" className={navLinkClasses} style={({ isActive }) => isActive ? activeLinkClasses : undefined} onClick={() => setIsMenuOpen(false)}>Contact</NavLink>
                        <NavLink to="/account" className={navLinkClasses} style={({ isActive }) => isActive ? activeLinkClasses : undefined} onClick={() => setIsMenuOpen(false)}>Account</NavLink>
                    </div>
                )}
            </nav>

            {/* Mega Menus - Positioned to span full width, directly below nav */}
            <div className="hidden md:block absolute left-0 right-0" style={{ top: '100%' }}>
                <MegaMenu
                    data={fictionMenuData}
                    isOpen={activeMegaMenu === 'fiction'}
                    onClose={() => setActiveMegaMenu(null)}
                    navHeight={navHeight}
                />
                <MegaMenu
                    data={nonfictionMenuData}
                    isOpen={activeMegaMenu === 'nonfiction'}
                    onClose={() => setActiveMegaMenu(null)}
                    navHeight={navHeight}
                />
            </div>
        </header>
    );
};

export default Navbar;
