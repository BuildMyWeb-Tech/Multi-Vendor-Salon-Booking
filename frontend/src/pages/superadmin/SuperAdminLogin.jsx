import React, { useContext, useState } from 'react';
import axios from 'axios';
import { SuperAdminContext } from '../../context/SuperAdminContext';
import { toast } from 'react-toastify';
import { Eye, EyeOff, ShieldCheck, Scissors } from 'lucide-react';

const SuperAdminLogin = () => {
  const { backendUrl, setSaToken } = useContext(SuperAdminContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/super-admin/login`, { email, password });
      if (data.success) {
        setSaToken(data.token);
        localStorage.setItem('saToken', data.token);
        toast.success('Welcome, Super Admin!');
      } else {
        toast.error(data.message || 'Invalid credentials.');
      }
    } catch {
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Top bar */}
          <div className="bg-primary px-8 py-6 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-white/20 mb-3">
              <ShieldCheck size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Super Admin</h1>
            <p className="text-white/70 text-sm mt-0.5">Platform Management Console</p>
          </div>

          <div className="px-8 py-7">
            {/* Brand */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Scissors size={16} className="text-primary" />
              </div>
              <span className="font-semibold text-gray-700 text-sm">Salon Platform — Admin Only</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="superadmin@platform.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all bg-white"
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
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-11 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={17} />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-gray-400 text-xs mt-5">
              Restricted to authorized platform administrators only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
