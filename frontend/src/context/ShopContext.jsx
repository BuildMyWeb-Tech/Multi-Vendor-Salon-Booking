// frontend/src/context/ShopContext.jsx
import { createContext, useState, useContext } from 'react';
import axios from 'axios';

export const ShopContext = createContext();

const ShopContextProvider = ({ children }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [currentShop, setCurrentShop] = useState(null);
  const [shopLoading, setShopLoading] = useState(false);
  const [shopError, setShopError] = useState(null);

  const loadShop = async (slug) => {
    if (currentShop?.slug === slug) return currentShop;
    setShopLoading(true);
    setShopError(null);
    try {
      const { data } = await axios.get(`${backendUrl}/api/shop/${slug}`);
      if (data.success) {
        setCurrentShop(data.shop);
        return data.shop;
      } else {
        setShopError(data);
        setCurrentShop(null);
        return null;
      }
    } catch (error) {
      const errData = error.response?.data;
      setShopError(errData || { message: 'Failed to load salon information.' });
      setCurrentShop(null);
      return null;
    } finally {
      setShopLoading(false);
    }
  };

  const value = {
    currentShop, shopLoading, shopError,
    loadShop, setCurrentShop, backendUrl,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export default ShopContextProvider;
