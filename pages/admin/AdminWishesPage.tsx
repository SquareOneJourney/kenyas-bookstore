import React, { useState } from 'react';
import { MOCK_WISHES } from '../../lib/mockData';
import { Wish } from '../../types';
import Button from '../../components/ui/Button';

const AdminWishesPage: React.FC = () => {
  const [wishes, setWishes] = useState<Wish[]>(MOCK_WISHES);

  const updateWishStatus = (id: string, status: Wish['status']) => {
    setWishes(wishes.map(w => w.id === id ? { ...w, status } : w));
  };
  
  const getStatusColor = (status: Wish['status']) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-800';
      case 'Fulfilled': return 'bg-yellow-100 text-yellow-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <h1 className="font-serif text-2xl md:text-4xl font-bold text-deep-blue mb-6 md:mb-8">Manage Wishes</h1>
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 md:p-4 font-semibold text-xs md:text-sm text-gray-600">Wish ID</th>
              <th className="p-2 md:p-4 font-semibold text-xs md:text-sm text-gray-600">Details</th>
              <th className="p-2 md:p-4 font-semibold text-xs md:text-sm text-gray-600">Status</th>
              <th className="p-2 md:p-4 font-semibold text-xs md:text-sm text-gray-600">Donated Book</th>
              <th className="p-2 md:p-4 font-semibold text-xs md:text-sm text-gray-600">Donor Note</th>
              <th className="p-2 md:p-4 font-semibold text-xs md:text-sm text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {wishes.map((wish) => (
              <tr key={wish.id} className="hover:bg-gray-50">
                <td className="p-2 md:p-4 text-[10px] md:text-xs font-mono text-gray-600">{wish.id}</td>
                <td className="p-2 md:p-4 text-xs md:text-sm text-deep-blue">
                    <strong>Age:</strong> {wish.age}<br/>
                    <strong>Interests:</strong> {wish.interests}<br/>
                    <strong>Theme:</strong> {wish.theme}
                </td>
                <td className="p-2 md:p-4">
                  <span className={`px-2 py-1 text-[10px] md:text-xs font-semibold rounded-full ${getStatusColor(wish.status)}`}>
                    {wish.status}
                  </span>
                </td>
                <td className="p-2 md:p-4 text-xs md:text-sm text-gray-700">{wish.donatedBook?.title || 'N/A'}</td>
                <td className="p-2 md:p-4 text-xs md:text-sm text-gray-700 italic">"{wish.donorNote || 'N/A'}"</td>
                <td className="p-2 md:p-4">
                  {wish.status === 'Fulfilled' && (
                    <Button size="sm" onClick={() => updateWishStatus(wish.id, 'Delivered')} className="text-[10px] md:text-xs">
                      Mark as Delivered
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminWishesPage;
