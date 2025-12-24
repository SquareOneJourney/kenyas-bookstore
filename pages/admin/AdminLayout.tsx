import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <main className="flex-1 md:ml-64 p-4 md:p-8 transition-all duration-300">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed top-4 left-4 z-50 bg-deep-blue text-cream p-2 rounded-md shadow-lg"
          aria-label="Open menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;