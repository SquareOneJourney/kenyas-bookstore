
import React, { useState } from 'react';
import { MOCK_ORDERS } from '../../lib/mockData';
import { Order, OrderStatus } from '../../types';
import Button from '../../components/ui/Button';
import { IngramService } from '../../services/ingramService';

const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS.map(o => ({
      ...o,
      customerEmail: 'customer@example.com',
      customerAddress: '123 Main St, New York, NY 10001',
      fulfillmentSource: Math.random() > 0.5 ? 'ingram' : 'local',
      status: o.status === 'Processing' ? 'Pending Ingram' : o.status
  } as Order)));

  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleSendToIngram = async (orderId: string) => {
    setIsProcessing(orderId);
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const result = await IngramService.placeDropShipOrder(order);
    
    if (result.success) {
        setOrders(prev => prev.map(o => 
            o.id === orderId 
            ? { ...o, status: 'Ingram Confirmed', trackingNumber: result.ingramOrderNumber } 
            : o
        ));
        alert(`Order sent to Ingram! PO#: ${result.ingramOrderNumber}`);
    } else {
        alert("Failed to send order to Ingram. Please check credentials.");
    }
    setIsProcessing(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-serif text-4xl font-bold text-deep-blue">Order Fulfillment</h1>
        <div className="flex gap-4">
            <div className="flex items-center gap-2 text-sm bg-white px-3 py-1 rounded border">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                Ingram Drop-ship
            </div>
            <div className="flex items-center gap-2 text-sm bg-white px-3 py-1 rounded border">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                Local Stock
            </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 text-xs font-semibold uppercase text-gray-500">Source</th>
              <th className="p-4 text-xs font-semibold uppercase text-gray-500">Order ID</th>
              <th className="p-4 text-xs font-semibold uppercase text-gray-500">Customer</th>
              <th className="p-4 text-xs font-semibold uppercase text-gray-500">Status</th>
              <th className="p-4 text-xs font-semibold uppercase text-gray-500">Total</th>
              <th className="p-4 text-xs font-semibold uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-xs ${order.fulfillmentSource === 'ingram' ? 'bg-blue-500' : 'bg-green-500'}`}>
                        {order.fulfillmentSource === 'ingram' ? 'I' : 'L'}
                    </span>
                </td>
                <td className="p-4">
                    <p className="font-bold text-deep-blue">{order.id}</p>
                    <p className="text-xs text-gray-400">{order.date}</p>
                </td>
                <td className="p-4">
                    <p className="text-sm">{order.customerEmail}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{order.customerAddress}</p>
                </td>
                <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 
                        order.status === 'Pending Ingram' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                        {order.status}
                    </span>
                    {order.trackingNumber && <p className="text-[10px] mt-1 font-mono text-gray-500">PO: {order.trackingNumber}</p>}
                </td>
                <td className="p-4 font-bold">${order.total.toFixed(2)}</td>
                <td className="p-4">
                    {order.fulfillmentSource === 'ingram' && order.status === 'Pending Ingram' && (
                        <Button 
                            size="sm" 
                            onClick={() => handleSendToIngram(order.id)}
                            disabled={isProcessing === order.id}
                        >
                            {isProcessing === order.id ? 'Sending...' : 'Send to Ingram'}
                        </Button>
                    )}
                    {order.fulfillmentSource === 'local' && order.status === 'Pending Ingram' && (
                        <Button size="sm" variant="outline">Print Packing Slip</Button>
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

export default AdminOrdersPage;
