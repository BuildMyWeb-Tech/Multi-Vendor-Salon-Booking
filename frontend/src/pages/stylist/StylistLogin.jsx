// frontend/src/pages/stylist/StylistLogin.jsx
import React, { useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { StylistContext } from '../../context/StylistContext';
import { Scissors, Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react';

const StylistLogin = () => {
  const { shopSlug } = useParams();
  const navigate = useNavigate();
  const { setStylistToken, backendUrl } = useContext(StylistContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields.');
    setLoading(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/stylist/login`, {
        email: email.trim().toLowerCase(),
        password,
        shopSlug,
      });
      if (data.success) {
        setStylistToken(data.token, data.stylist);
        navigate(`/${shopSlug}/stylist/dashboard`);
      } else {
        toast.error(data.message || 'Login failed.');
      }
    } catch {
      toast.error('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const salonName = shopSlug
    ? shopSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Salon';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-lg shadow-primary/30 mb-4">
            <Scissors size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{salonName}</h1>
          <p className="text-gray-500 text-sm mt-1">Stylist Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-100 p-8 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Mail size={14} /> Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Lock size={14} /> Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="border rounded-lg px-3 py-2.5 pr-10 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="animate-pulse">Signing in…</span>
              ) : (
                <>
                  <LogIn size={16} />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          Use the email and password set by your salon admin.
        </p>
      </div>
    </div>
  );
};

export default StylistLogin;
