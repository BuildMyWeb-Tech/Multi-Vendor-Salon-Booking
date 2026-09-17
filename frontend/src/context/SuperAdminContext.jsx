// admin/src/context/SuperAdminContext.jsx
import { createContext, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export const SuperAdminContext = createContext();

const SuperAdminContextProvider = ({ children }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [saToken, setSaToken] = useState(localStorage.getItem('saToken') || '');
  const [salons, setSalons] = useState([]);
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(false);

  const getDashboard = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/super-admin/dashboard`, {
        headers: { superadmintoken: saToken },
      });
      if (data.success) setDashData(data.dashData);
      return data;
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getAllSalons = async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/super-admin/salons`, {
        headers: { superadmintoken: saToken },
        params,
      });
      if (data.success) setSalons(data.salons);
      return data;
    } catch (error) {
      toast.error('Failed to fetch salons');
    } finally {
      setLoading(false);
    }
  };

  const createSalon = async (formData) => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/super-admin/salons`, formData, {
        headers: { superadmintoken: saToken, 'Content-Type': 'multipart/form-data' },
      });
      return data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateSalonStatus = async (shopId, status) => {
    try {
      const { data } = await axios.patch(
        `${backendUrl}/api/super-admin/salons/${shopId}/status`,
        { status },
        { headers: { superadmintoken: saToken } }
      );
      if (data.success) {
        setSalons((prev) =>
          prev.map((s) => (s.shopId === shopId ? { ...s, status } : s))
        );
        toast.success(data.message);
      }
      return data;
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getSalonStats = async (shopId) => {
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/super-admin/salons/${shopId}/stats`,
        { headers: { superadmintoken: saToken } }
      );
      return data;
    } catch {
      return { success: false };
    }
  };

  const value = {
    saToken, setSaToken, backendUrl, loading,
    salons, dashData,
    getDashboard, getAllSalons, createSalon,
    updateSalonStatus, getSalonStats,
  };

  return <SuperAdminContext.Provider value={value}>{children}</SuperAdminContext.Provider>;
};

export default SuperAdminContextProvider;
