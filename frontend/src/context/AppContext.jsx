// frontend/src/context/AppContext.jsx
// ✅ FIXED: loadUserProfileData now uses Authorization Bearer header format
// This matches standard JWT middleware (authUser.js checks req.headers.token OR Bearer)
// Also accepts token as parameter so AuthCallback can call it immediately after Google login

import { createContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { getSocket, joinUserRoom } from '../utils/socket';

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const currencySymbol = '₹';

  // ✅ Read backend URL from env — never hardcode localhost
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [doctors, setDoctors] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userData, setUserData] = useState(false);
  const [userNotifications, setUserNotifications] = useState([]);
  const [userUnreadCount, setUserUnreadCount] = useState(0);

  // ── Get all doctors ─────────────────────────────────────────────────────
  const getDoctosData = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/doctor/list');
      if (data.success) {
        setDoctors(data.doctors);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('getDoctosData error:', error);
      toast.error(error.message);
    }
  };

  // ── Load user profile ────────────────────────────────────────────────────
  // ✅ FIXED: Accepts optional tokenParam so AuthCallback.jsx can call it
  //           immediately after Google login without waiting for state update
  const loadUserProfileData = async (tokenParam) => {
    const activeToken = tokenParam || token;

    if (!activeToken) return;

    try {
      const { data } = await axios.get(backendUrl + '/api/user/get-profile', {
        headers: {
          // ✅ Send token both ways — works with old middleware (token header)
          // and any future middleware that uses Authorization Bearer
          token: activeToken,
          Authorization: `Bearer ${activeToken}`,
        },
      });

      if (data.success) {
        setUserData(data.userData);
      } else {
        localStorage.removeItem('token');
        setToken('');
        setUserData(false);
        toast.error('Session expired. Please login again.');
      }
    } catch (error) {
      console.error('loadUserProfileData error:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        setToken('');
        setUserData(false);
        toast.error('Session expired. Please login again.');
      }
    }
  };

  // ── On mount: load doctors ───────────────────────────────────────────────
  useEffect(() => {
    getDoctosData();
  }, []);

  // ── Whenever token changes: load user profile ────────────────────────────
  useEffect(() => {
    if (token) {
      loadUserProfileData(token);
    } else {
      setUserData(false);
      setUserNotifications([]);
      setUserUnreadCount(0);
    }
  }, [token]);

  // ── Socket.IO: join user room and listen for real-time notifications ──────
  useEffect(() => {
    if (!userData?._id) return;
    joinUserRoom(userData._id.toString());

    const sock = getSocket();
    const handler = (notif) => {
      setUserNotifications((prev) => [{ ...notif, read: false, _id: Date.now() + Math.random() }, ...prev]);
      setUserUnreadCount((prev) => prev + 1);
    };
    sock.on('user_notification', handler);
    return () => sock.off('user_notification', handler);
  }, [userData?._id]);

  // ── Sync notifications from server-stored userData.notifications ──────────
  useEffect(() => {
    if (userData?.notifications) {
      const stored = [...userData.notifications].reverse();
      setUserNotifications((prev) => {
        // Merge: keep real-time ones not yet in DB, plus all DB ones
        const dbIds = new Set(stored.map(n => n._id?.toString()));
        const rtOnly = prev.filter(n => !dbIds.has(n._id?.toString()) && typeof n._id === 'number');
        return [...rtOnly, ...stored];
      });
      setUserUnreadCount(stored.filter(n => !n.read).length);
    }
  }, [userData?.notifications?.length]);

  const markUserNotificationsRead = async (notifId = null) => {
    try {
      await axios.post(
        backendUrl + '/api/user/notifications/mark-read',
        notifId ? { notifId } : {},
        { headers: { token } }
      );
      if (notifId) {
        setUserNotifications(prev => prev.map(n => n._id?.toString() === notifId?.toString() ? { ...n, read: true } : n));
        setUserUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        setUserNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUserUnreadCount(0);
      }
    } catch {}
  };

  const value = {
    doctors,
    getDoctosData,
    currencySymbol,
    backendUrl,
    token,
    setToken,
    userData,
    setUserData,
    loadUserProfileData,
    userNotifications,
    userUnreadCount,
    markUserNotificationsRead,
  };

  return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};

export default AppContextProvider;
