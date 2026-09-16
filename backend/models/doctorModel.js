// backend/models/doctorModel.js
import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
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
  },
  { minimize: false }
);

export default mongoose.model('doctor', doctorSchema);