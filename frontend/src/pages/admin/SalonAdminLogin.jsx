// admin/src/pages/SalonAdminLogin.jsx
import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { SalonAdminContext } from '../../context/SalonAdminContext';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Scissors, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SalonAdminLogin = ({ shopSlug, shopName }) => {
  const { setSaAdminToken, backendUrl } = useContext(SalonAdminContext);
  const navigate = useNavigate();
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stylistEnabled, setStylistEnabled] = useState(false);

  useEffect(() => {
    if (!shopSlug) return;
    axios.get(`${backendUrl}/api/salon-admin/public-info/${shopSlug}`)
      .then(({ data }) => { if (data.success) setStylistEnabled(data.stylistPanelEnabled); })
      .catch(() => {});
  }, [shopSlug]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/salon-admin/login`, { adminId, password });
      if (data.success) {
        setSaAdminToken(data.token);
        localStorage.setItem('saAdminToken', data.token);
        localStorage.setItem('shopInfo', JSON.stringify({
          shopId: data.shopId, shopName: data.shopName, slug: data.shopSlug
        }));
        toast.success(`Welcome to ${data.shopName}`);
      } else {
        toast.error(data.message || 'Invalid credentials');
      }
    } catch {
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header banner */}
          <div className="bg-gradient-to-r from-primary to-purple-600 p-8 text-center">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Scissors size={26} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">
              {shopName || 'Salon Admin'}
            </h1>
            <p className="text-white/70 text-sm mt-1">Admin Portal</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Admin ID</label>
                <input
                  type="text"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value.toLowerCase())}
                  required
                  placeholder="Enter your Admin ID"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Login to Dashboard'
                )}
              </button>
            </form>

            {shopSlug && stylistEnabled && (
              <p className="text-center text-xs text-gray-400 mt-5">
                Stylist?{' '}
                <a
                  href={`/${shopSlug}/stylist`}
                  className="text-primary hover:underline font-medium"
                >
                  Open Stylist Portal →
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalonAdminLogin;
