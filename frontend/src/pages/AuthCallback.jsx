// frontend/src/pages/AuthCallback.jsx
// ✅ FIXED: After saving Google token, load user profile so app state is fully hydrated
// Without this, token exists but userData is false → "Please login" when booking

import { useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setToken, loadUserProfileData } = useContext(AppContext);

  useEffect(() => {
    const token = params.get('token');
    const error = params.get('error');

    if (token) {
      // ✅ Step 1: Save token to localStorage
      localStorage.setItem('token', token);

      // ✅ Step 2: Update token in AppContext (triggers loadUserProfileData via useEffect in AppContext)
      setToken(token);

      // ✅ Step 3: Explicitly load profile so userData is ready before redirect
      loadUserProfileData().then(() => {
        navigate('/');
      });
    } else {
      // ❌ Google login failed — redirect back to login with error
      navigate('/login?error=' + (error || 'google_login_failed'));
    }
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg font-medium">Logging you in with Google...</p>
        <p className="text-gray-400 text-sm mt-1">Please wait a moment</p>
      </div>
    </div>
  );
}
