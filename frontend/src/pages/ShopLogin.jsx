import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, EyeOff, Scissors } from 'lucide-react';

const ShopLogin = () => {
  const { shopSlug } = useParams();
  const { currentShop } = useContext(ShopContext);
  const { backendUrl, token, setToken, loadUserProfileData } = useContext(AppContext);
  const navigate = useNavigate();

  const [state, setState] = useState('Login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const shopName = currentShop?.shopName || (shopSlug ? shopSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Salon');
  const s = shopSlug || '';

  useEffect(() => {
    if (token) navigate(`/${s}`);
  }, [token]);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (state === 'Sign Up') {
        if (!/^\d{10}$/.test(phone)) {
          toast.error('Phone number must be exactly 10 digits');
          setLoading(false);
          return;
        }
        const { data } = await axios.post(`${backendUrl}/api/user/register`, { name, email, password, phone });
        if (data.success) {
          localStorage.setItem('token', data.token);
          setToken(data.token);
          await loadUserProfileData(data.token);
        } else {
          toast.error(data.message);
        }
      } else {
        const { data } = await axios.post(`${backendUrl}/api/user/login`, { email, password });
        if (data.success) {
          localStorage.setItem('token', data.token);
          setToken(data.token);
          await loadUserProfileData(data.token);
        } else {
          toast.error(data.message);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-blue-600 p-8 text-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              {currentShop?.logo
                ? <img src={currentShop.logo} alt={shopName} className="w-10 h-10 rounded-xl object-cover" />
                : <Scissors size={26} className="text-white" />}
            </div>
            <h1 className="text-2xl font-bold text-white">{shopName}</h1>
            <p className="text-white/70 text-sm mt-1">
              {state === 'Login' ? 'Sign in to your account' : 'Create a new account'}
            </p>
          </div>

          <div className="p-8">
            {/* Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
              {['Login', 'Sign Up'].map(tab => (
                <button key={tab} onClick={() => setState(tab)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
                    ${state === tab ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}>
                  {tab}
                </button>
              ))}
            </div>

            <form onSubmit={onSubmitHandler} className="space-y-4">
              {state === 'Sign Up' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input
                    type="text" value={name} onChange={e => setName(e.target.value)} required
                    placeholder="Your full name"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              {state === 'Sign Up' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <input
                    type="tel" value={phone} onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 10) setPhone(v); }}
                    required placeholder="10-digit mobile number"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="your@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    required placeholder="Enter your password"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Please wait...
                  </>
                ) : state === 'Login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-5">
              {state === 'Login' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => setState(state === 'Login' ? 'Sign Up' : 'Login')}
                className="text-primary hover:underline font-medium">
                {state === 'Login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopLogin;
