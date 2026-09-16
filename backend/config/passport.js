// backend/config/passport.js
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import userModel from '../models/userModel.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // ✅ FIXED: callbackURL now uses BACKEND_URL env var for production
      // In .env set: GOOGLE_CALLBACK_URL=https://your-backend.com/api/auth/google/callback
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const photo = profile.photos?.[0]?.value;

        if (!email) {
          return done(new Error('No email returned from Google'), null);
        }

        // 1. Check if user already has this Google ID
        let user = await userModel.findOne({ googleId: profile.id });

        if (!user) {
          // 2. Check if email already exists (normal signup)
          user = await userModel.findOne({ email });

          if (user) {
            // Link Google to existing account
            user.googleId = profile.id;
            if (!user.image) user.image = photo;
            await user.save();
          } else {
            // 3. Create new user via Google
            user = await userModel.create({
              name: profile.displayName,
              email,
              googleId: profile.id,
              image: photo || '',
              // ✅ Phone placeholder — user can update later in profile
              phone: `google_${profile.id}`,
              password: null,
            });
          }
        }

        return done(null, user);
      } catch (err) {
        console.error('Passport GoogleStrategy error:', err.message);
        return done(err, null);
      }
    }
  )
);

export default passport;
