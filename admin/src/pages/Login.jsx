// admin/src/pages/Login.jsx
import React, { useContext, useState } from 'react';
import axios from 'axios';
import { DoctorContext } from '../context/DoctorContext';
import { AdminContext } from '../context/AdminContext';
import { toast } from 'react-toastify';
import { Eye, EyeOff, ArrowLeft, Check } from 'lucide-react';
import RegisterImage from '../assets/image.jpeg';

const AdminLogin = () => {
  const [state, setState] = useState('Admin'); // 'Admin' | 'Stylist'

  // Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP Login (Stylist only)
  const [loginStep, setLoginStep] = useState(1); // 1=credentials, 2=otp
  const [loginOtp, setLoginOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Forgot Password (Stylist only)
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1=email, 2=otp, 3=newpw
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const { setDToken } = useContext(DoctorContext);
  const { setAToken } = useContext(AdminContext);

  // ── Admin Login (no OTP) ──────────────────────────────────────────────────
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(backendUrl + '/api/admin/login', { email, password });
      if (data.success) {
        setAToken(data.token);
        localStorage.setItem('aToken', data.token);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Login failed. Please try again.');
    }
  };

  // ── Stylist Step 1: Send OTP ──────────────────────────────────────────────
  const handleStylistCredentials = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(backendUrl + '/api/doctor/send-login-otp', { email, password });
      if (data.success) {
        toast.success('OTP sent to your email!');
        setLoginStep(2);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials. Please try again.');
    }
  };

  // ── Stylist Step 2: Verify OTP ────────────────────────────────────────────
  const handleVerifyLoginOtp = async (e) => {
    e.preventDefault();
    if (loginOtp.length !== 6) { toast.error('Please enter the 6-digit OTP'); return; }
    setOtpLoading(true);
    try {
      const { data } = await axios.post(backendUrl + '/api/doctor/verify-login-otp', { email, otp: loginOtp });
      if (data.success) {
        setDToken(data.token);
        localStorage.setItem('dToken', data.token);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    setResendLoading(true);
    try {
      const { data } = await axios.post(backendUrl + '/api/doctor/send-login-otp', { email, password });
      if (data.success) { toast.success('OTP resent!'); setLoginOtp(''); }
      else toast.error(data.message);
    } catch { toast.error('Failed to resend OTP.'); }
    finally { setResendLoading(false); }
  };

  // ── Forgot Step 1: Send OTP to email ─────────────────────────────────────
  const handleForgotSendOtp = async (e) => {
    e.preventDefault();
    setForgotError(''); setForgotSuccess('');
    if (!forgotEmail) return setForgotError('Please enter your email');
    setForgotLoading(true);
    try {
      await axios.post(backendUrl + '/api/doctor/forgot-password/send-otp', { email: forgotEmail });
      setForgotSuccess('OTP sent to your email!');
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Failed to send OTP.');
    } finally { setForgotLoading(false); }
  };

  // ── Forgot Step 2: Verify OTP ─────────────────────────────────────────────
  const handleForgotVerifyOtp = async (e) => {
    e.preventDefault();
    setForgotError(''); setForgotSuccess('');
    if (forgotOtp.length !== 6) return setForgotError('Please enter the 6-digit OTP');
    setForgotLoading(true);
    try {
      const res = await axios.post(backendUrl + '/api/doctor/forgot-password/verify-otp', { email: forgotEmail, otp: forgotOtp });
      setResetToken(res.data.resetToken);
      setForgotSuccess('OTP verified!');
      setForgotStep(3);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Invalid OTP.');
    } finally { setForgotLoading(false); }
  };

  // ── Forgot Step 3: Reset Password ─────────────────────────────────────────
  const handleForgotReset = async (e) => {
    e.preventDefault();
    setForgotError(''); setForgotSuccess('');
    if (newPassword.length < 6) return setForgotError('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return setForgotError('Passwords do not match');
    setForgotLoading(true);
    try {
      await axios.post(backendUrl + '/api/doctor/forgot-password/reset-password', { resetToken, newPassword });
      setForgotSuccess('Password reset! Please login now.');
      setTimeout(() => {
        setShowForgot(false); setForgotStep(1); setForgotEmail('');
        setForgotOtp(''); setNewPassword(''); setConfirmPassword('');
        setForgotError(''); setForgotSuccess('');
      }, 2000);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Failed to reset password.');
    } finally { setForgotLoading(false); }
  };

  // ── Switch state helper ───────────────────────────────────────────────────
  const switchState = (newState) => {
    setState(newState);
    setLoginStep(1); setLoginOtp('');
    setShowForgot(false); setForgotStep(1);
    setEmail(''); setPassword('');
    setForgotError(''); setForgotSuccess('');
  };

  return (
    <div className='min-h-[80vh] flex items-center justify-center pt-8'>
      <div className='w-full max-w-5xl flex flex-col md:flex-row shadow-xl rounded-xl overflow-hidden'>

        {/* Left Image */}
        <div className='w-full md:w-1/2 hidden md:block'>
          <img src={RegisterImage}
            alt={state === 'Admin' ? 'Admin dashboard' : 'Professional stylist'}
            className='w-full h-full object-cover' />
        </div>

        {/* Right Form */}
        <div className='w-full md:w-1/2 bg-white p-8'>

          {/* ══════════ ADMIN LOGIN ══════════ */}
          {state === 'Admin' && (
            <form onSubmit={handleAdminLogin} className='flex flex-col gap-4'>
              <div className='text-center mb-4'>
                <h2 className='text-2xl font-semibold text-gray-800'>
                  <span className='text-primary'>Admin</span> Login
                </h2>
                <p className='text-[#5E5E5E] text-sm mt-1'>Please log in to access the admin dashboard</p>
              </div>
              <div>
                <p className='text-[#5E5E5E] mb-1'>Email</p>
                <input onChange={(e) => setEmail(e.target.value)} value={email}
                  className='border border-[#DADADA] rounded w-full p-2 mt-1 focus:outline-primary'
                  type='email' placeholder='Enter admin email' required />
              </div>
              <div>
                <p className='text-[#5E5E5E] mb-1'>Password</p>
                <div className='relative'>
                  <input onChange={(e) => setPassword(e.target.value)} value={password}
                    className='border border-[#DADADA] rounded w-full p-2 mt-1 pr-10 focus:outline-primary'
                    type={showPassword ? 'text' : 'password'} placeholder='Enter your password' required />
                  <button type='button' onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-[55%] transform -translate-y-1/2 text-gray-500'>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button className='bg-primary text-white w-full py-2 mt-3 rounded-md text-base hover:bg-primary/90 transition-colors'>
                Login
              </button>
              <div className='text-center mt-2'>
                <p className='text-sm text-[#5E5E5E]'>
                  Stylist login?{' '}
                  <span onClick={() => switchState('Stylist')} className='text-primary underline cursor-pointer'>Click here</span>
                </p>
              </div>
            </form>
          )}

          {/* ══════════ STYLIST — FORGOT PASSWORD ══════════ */}
          {state === 'Stylist' && showForgot && (
            <div className='flex flex-col gap-4'>
              <button onClick={() => { setShowForgot(false); setForgotStep(1); setForgotError(''); setForgotSuccess(''); }}
                className='flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2'>
                <ArrowLeft size={16} /> Back to login
              </button>

              <div className='text-center'>
                <h2 className='text-2xl font-semibold text-gray-800'>
                  {forgotStep === 1 && 'Forgot Password'}
                  {forgotStep === 2 && 'Enter OTP'}
                  {forgotStep === 3 && 'Reset Password'}
                </h2>
                <p className='text-sm text-[#5E5E5E] mt-1'>Stylist account recovery</p>
              </div>

              {/* Step dots */}
              <div className='flex justify-center gap-2'>
                {[1,2,3].map(s => (
                  <div key={s} className={`w-3 h-3 rounded-full ${forgotStep >= s ? 'bg-primary' : 'bg-gray-300'}`} />
                ))}
              </div>

              {forgotError && (
                <div className='bg-red-50 border border-red-200 text-red-600 text-sm rounded p-3 flex gap-2'>
                  <span>⚠</span><span>{forgotError}</span>
                </div>
              )}
              {forgotSuccess && (
                <div className='bg-green-50 border border-green-200 text-green-600 text-sm rounded p-3 flex gap-2'>
                  <Check size={16} className='mt-0.5 flex-shrink-0' /><span>{forgotSuccess}</span>
                </div>
              )}

              {/* Forgot Step 1 */}
              {forgotStep === 1 && (
                <form onSubmit={handleForgotSendOtp} className='flex flex-col gap-4'>
                  <div>
                    <p className='text-[#5E5E5E] mb-1'>Registered Email</p>
                    <input type='email' value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                      placeholder='Enter your registered email' required
                      className='border border-[#DADADA] rounded w-full p-2 focus:outline-primary' />
                    <p className='text-xs text-gray-400 mt-1'>We'll send a 6-digit OTP to this email</p>
                  </div>
                  <button type='submit' disabled={forgotLoading}
                    className='bg-primary text-white w-full py-2 rounded-md hover:bg-primary/90 disabled:opacity-60'>
                    {forgotLoading ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </form>
              )}

              {/* Forgot Step 2 */}
              {forgotStep === 2 && (
                <form onSubmit={handleForgotVerifyOtp} className='flex flex-col gap-4'>
                  <div>
                    <p className='text-[#5E5E5E] mb-1'>Enter OTP</p>
                    <p className='text-sm text-gray-400 mb-2'>Sent to <span className='font-semibold text-gray-600'>{forgotEmail}</span></p>
                    <input type='text' value={forgotOtp} onChange={e => setForgotOtp(e.target.value.replace(/\D/g,''))}
                      maxLength={6} placeholder='● ● ● ● ● ●' required
                      className='border border-[#DADADA] rounded w-full p-3 text-center text-xl tracking-widest focus:outline-primary' />
                  </div>
                  <button type='submit' disabled={forgotLoading}
                    className='bg-primary text-white w-full py-2 rounded-md hover:bg-primary/90 disabled:opacity-60'>
                    {forgotLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                  <button type='button' onClick={() => { setForgotStep(1); setForgotOtp(''); setForgotError(''); setForgotSuccess(''); }}
                    className='text-sm text-primary text-center hover:underline flex items-center justify-center gap-1'>
                    <ArrowLeft size={14} /> Change Email / Resend OTP
                  </button>
                </form>
              )}

              {/* Forgot Step 3 */}
              {forgotStep === 3 && (
                <form onSubmit={handleForgotReset} className='flex flex-col gap-4'>
                  <div>
                    <p className='text-[#5E5E5E] mb-1'>New Password</p>
                    <div className='relative'>
                      <input type={showNewPw ? 'text' : 'password'} value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder='Min 6 characters' required
                        className='border border-[#DADADA] rounded w-full p-2 pr-10 focus:outline-primary' />
                      <button type='button' onClick={() => setShowNewPw(!showNewPw)}
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500'>
                        {showNewPw ? <EyeOff size={18}/> : <Eye size={18}/>}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className='text-[#5E5E5E] mb-1'>Confirm Password</p>
                    <div className='relative'>
                      <input type={showConfirmPw ? 'text' : 'password'} value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder='Re-enter password' required
                        className='border border-[#DADADA] rounded w-full p-2 pr-10 focus:outline-primary' />
                      <button type='button' onClick={() => setShowConfirmPw(!showConfirmPw)}
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500'>
                        {showConfirmPw ? <EyeOff size={18}/> : <Eye size={18}/>}
                      </button>
                    </div>
                    {confirmPassword.length > 0 && (
                      <p className={`text-xs mt-1 ${newPassword === confirmPassword ? 'text-green-500' : 'text-red-400'}`}>
                        {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </p>
                    )}
                  </div>
                  <button type='submit' disabled={forgotLoading}
                    className='bg-primary text-white w-full py-2 rounded-md hover:bg-primary/90 disabled:opacity-60'>
                    {forgotLoading ? 'Updating...' : 'Reset Password'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ══════════ STYLIST LOGIN (Credentials + OTP) ══════════ */}
          {state === 'Stylist' && !showForgot && (
            <div className='flex flex-col gap-4'>
              <div className='text-center mb-2'>
                <h2 className='text-2xl font-semibold text-gray-800'>
                  <span className='text-primary'>Stylist</span> Login
                </h2>
                <p className='text-[#5E5E5E] text-sm mt-1'>
                  {loginStep === 1 ? 'Please log in to access the stylist dashboard' : 'Enter the OTP sent to your email'}
                </p>
              </div>

              {/* Step dots */}
              <div className='flex justify-center gap-2'>
                <div className={`w-3 h-3 rounded-full ${loginStep >= 1 ? 'bg-primary' : 'bg-gray-300'}`} />
                <div className={`w-3 h-3 rounded-full ${loginStep >= 2 ? 'bg-primary' : 'bg-gray-300'}`} />
              </div>

              {/* Stylist Step 1: Credentials */}
              {loginStep === 1 && (
                <form onSubmit={handleStylistCredentials} className='flex flex-col gap-4'>
                  <div>
                    <p className='text-[#5E5E5E] mb-1'>Email</p>
                    <input onChange={e => setEmail(e.target.value)} value={email}
                      className='border border-[#DADADA] rounded w-full p-2 mt-1 focus:outline-primary'
                      type='email' placeholder='Enter stylist email' required />
                  </div>
                  <div>
                    <p className='text-[#5E5E5E] mb-1'>Password</p>
                    <div className='relative'>
                      <input onChange={e => setPassword(e.target.value)} value={password}
                        className='border border-[#DADADA] rounded w-full p-2 mt-1 pr-10 focus:outline-primary'
                        type={showPassword ? 'text' : 'password'} placeholder='Enter your password' required />
                      <button type='button' onClick={() => setShowPassword(!showPassword)}
                        className='absolute right-3 top-[55%] transform -translate-y-1/2 text-gray-500'>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className='text-right -mt-2'>
                    <span onClick={() => { setShowForgot(true); setForgotStep(1); }}
                      className='text-sm text-primary cursor-pointer hover:underline'>
                      Forgot Password?
                    </span>
                  </div>
                  <button className='bg-primary text-white w-full py-2 rounded-md text-base hover:bg-primary/90 transition-colors'>
                    Continue
                  </button>
                </form>
              )}

              {/* Stylist Step 2: OTP */}
              {loginStep === 2 && (
                <form onSubmit={handleVerifyLoginOtp} className='flex flex-col gap-4'>
                  <div>
                    <p className='text-[#5E5E5E] mb-1'>Enter OTP</p>
                    <p className='text-sm text-gray-400 mb-2'>Sent to <span className='font-semibold text-gray-600'>{email}</span></p>
                    <input value={loginOtp} onChange={e => setLoginOtp(e.target.value.replace(/\D/g,''))}
                      maxLength={6} placeholder='● ● ● ● ● ●' required
                      className='border border-[#DADADA] rounded w-full p-3 text-center text-xl tracking-widest focus:outline-primary' />
                  </div>
                  <button type='submit' disabled={otpLoading}
                    className='bg-primary text-white w-full py-2 rounded-md hover:bg-primary/90 disabled:opacity-60'>
                    {otpLoading ? 'Verifying...' : 'Verify & Login'}
                  </button>
                  <div className='flex justify-between text-sm'>
                    <button type='button' onClick={() => { setLoginStep(1); setLoginOtp(''); }}
                      className='text-gray-500 hover:underline flex items-center gap-1'>
                      <ArrowLeft size={14}/> Back
                    </button>
                    <button type='button' onClick={handleResendOtp} disabled={resendLoading}
                      className='text-primary hover:underline disabled:opacity-60'>
                      {resendLoading ? 'Sending...' : 'Resend OTP'}
                    </button>
                  </div>
                </form>
              )}

              <div className='text-center mt-2'>
                <p className='text-sm text-[#5E5E5E]'>
                  Admin login?{' '}
                  <span onClick={() => switchState('Admin')} className='text-primary underline cursor-pointer'>Click here</span>
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminLogin;