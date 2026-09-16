import userModel from '../models/userModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendOTPEmail } from '../utils/sendEmail.js';

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN OTP — Send OTP after credentials verified (called from userController)
// POST /api/user/send-login-otp
// ─────────────────────────────────────────────────────────────────────────────
export const sendLoginOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const otp = generateOTP();
    user.otp = await bcrypt.hash(otp, 10);
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.otpVerified = false;
    await user.save();

    await sendOTPEmail(email, otp, 'login');

    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (err) {
    console.error('sendLoginOtp error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN OTP — Verify OTP and return token
// POST /api/user/verify-login-otp
// ─────────────────────────────────────────────────────────────────────────────
export const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP required' });

    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.otp || !user.otpExpiry)
      return res.status(400).json({ success: false, message: 'No OTP requested. Please try again.' });

    if (new Date() > user.otpExpiry)
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch)
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' });

    // Clear OTP
    user.otp = null;
    user.otpExpiry = null;
    user.otpVerified = true;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token });
  } catch (err) {
    console.error('verifyLoginOtp error:', err.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD — Send OTP
// POST /api/auth/forgot-password/send-otp
// ─────────────────────────────────────────────────────────────────────────────
export const sendPasswordResetOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await userModel.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, message: 'No account found with this email' });

    const otp = generateOTP();
    user.otp = await bcrypt.hash(otp, 10);
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.otpVerified = false;
    await user.save();

    await sendOTPEmail(email, otp, 'reset');

    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (err) {
    console.error('sendPasswordResetOtp error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Failed to send OTP. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD — Verify OTP
// POST /api/auth/forgot-password/verify-otp
// ─────────────────────────────────────────────────────────────────────────────
export const verifyPasswordResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });

    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.otp || !user.otpExpiry)
      return res.status(400).json({ success: false, message: 'No OTP requested. Please request a new one.' });

    if (new Date() > user.otpExpiry)
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch)
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' });

    user.otpVerified = true;
    await user.save();

    const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    res.json({ success: true, message: 'OTP verified successfully', resetToken });
  } catch (err) {
    console.error('verifyPasswordResetOtp error:', err.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD — Reset Password
// POST /api/auth/forgot-password/reset-password
// ─────────────────────────────────────────────────────────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword)
      return res.status(400).json({ success: false, message: 'Token and new password are required' });

    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ success: false, message: 'Reset session expired. Please start again.' });
    }

    const user = await userModel.findById(decoded.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.otpVerified)
      return res.status(403).json({ success: false, message: 'OTP not verified. Please verify OTP first.' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = null;
    user.otpExpiry = null;
    user.otpVerified = false;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully. Please login with your new password.' });
  } catch (err) {
    console.error('resetPassword error:', err.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CHANGE PASSWORD (logged-in user from MyProfile)
// ─────────────────────────────────────────────────────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Both passwords are required' });

    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.password)
      return res.status(400).json({ success: false, message: 'Google login accounts cannot change password this way' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('changePassword error:', err.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};