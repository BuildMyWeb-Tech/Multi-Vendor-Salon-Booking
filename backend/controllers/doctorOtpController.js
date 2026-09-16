// backend/controllers/doctorOtpController.js
import doctorModel from '../models/doctorModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendOTPEmail } from '../utils/sendEmail.js';

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─────────────────────────────────────────────────────────────────────────────
// STYLIST LOGIN OTP — Send OTP after credentials verified
// POST /api/doctor/send-login-otp
// ─────────────────────────────────────────────────────────────────────────────
export const sendStylistLoginOtp = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required' });

    const doctor = await doctorModel.findOne({ email });
    if (!doctor)
      return res.status(404).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch)
      return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const otp = generateOTP();
    doctor.otp = await bcrypt.hash(otp, 10);
    doctor.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    doctor.otpVerified = false;
    await doctor.save();

    await sendOTPEmail(email, otp, 'login');

    res.json({ success: true, message: 'OTP sent to your registered email' });
  } catch (err) {
    console.error('sendStylistLoginOtp error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLIST LOGIN OTP — Verify OTP and return token
// POST /api/doctor/verify-login-otp
// ─────────────────────────────────────────────────────────────────────────────
export const verifyStylistLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });

    const doctor = await doctorModel.findOne({ email });
    if (!doctor)
      return res.status(404).json({ success: false, message: 'User not found' });

    if (!doctor.otp || !doctor.otpExpiry)
      return res.status(400).json({ success: false, message: 'No OTP requested. Please try again.' });

    if (new Date() > doctor.otpExpiry)
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });

    const isMatch = await bcrypt.compare(otp, doctor.otp);
    if (!isMatch)
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' });

    doctor.otp = null;
    doctor.otpExpiry = null;
    doctor.otpVerified = true;
    await doctor.save();

    const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET);
    res.json({ success: true, token });
  } catch (err) {
    console.error('verifyStylistLoginOtp error:', err.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLIST FORGOT PASSWORD — Send OTP
// POST /api/doctor/forgot-password/send-otp
// ─────────────────────────────────────────────────────────────────────────────
export const sendStylistResetOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: 'Email is required' });

    const doctor = await doctorModel.findOne({ email });
    if (!doctor)
      return res.status(404).json({ success: false, message: 'No stylist account found with this email' });

    const otp = generateOTP();
    doctor.otp = await bcrypt.hash(otp, 10);
    doctor.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    doctor.otpVerified = false;
    await doctor.save();

    await sendOTPEmail(email, otp, 'reset');

    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (err) {
    console.error('sendStylistResetOtp error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLIST FORGOT PASSWORD — Verify OTP
// POST /api/doctor/forgot-password/verify-otp
// ─────────────────────────────────────────────────────────────────────────────
export const verifyStylistResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });

    const doctor = await doctorModel.findOne({ email });
    if (!doctor)
      return res.status(404).json({ success: false, message: 'Stylist not found' });

    if (!doctor.otp || !doctor.otpExpiry)
      return res.status(400).json({ success: false, message: 'No OTP requested. Please request a new one.' });

    if (new Date() > doctor.otpExpiry)
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });

    const isMatch = await bcrypt.compare(otp, doctor.otp);
    if (!isMatch)
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' });

    doctor.otpVerified = true;
    await doctor.save();

    const resetToken = jwt.sign({ doctorId: doctor._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    res.json({ success: true, message: 'OTP verified successfully', resetToken });
  } catch (err) {
    console.error('verifyStylistResetOtp error:', err.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLIST FORGOT PASSWORD — Reset Password
// POST /api/doctor/forgot-password/reset-password
// ─────────────────────────────────────────────────────────────────────────────
export const resetStylistPassword = async (req, res) => {
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

    const doctor = await doctorModel.findById(decoded.doctorId);
    if (!doctor)
      return res.status(404).json({ success: false, message: 'Stylist not found' });

    if (!doctor.otpVerified)
      return res.status(403).json({ success: false, message: 'OTP not verified. Please verify OTP first.' });

    const salt = await bcrypt.genSalt(10);
    doctor.password = await bcrypt.hash(newPassword, salt);
    doctor.otp = null;
    doctor.otpExpiry = null;
    doctor.otpVerified = false;
    await doctor.save();

    res.json({ success: true, message: 'Password updated successfully. Please login with your new password.' });
  } catch (err) {
    console.error('resetStylistPassword error:', err.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};