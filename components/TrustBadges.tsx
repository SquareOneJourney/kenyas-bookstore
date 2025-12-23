import React from 'react';

const TrustBadges: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 md:p-8 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <div className="flex flex-col items-center">
          <div className="text-3xl mb-2">🚚</div>
          <h3 className="font-semibold text-deep-blue mb-1">Free Shipping</h3>
          <p className="text-sm text-gray-600">On orders over $25</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-3xl mb-2">↩️</div>
          <h3 className="font-semibold text-deep-blue mb-1">Easy Returns</h3>
          <p className="text-sm text-gray-600">Within 30 days</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-3xl mb-2">🔒</div>
          <h3 className="font-semibold text-deep-blue mb-1">Secure Checkout</h3>
          <p className="text-sm text-gray-600">Your data is protected</p>
        </div>
      </div>
    </div>
  );
};

export default TrustBadges;

