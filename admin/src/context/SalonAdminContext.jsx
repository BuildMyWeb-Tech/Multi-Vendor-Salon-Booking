// admin/src/context/SalonAdminContext.jsx
import axios from 'axios';
import { createContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export const SalonAdminContext = createContext();

const SalonAdminContextProvider = ({ children }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [saAdminToken, setSaAdminToken] = useState(localStorage.getItem('saAdminToken') || '');
  const [shopInfo, setShopInfo] = useState(
    JSON.parse(localStorage.getItem('shopInfo') || 'null')
  );
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);

  const headers = () => ({ satoken: saAdminToken });

  useEffect(() => {
    if (saAdminToken) {
      fetchShopInfo();
      getAllAppointments();
      getAdminNotifications();
      const interval = setInterval(getAdminNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [saAdminToken]);

  const fetchShopInfo = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/salon-admin/shop-info`, {
        headers: headers(),
      });
      if (data.success) {
        setShopInfo(data.shop);
        localStorage.setItem('shopInfo', JSON.stringify(data.shop));
      }
    } catch {}
  };

  const getAllDoctors = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/salon-admin/all-doctors`, {
        headers: headers(),
      });
      if (data.success) {
        setDoctors(data.doctors);
        return data.doctors;
      }
      toast.error(data.message);
      return [];
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch stylists');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getDoctorById = async (id) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/salon-admin/doctor/${id}`, {
        headers: headers(),
      });
      if (data.success) {
        const stylist = data.stylist;
        if (stylist.speciality && !stylist.specialty) stylist.specialty = Array.isArray(stylist.speciality) ? stylist.speciality : [stylist.speciality];
        else if (stylist.specialty && !Array.isArray(stylist.specialty)) stylist.specialty = [stylist.specialty];
        if (!stylist.leaveDates) stylist.leaveDates = [];
        return stylist;
      }
      toast.error(data.message);
      return null;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch stylist');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateDoctor = async (id, formData) => {
    setLoading(true);
    try {
      const { data } = await axios.put(`${backendUrl}/api/salon-admin/doctor/${id}`, formData, {
        headers: { ...headers(), 'Content-Type': 'multipart/form-data' },
      });
      if (data.success) {
        toast.success(data.message || 'Stylist updated');
        setDoctors((prev) => prev.map((d) => (d._id === id ? data.stylist : d)));
        return data.stylist;
      }
      toast.error(data.message);
      return null;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteDoctor = async (id) => {
    setLoading(true);
    try {
      const { data } = await axios.delete(`${backendUrl}/api/salon-admin/doctor/${id}`, {
        headers: headers(),
      });
      if (data.success) {
        toast.success(data.message);
        setDoctors((prev) => prev.filter((d) => d._id !== id));
        return true;
      }
      toast.error(data.message);
      return false;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getStylistLeaveDates = async (id) => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/salon-admin/doctor/${id}/leave-dates`, {
        headers: headers(),
      });
      return data.success ? data.leaveDates || [] : [];
    } catch {
      return [];
    }
  };

  const updateStylistLeaveDates = async (id, leaveDates) => {
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/salon-admin/doctor/${id}/leave-dates`,
        { leaveDates },
        { headers: headers() }
      );
      if (data.success) {
        setDoctors((prev) => prev.map((d) => (d._id === id ? { ...d, leaveDates: data.leaveDates } : d)));
        return { success: true, leaveDates: data.leaveDates };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  };

  const changeAvailability = async (docId) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/salon-admin/change-availability`,
        { docId },
        { headers: headers() }
      );
      if (data.success) {
        toast.success(data.message);
        setDoctors((prev) => prev.map((d) => (d._id === docId ? { ...d, available: !d.available } : d)));
        return true;
      }
      toast.error(data.message);
      return false;
    } catch {
      return false;
    }
  };

  const getAllAppointments = async () => {
    setAppointmentsLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/salon-admin/appointments`, {
        headers: headers(),
      });
      if (data.success) {
        setAppointments(data.appointments);
        return data.appointments;
      }
      return [];
    } catch {
      return [];
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/salon-admin/cancel-appointment`,
        { appointmentId },
        { headers: headers() }
      );
      if (data.success) {
        toast.success(data.message);
        setAppointments((prev) => prev.map((a) => (a._id === appointmentId ? { ...a, cancelled: true } : a)));
        return true;
      }
      toast.error(data.message);
      return false;
    } catch {
      return false;
    }
  };

  const markAppointmentCompleted = async (id) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/salon-admin/mark-appointment-completed`,
        { appointmentId: id },
        { headers: headers() }
      );
      if (data.success) {
        toast.success(data.message || 'Marked completed');
        setAppointments((prev) => prev.map((a) => (a._id === id ? { ...a, isCompleted: true } : a)));
        return true;
      }
      toast.error(data.message);
      return false;
    } catch {
      return false;
    }
  };

  const markAppointmentIncomplete = async (id) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/salon-admin/mark-appointment-incomplete`,
        { appointmentId: id },
        { headers: headers() }
      );
      if (data.success) {
        toast.success(data.message || 'Marked incomplete');
        setAppointments((prev) => prev.map((a) => (a._id === id ? { ...a, isCompleted: false } : a)));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const getDashData = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/salon-admin/dashboard`, {
        headers: headers(),
      });
      if (data.success) {
        setDashData(data.dashData);
        return data.dashData;
      }
      return null;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getAdminNotifications = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/salon-admin/notifications`, {
        headers: headers(),
      });
      if (data.success) {
        setAdminNotifications(data.notifications || []);
        setAdminUnreadCount(data.unreadCount || 0);
      }
    } catch {}
  };

  const markAdminNotificationsRead = async (notificationId = null) => {
    try {
      await axios.post(
        `${backendUrl}/api/salon-admin/notifications/read`,
        notificationId ? { notificationId } : {},
        { headers: headers() }
      );
      if (notificationId) {
        setAdminNotifications((prev) => prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n)));
        setAdminUnreadCount((prev) => Math.max(0, prev - 1));
      } else {
        setAdminNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setAdminUnreadCount(0);
      }
    } catch {}
  };

  const logout = () => {
    setSaAdminToken('');
    setShopInfo(null);
    localStorage.removeItem('saAdminToken');
    localStorage.removeItem('shopInfo');
  };

  const value = {
    saAdminToken, setSaAdminToken,
    shopInfo, fetchShopInfo,
    backendUrl, loading,
    doctors, getAllDoctors, getDoctorById, updateDoctor, deleteDoctor,
    changeAvailability, getStylistLeaveDates, updateStylistLeaveDates,
    appointments, appointmentsLoading, getAllAppointments,
    cancelAppointment, markAppointmentCompleted, markAppointmentIncomplete,
    dashData, getDashData,
    adminNotifications, adminUnreadCount,
    getAdminNotifications, markAdminNotificationsRead,
    logout,
  };

  return <SalonAdminContext.Provider value={value}>{children}</SalonAdminContext.Provider>;
};

export default SalonAdminContextProvider;
