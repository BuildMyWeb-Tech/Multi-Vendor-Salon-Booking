// backend/routes/authRoutes.js
import express from 'express';
import passport from '../config/passport.js';
import { googleAuthCallback } from '../controllers/authController.js';
import {
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPassword,
} from '../controllers/userPasswordController.js';

const router = express.Router();

// ── Forgot Password Routes (Email OTP) ───────────────────────────────────────
router.post('/forgot-password/send-otp', sendPasswordResetOtp);
router.post('/forgot-password/verify-otp', verifyPasswordResetOtp);
router.post('/forgot-password/reset-password', resetPassword);

// ── Google OAuth Routes ───────────────────────────────────────────────────────
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed`,
  }),
  googleAuthCallback
);

export default router;