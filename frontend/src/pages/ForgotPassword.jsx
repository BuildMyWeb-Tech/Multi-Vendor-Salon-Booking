// frontend/src/pages/ForgotPassword.jsx
import { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Check } from 'lucide-react';
import { AppContext } from '../context/AppContext';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { backendUrl } = useContext(AppContext);

  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=newpassword
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ── STEP 1: Send OTP to email ─────────────────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!email) return setError('Please enter your email address');
    setLoading(true);
    try {
      await axios.post(`${backendUrl}/api/auth/forgot-password/send-otp`, { email });
      setSuccess('OTP sent to your email!');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2: Verify OTP ────────────────────────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (otp.length !== 6) return setError('Please enter the 6-digit OTP');
    setLoading(true);
    try {
      const res = await axios.post(`${backendUrl}/api/auth/forgot-password/verify-otp`, { email, otp });
      setResetToken(res.data.resetToken);
      setSuccess('OTP verified successfully!');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 3: Reset Password ────────────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (newPassword.length < 6) return setError('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return setError('Passwords do not match');
    setLoading(true);
    try {
      await axios.post(`${backendUrl}/api/auth/forgot-password/reset-password`, { resetToken, newPassword });
      setSuccess('Password updated! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please start again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-xl p-6">

        <h2 className="text-2xl font-semibold text-center mb-2">
          {step === 1 && 'Forgot Password'}
          {step === 2 && 'Enter OTP'}
          {step === 3 && 'Reset Password'}
        </h2>

        {/* Step dots */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`w-3 h-3 rounded-full transition-colors ${step >= s ? 'bg-primary' : 'bg-gray-300'}`} />
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded p-3 mb-4 flex items-start gap-2">
            <span>⚠</span><span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 text-sm rounded p-3 mb-4 flex items-start gap-2">
            <Check className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{success}</span>
          </div>
        )}

        {/* ── STEP 1: Email ── */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} className="flex flex-col gap-4">
            <div>
              <p className="mb-2 font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email Address
              </p>
              <input type="email" placeholder="Enter your registered email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                required className="border rounded w-full p-2.5 focus:outline-none focus:ring-2 focus:ring-primary" />
              <p className="text-xs text-gray-400 mt-1">We'll send a 6-digit OTP to this email</p>
            </div>
            <button type="submit" disabled={loading}
              className="bg-primary text-white p-2.5 rounded hover:opacity-90 disabled:opacity-60 font-medium">
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
            <button type="button" onClick={() => navigate('/login')}
              className="text-center text-sm text-primary cursor-pointer hover:underline flex items-center justify-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </button>
          </form>
        )}

        {/* ── STEP 2: OTP ── */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
            <div>
              <p className="mb-1 font-medium">Enter OTP</p>
              <p className="text-sm text-gray-500 mb-3">
                Sent to <span className="font-semibold">{email}</span>
              </p>
              <input type="text" placeholder="Enter 6-digit OTP"
                value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                maxLength={6} required
                className="border rounded w-full p-3 text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <button type="submit" disabled={loading}
              className="bg-primary text-white p-2.5 rounded hover:opacity-90 disabled:opacity-60 font-medium">
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button type="button"
              onClick={() => { setStep(1); setError(''); setSuccess(''); setOtp(''); }}
              className="text-sm text-center text-primary cursor-pointer hover:underline flex items-center justify-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Change Email / Resend OTP
            </button>
          </form>
        )}

        {/* ── STEP 3: New Password ── */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            <div>
              <p className="mb-2 font-medium flex items-center gap-2"><Lock className="w-4 h-4" /> New Password</p>
              <div className="relative">
                <input type={showNewPassword ? 'text' : 'password'}
                  placeholder="Enter new password (min 6 chars)"
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  required className="border rounded w-full p-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-primary" />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <p className="mb-2 font-medium flex items-center gap-2"><Lock className="w-4 h-4" /> Confirm Password</p>
              <div className="relative">
                <input type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  required className="border rounded w-full p-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-primary" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <p className={`text-xs mt-1 ${newPassword === confirmPassword ? 'text-green-500' : 'text-red-400'}`}>
                  {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>
            <button type="submit" disabled={loading}
              className="bg-primary text-white p-2.5 rounded hover:opacity-90 disabled:opacity-60 font-medium">
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}