
import React from 'react';
import { NavLink, Link } from 'react-router-dom';

const DashboardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

const LibraryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
);

const OrdersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);

const AnalysisIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 100 15 7.5 7.5 0 000-15z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.25-5.25" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 10.5m-3 0a3 3 0 106 0 3 3 0 10-6 0" />
  </svg>
);

const MarketingIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.43.811 1.035.811 1.73 0 .695-.316 1.3-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
    </svg>
);

const HeartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
);


const AdminSidebar: React.FC = () => {
    const baseLinkClasses = "flex items-center space-x-3 px-4 py-3 rounded-md transition-colors duration-200";
    const inactiveLinkClasses = "text-cream/70 hover:bg-forest hover:text-cream";
    const activeLinkClasses = "bg-accent text-deep-blue font-semibold";

    const getNavLinkClass = ({ isActive }: { isActive: boolean }) => 
        `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`;

    return (
        <div className="w-64 bg-deep-blue text-cream flex flex-col h-full fixed top-0 left-0 shadow-lg">
            <div className="p-4 border-b border-cream/20">
                <Link to="/admin" className="text-2xl font-serif font-bold text-center block">Admin Panel</Link>
            </div>
            <nav className="flex-grow p-4 space-y-1">
                <NavLink to="/admin/dashboard" className={getNavLinkClass}>
                    <DashboardIcon className="w-5 h-5" />
                    <span>Dashboard</span>
                </NavLink>
                <NavLink to="/admin/library" className={getNavLinkClass}>
                    <LibraryIcon className="w-5 h-5" />
                    <span>Inventory</span>
                </NavLink>
                <NavLink to="/admin/orders" className={getNavLinkClass}>
                    <OrdersIcon className="w-5 h-5" />
                    <span>Orders & Supply</span>
                </NavLink>
                <NavLink to="/admin/marketing" className={getNavLinkClass}>
                    <MarketingIcon className="w-5 h-5" />
                    <span>Marketing</span>
                </NavLink>
                <NavLink to="/admin/analysis" className={getNavLinkClass}>
                    <AnalysisIcon className="w-5 h-5" />
                    <span>Pricing AI</span>
                </NavLink>
                <NavLink to="/admin/wishes" className={getNavLinkClass}>
                    <HeartIcon className="w-5 h-5" />
                    <span>Manage Wishes</span>
                </NavLink>
            </nav>
            <div className="p-4 border-t border-cream/20">
                <Link to="/" className="text-sm text-center block text-cream/70 hover:text-accent">
                    &larr; Back to Store
                </Link>
            </div>
        </div>
    );
};

export default AdminSidebar;
