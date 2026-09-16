// backend/controllers/authController.js
// ✅ FIXED: This file handles ONLY Google OAuth token generation
// Forgot Password OTP is handled in userPasswordController.js

import jwt from 'jsonwebtoken';

// Called after passport.authenticate() succeeds in authRoutes.js
export const googleAuthCallback = (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=google_failed`);
    }

    // ✅ Generate JWT token with userId
    const token = jwt.sign(
      { id: user._id, name: user.name }, // ✅ FIXED: use "id" not "userId" — consistent with authUser middleware
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // ✅ Redirect frontend with token in URL
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  } catch (err) {
    console.error('googleAuthCallback error:', err);
    res.redirect(`${process.env.CLIENT_URL}/login?error=server_error`);
  }
};
