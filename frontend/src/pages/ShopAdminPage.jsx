// frontend/src/pages/ShopAdminPage.jsx
// Rendered at /:shopSlug/admin — redirects to the admin panel
import React, { useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { Loader2, Scissors } from 'lucide-react';

const ShopAdminPage = () => {
  const { shopSlug } = useParams();
  const { loadShop, shopLoading, shopError, currentShop } = useContext(ShopContext);

  useEffect(() => {
    if (shopSlug) loadShop(shopSlug);
  }, [shopSlug]);

  useEffect(() => {
    if (currentShop?.slug === shopSlug) {
      // Redirect to admin panel with the shop slug stored
      // The admin panel runs on port 5174; pass slug as query param
      localStorage.setItem('pendingShopSlug', shopSlug);
      window.location.href = `http://localhost:5174/?shopSlug=${shopSlug}`;
    }
  }, [currentShop]);

  if (shopLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-primary mx-auto mb-3" />
          <p className="text-gray-500">Loading salon admin...</p>
        </div>
      </div>
    );
  }

  if (shopError && !shopError.suspended) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Scissors size={28} className="text-gray-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Salon Not Found</h1>
          <p className="text-gray-500 text-sm">{shopError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 size={32} className="animate-spin text-primary mx-auto mb-3" />
        <p className="text-gray-500">Redirecting to admin panel...</p>
      </div>
    </div>
  );
};

export default ShopAdminPage;
