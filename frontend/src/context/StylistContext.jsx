// frontend/src/context/StylistContext.jsx
import { createContext, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export const StylistContext = createContext();

const StylistContextProvider = ({ children }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [stylistToken, setStylistTokenState] = useState(localStorage.getItem('stylistToken') || '');
  const [stylistInfo, setStylistInfo] = useState(
    JSON.parse(localStorage.getItem('stylistInfo') || 'null')
  );
  const [appointments, setAppointments] = useState([]);
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(false);

  const headers = () => ({ stylisttoken: stylistToken });

  const setStylistToken = (token, info) => {
    setStylistTokenState(token);
    if (token) {
      localStorage.setItem('stylistToken', token);
      if (info) {
        setStylistInfo(info);
        localStorage.setItem('stylistInfo', JSON.stringify(info));
      }
    } else {
      localStorage.removeItem('stylistToken');
      localStorage.removeItem('stylistInfo');
      setStylistInfo(null);
      setAppointments([]);
      setDashData(null);
    }
  };

  const logout = () => setStylistToken('');

  const getDashboard = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/stylist/dashboard`, { headers: headers() });
      if (data.success) setDashData(data.dashData);
    } catch {}
  }, [stylistToken]);

  const getAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/stylist/appointments`, { headers: headers() });
      if (data.success) setAppointments(data.appointments);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [stylistToken]);

  const completeAppointment = async (id) => {
    try {
      const { data } = await axios.put(`${backendUrl}/api/stylist/appointments/${id}/complete`, {}, { headers: headers() });
      if (data.success) { toast.success('Marked as completed'); getAppointments(); getDashboard(); }
      else toast.error(data.message);
    } catch { toast.error('Failed to update'); }
  };

  const cancelAppointment = async (id) => {
    try {
      const { data } = await axios.put(`${backendUrl}/api/stylist/appointments/${id}/cancel`, {}, { headers: headers() });
      if (data.success) { toast.success('Appointment cancelled'); getAppointments(); getDashboard(); }
      else toast.error(data.message);
    } catch { toast.error('Failed to cancel'); }
  };

  return (
    <StylistContext.Provider value={{
      stylistToken, setStylistToken, stylistInfo, logout,
      appointments, dashData, loading,
      getDashboard, getAppointments, completeAppointment, cancelAppointment,
      backendUrl,
    }}>
      {children}
    </StylistContext.Provider>
  );
};

export default StylistContextProvider;
