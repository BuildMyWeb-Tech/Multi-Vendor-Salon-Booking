// C:\Users\Siddharathan\Desktop\salon-booking-full-stack\admin\src\context\AdminContext.jsx
import axios from 'axios';
import { createContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export const AdminContext = createContext();

const AdminContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [aToken, setAToken] = useState(localStorage.getItem('aToken') || '');
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [dashData, setDashData] = useState(false);
  const [loading, setLoading] = useState(false);

  const [adminNotifications, setAdminNotifications] = useState([]);
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);

  useEffect(() => {
    if (aToken) {
      getAllAppointments();
      getAdminNotifications();
      const interval = setInterval(getAdminNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [aToken]);

  const getAllDoctors = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(backendUrl + '/api/admin/all-doctors', {
        headers: { aToken },
      });
      if (data.success) {
        setDoctors(data.doctors);
        return data.doctors;
      } else {
        toast.error(data.message);
        return [];
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch stylists');
      console.error('Error fetching stylists:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getDoctorById = async (id) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/doctor/${id}`, {
        headers: { aToken },
      });
      if (data.success) {
        const stylist = data.stylist;
        if (stylist.speciality && !stylist.specialty) {
          stylist.specialty = Array.isArray(stylist.speciality)
            ? stylist.speciality
            : [stylist.speciality];
        } else if (stylist.specialty && !Array.isArray(stylist.specialty)) {
          stylist.specialty = [stylist.specialty];
        }
        if (stylist.phoneNumber && !stylist.phone) {
          stylist.phone = stylist.phoneNumber;
        }
        if (stylist.fees && !stylist.price) {
          stylist.price = stylist.fees;
        }
        if (!stylist.leaveDates) {
          stylist.leaveDates = [];
        }
        return stylist;
      } else {
        toast.error(data.message);
        return null;
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch stylist details';
      toast.error(errorMsg);
      console.error('Error fetching stylist:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateDoctor = async (id, formData) => {
    setLoading(true);
    try {
      const { data } = await axios.put(`${backendUrl}/api/admin/doctor/${id}`, formData, {
        headers: {
          aToken,
          'Content-Type': 'multipart/form-data',
        },
      });
      if (data.success) {
        toast.success(data.message || 'Stylist updated successfully');
        setDoctors((prevDoctors) =>
          prevDoctors.map((doc) => (doc._id === id ? data.stylist : doc))
        );
        return data.stylist;
      } else {
        toast.error(data.message);
        return null;
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to update stylist';
      toast.error(errorMsg);
      console.error('Error updating stylist:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteDoctor = async (id) => {
    setLoading(true);
    try {
      const { data } = await axios.delete(`${backendUrl}/api/admin/doctor/${id}`, {
        headers: { aToken },
      });
      if (data.success) {
        toast.success(data.message);
        setDoctors((prevDoctors) => prevDoctors.filter((doc) => doc._id !== id));
        return true;
      } else {
        toast.error(data.message);
        return false;
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to delete stylist';
      toast.error(errorMsg);
      console.error('Error deleting stylist:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getStylistLeaveDates = async (id) => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/doctor/${id}/leave-dates`, {
        headers: { aToken },
      });
      if (data.success) {
        return data.leaveDates || [];
      } else {
        toast.error(data.message || 'Failed to fetch leave dates');
        return [];
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch leave dates';
      toast.error(errorMsg);
      console.error('Error fetching leave dates:', error);
      return [];
    }
  };

  const updateStylistLeaveDates = async (id, leaveDates) => {
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/admin/doctor/${id}/leave-dates`,
        { leaveDates },
        { headers: { aToken } }
      );
      if (data.success) {
        setDoctors((prevDoctors) =>
          prevDoctors.map((doc) => (doc._id === id ? { ...doc, leaveDates: data.leaveDates } : doc))
        );
        return { success: true, leaveDates: data.leaveDates };
      } else {
        toast.error(data.message || 'Failed to update leave dates');
        return { success: false };
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to update leave dates';
      toast.error(errorMsg);
      console.error('Error updating leave dates:', error);
      return { success: false };
    }
  };

  const changeAvailability = async (docId) => {
    try {
      const { data } = await axios.post(
        backendUrl + '/api/admin/change-availability',
        { docId },
        { headers: { aToken } }
      );
      if (data.success) {
        toast.success(data.message);
        setDoctors((prevDoctors) =>
          prevDoctors.map((doc) =>
            doc._id === docId ? { ...doc, available: !doc.available } : doc
          )
        );
        return true;
      } else {
        toast.error(data.message);
        return false;
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message || 'Failed to update availability');
      return false;
    }
  };

  const getAllAppointments = async () => {
    setAppointmentsLoading(true);
    try {
      const { data } = await axios.get(backendUrl + '/api/admin/appointments', {
        headers: { aToken },
      });
      if (data.success) {
        setAppointments(data.appointments);
        return data.appointments;
      } else {
        toast.error(data.message);
        return [];
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error(
        'Failed to load appointments: ' +
          (error.response?.data?.message || error.message || 'Unknown error')
      );
      return [];
    } finally {
      setAppointmentsLoading(false);
    }
  };

  // ✅ FIXED: No longer calls getAllAppointments() — updates state locally instead
  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + '/api/admin/cancel-appointment',
        { appointmentId },
        { headers: { aToken } }
      );
      if (data.success) {
        toast.success(data.message);
        // ✅ Update locally — prevents appointments resetting to [] and breaking tabs
        setAppointments((prev) =>
          prev.map((app) =>
            app._id === appointmentId ? { ...app, cancelled: true } : app
          )
        );
        return true;
      } else {
        toast.error(data.message);
        return false;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to cancel appointment');
      console.error('Error cancelling appointment:', error);
      return false;
    }
  };

  const markAppointmentCompleted = async (id) => {
    try {
      const { data } = await axios.post(
        backendUrl + '/api/admin/mark-appointment-completed',
        { appointmentId: id },
        { headers: { aToken } }
      );
      if (data.success) {
        toast.success(data.message || 'Appointment marked as completed');
        setAppointments((prev) =>
          prev.map((app) => (app._id === id ? { ...app, isCompleted: true } : app))
        );
        return true;
      } else {
        toast.error(data.message || 'Failed to update appointment');
        return false;
      }
    } catch (error) {
      console.error('Error marking appointment complete:', error);
      toast.error('Failed to update: ' + (error.response?.data?.message || error.message || 'Unknown error'));
      return false;
    }
  };

  const markAppointmentIncomplete = async (id) => {
    try {
      const { data } = await axios.post(
        backendUrl + '/api/admin/mark-appointment-incomplete',
        { appointmentId: id },
        { headers: { aToken } }
      );
      if (data.success) {
        toast.success(data.message || 'Appointment marked as incomplete');
        setAppointments((prev) =>
          prev.map((app) => (app._id === id ? { ...app, isCompleted: false } : app))
        );
        return true;
      } else {
        toast.error(data.message || 'Failed to update appointment');
        return false;
      }
    } catch (error) {
      console.error('Error marking appointment incomplete:', error);
      toast.error('Failed to update: ' + (error.response?.data?.message || error.message || 'Unknown error'));
      return false;
    }
  };

  const getAdminNotifications = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/notifications`, {
        headers: { aToken },
      });
      if (data.success) {
        setAdminNotifications(data.notifications || []);
        setAdminUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      // silent
    }
  };

  const markAdminNotificationsRead = async (notificationId = null) => {
    try {
      await axios.post(
        `${backendUrl}/api/admin/notifications/read`,
        notificationId ? { notificationId } : {},
        { headers: { aToken } }
      );
      if (notificationId) {
        setAdminNotifications((prev) =>
          prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
        );
        setAdminUnreadCount((prev) => Math.max(0, prev - 1));
      } else {
        setAdminNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setAdminUnreadCount(0);
      }
    } catch (error) {
      // silent
    }
  };

  const getDashData = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(backendUrl + '/api/admin/dashboard', {
        headers: { aToken },
      });
      if (data.success) {
        setDashData(data.dashData);
        return data.dashData;
      } else {
        toast.error(data.message);
        return null;
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to load dashboard data');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    aToken,
    setAToken,
    backendUrl,
    doctors,
    loading,
    getAllDoctors,
    getDoctorById,
    updateDoctor,
    deleteDoctor,
    changeAvailability,
    getStylistLeaveDates,
    updateStylistLeaveDates,
    appointments,
    appointmentsLoading,
    getAllAppointments,
    getDashData,
    cancelAppointment,
    markAppointmentCompleted,
    markAppointmentIncomplete,
    dashData,
    adminNotifications,
    adminUnreadCount,
    getAdminNotifications,
    markAdminNotificationsRead,
  };

  return <AdminContext.Provider value={value}>{props.children}</AdminContext.Provider>;
};

export default AdminContextProvider;