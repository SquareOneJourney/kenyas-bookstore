import React from 'react';
import { BOOKS, MOCK_ORDERS } from '../../lib/mockData';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
        <div className="bg-accent/20 p-3 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-deep-blue">{value}</p>
        </div>
    </div>
);


import { checkConnections } from '../../lib/debug';

const AdminDashboardPage: React.FC = () => {
    const totalBooks = BOOKS.length;
    const totalOrders = MOCK_ORDERS.length;
    const totalRevenue = MOCK_ORDERS.reduce((sum, order) => sum + order.total, 0);

    const handleDebug = async () => {
        alert("Checking connections...");
        const res = await checkConnections();
        alert(`Supabase: ${res.supabase.status.toUpperCase()} (${res.supabase.message})\nGemini: ${res.gemini.status.toUpperCase()} (${res.gemini.message})`);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="font-serif text-4xl font-bold text-deep-blue">Dashboard</h1>
                <button
                    onClick={handleDebug}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm font-semibold"
                >
                    Diagnose Connections
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                    title="Total Books"
                    value={totalBooks}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>}
                />
                <StatCard
                    title="Total Orders"
                    value={totalOrders}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
                />
                <StatCard
                    title="Total Revenue"
                    value={`$${totalRevenue.toFixed(2)}`}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>}
                />
            </div>
            <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold text-deep-blue mb-4">Welcome, Admin!</h2>
                <p className="text-gray-600">Use the sidebar to navigate through the admin panel. You can manage your book library or use the AI-powered analysis tool to get insights on your products.</p>
            </div>
        </div>
    );
};

export default AdminDashboardPage;
