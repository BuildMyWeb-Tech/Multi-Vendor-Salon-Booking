// backend/models/doctorModel.js
import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    // NOTE: Global unique removed — uniqueness is per salon (shopId + email compound index below)
    email: { type: String, required: true },
    password: { type: String, required: true },
    image: { type: String, required: true },

    specialty: {
      type: [String],
      required: true,
    },

    certification: { type: String, required: true },
    experience: { type: String, required: true },
    about: { type: String, required: true },

    available: { type: Boolean, default: true },

    price: { type: Number, required: false },
    phone: {
      type: String,
      required: false,
      default: '',
    },

    instagram: { type: String, default: '' },
    workingHours: { type: String, default: '10AM-7PM' },

    leaveDates: {
      type: [String],
      default: [],
    },

    slots_booked: {
      type: Map,
      of: [String],
      default: {},
    },

    date: { type: Number, required: true },

    // ── OTP fields for login & forgot password ──────────────────────────────
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
    otpVerified: { type: Boolean, default: false },

    // Multi-tenant: which shop this stylist belongs to
    shopId: { type: String, default: 'SHOP001' },
  },
  { minimize: false }
);

// Unique email per salon (drop old `email_1` index in MongoDB if it exists)
doctorSchema.index({ shopId: 1, email: 1 }, { unique: true });
// Unique name per salon
doctorSchema.index({ shopId: 1, name: 1 }, { unique: true });

export default mongoose.model('doctor', doctorSchema);