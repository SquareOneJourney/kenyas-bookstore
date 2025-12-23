import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../hooks/useCart';

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { cartCount } = useCart();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/catalog', label: 'Catalog', icon: '📚' },
    { path: '/cart', label: 'Cart', icon: '🛒', badge: cartCount },
    { path: '/account', label: 'Account', icon: '👤' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-accent shadow-lg z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              isActive(item.path)
                ? 'text-forest border-t-2 border-forest'
                : 'text-gray-600 hover:text-forest'
            } transition-colors`}
            aria-label={item.label}
          >
            <div className="relative">
              <span className="text-2xl">{item.icon}</span>
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-forest text-cream text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
            <span className="text-xs mt-1 font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default MobileBottomNav;

