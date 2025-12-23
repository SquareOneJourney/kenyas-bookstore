import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

export interface MegaSection {
  title: string;
  links: { label: string; href: string }[];
  maxLinks?: number; // Optional per-section cap
  seeAllHref?: string; // Optional "See all" link
}

export interface MegaMenuData {
  left?: MegaSection[];
  columns: MegaSection[];
  promo?: {
    title: string;
    subtitle: string;
    cta: string;
    href: string;
  };
}

interface MegaMenuProps {
  data: MegaMenuData;
  isOpen: boolean;
  onClose: () => void;
  navHeight?: number;
  defaultMaxLinks?: number; // Default cap for links per section
}

const MegaMenu: React.FC<MegaMenuProps> = ({ data, isOpen, onClose, navHeight = 164, defaultMaxLinks = 5 }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="relative z-[60] bg-white border-b-2 border-forest shadow-lg"
      onMouseEnter={() => {}} // Keep menu open when hovering
      onMouseLeave={onClose}
    >
      <div className="mx-auto max-w-7xl px-6 py-2">
        <div className="grid grid-cols-12 gap-x-8">
          {/* Left Column - Bestsellers & Shop Sections */}
          {data.left && data.left.length > 0 && (
            <aside className="col-span-3">
              <div className="space-y-2">
                {data.left.map((section) => (
                  <div key={section.title} className="min-w-0">
                    <div className="text-[11px] font-semibold tracking-widest uppercase mb-0.5 text-deep-blue flex items-center gap-1">
                      {section.title === 'BESTSELLERS' && (
                        <svg className="w-2.5 h-2.5 text-forest" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      )}
                      {section.title}
                    </div>

                    <ul className="mt-0.5 space-y-0 list-none">
                      {(section.maxLinks ? section.links.slice(0, section.maxLinks) : section.links).map((link) => (
                        <li key={link.href + link.label} className="m-0 p-0">
                          <Link
                            to={link.href}
                            className="block py-0 leading-tight text-[13px] text-gray-700 hover:text-forest hover:underline transition-colors"
                            style={{ minHeight: 'auto', minWidth: 'auto', lineHeight: '1.2', paddingTop: '1px', paddingBottom: '1px' }}
                            onClick={onClose}
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}

                      {section.seeAllHref && (
                        <li className="pt-0.5 m-0">
                          <Link
                            to={section.seeAllHref}
                            className="inline-flex items-center py-0 leading-tight text-[13px] font-medium text-forest hover:text-forest/80 hover:underline transition-colors"
                            style={{ minHeight: 'auto', minWidth: 'auto', lineHeight: '1.2', paddingTop: '1px', paddingBottom: '1px' }}
                            onClick={onClose}
                          >
                            See all subjects →
                          </Link>
                        </li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </aside>
          )}

          {/* Middle Columns - Genre Groups (4 columns) */}
          <section className={`${data.left ? 'col-span-9' : 'col-span-12'} grid grid-cols-4 gap-x-8 gap-y-0`}>
            {data.columns.map((section) => (
              <div key={section.title} className="min-w-0">
                <div className="text-[11px] font-semibold tracking-widest uppercase mb-0.5 text-deep-blue border-b border-gray-200 pb-0.5">
                  {section.title}
                </div>

                <ul className="mt-0.5 space-y-0 list-none">
                  {(section.maxLinks ? section.links.slice(0, section.maxLinks) : section.links).map((link) => (
                    <li key={link.href + link.label} className="m-0 p-0">
                      <Link
                        to={link.href}
                        className="block py-0 leading-[18px] text-[13px] text-gray-700 hover:text-forest hover:underline transition-colors"
                        style={{ minHeight: 'auto', minWidth: 'auto', paddingTop: '2px', paddingBottom: '2px' }}
                        onClick={onClose}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}

                  {section.seeAllHref && (
                    <li className="pt-0.5 m-0">
                      <Link
                        to={section.seeAllHref}
                        className="inline-flex items-center py-0 leading-tight text-[13px] font-medium text-forest hover:text-forest/80 hover:underline transition-colors"
                        style={{ minHeight: 'auto', minWidth: 'auto', lineHeight: '1.2', paddingTop: '1px', paddingBottom: '1px' }}
                        onClick={onClose}
                      >
                        See all subjects →
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </section>

          {/* Right Column - Promo Card (Optional, hidden on smaller screens) */}
          {data.promo && (
            <aside className="col-span-2 hidden xl:block self-start">
              <div className="bg-accent/20 border border-accent rounded-lg p-3 sticky top-4">
                <h4 className="font-serif text-sm font-bold text-deep-blue mb-0.5">
                  {data.promo.title}
                </h4>
                <p className="text-xs text-gray-600 mb-2 leading-tight">
                  {data.promo.subtitle}
                </p>
                <Link
                  to={data.promo.href}
                  className="inline-block bg-forest text-cream px-3 py-1.5 rounded text-xs font-medium hover:bg-forest/90 transition-colors"
                  onClick={onClose}
                >
                  {data.promo.cta}
                </Link>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};

export default MegaMenu;
