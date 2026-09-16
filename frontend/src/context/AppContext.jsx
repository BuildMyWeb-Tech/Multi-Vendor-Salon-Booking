// frontend/src/context/AppContext.jsx
// ✅ FIXED: loadUserProfileData now uses Authorization Bearer header format
// This matches standard JWT middleware (authUser.js checks req.headers.token OR Bearer)
// Also accepts token as parameter so AuthCallback can call it immediately after Google login

import { createContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const currencySymbol = '₹';

  // ✅ Read backend URL from env — never hardcode localhost
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [doctors, setDoctors] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userData, setUserData] = useState(false);

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
        toast.error(data.message);
      }
    } catch (error) {
      console.error('loadUserProfileData error:', error);
      // ✅ If token is invalid/expired, clear it so user is prompted to login
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        setToken('');
        setUserData(false);
        toast.error('Session expired. Please login again.');
      } else {
        toast.error(error.message);
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
    }
  }, [token]);

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
  };

  return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};

export default AppContextProvider;
