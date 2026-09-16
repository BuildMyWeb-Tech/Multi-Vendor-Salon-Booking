// backend/routes/doctorRoute.js
import express from 'express';
import {
  loginDoctor,
  appointmentsDoctor,
  appointmentCancel,
  doctorList,
  changeAvailablity,
  appointmentComplete,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile,
} from '../controllers/doctorController.js';

import {
  sendStylistLoginOtp,
  verifyStylistLoginOtp,
  sendStylistResetOtp,
  verifyStylistResetOtp,
  resetStylistPassword,
} from '../controllers/doctorOtpController.js';

import authDoctor from '../middleware/authDoctor.js';

const doctorRouter = express.Router();

// ── AUTH ─────────────────────────────────────────────────────────────────────
doctorRouter.post('/login', loginDoctor);

// ── OTP LOGIN (Step 1: verify credentials + send OTP, Step 2: verify OTP) ───
doctorRouter.post('/send-login-otp', sendStylistLoginOtp);
doctorRouter.post('/verify-login-otp', verifyStylistLoginOtp);

// ── FORGOT PASSWORD ──────────────────────────────────────────────────────────
doctorRouter.post('/forgot-password/send-otp', sendStylistResetOtp);
doctorRouter.post('/forgot-password/verify-otp', verifyStylistResetOtp);
doctorRouter.post('/forgot-password/reset-password', resetStylistPassword);

// ── APPOINTMENTS ─────────────────────────────────────────────────────────────
doctorRouter.post('/cancel-appointment', authDoctor, appointmentCancel);
doctorRouter.get('/appointments', authDoctor, appointmentsDoctor);
doctorRouter.post('/complete-appointment', authDoctor, appointmentComplete);

// ── DOCTOR INFO ──────────────────────────────────────────────────────────────
doctorRouter.get('/list', doctorList);
doctorRouter.post('/change-availability', authDoctor, changeAvailablity);
doctorRouter.get('/dashboard', authDoctor, doctorDashboard);
doctorRouter.get('/profile', authDoctor, doctorProfile);
doctorRouter.post('/update-profile', authDoctor, updateDoctorProfile);

export default doctorRouter;