// backend/models/appointmentModel.js
import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'doctor',
      required: true,
    },

    slotDate: {
      type: String,
      required: true,
    },

    slotTime: {
      type: String,
      required: true,
    },

    slotDateTime: {
      type: Date,
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    // ✅ NEW: Track partial payment
    paidAmount: {
      type: Number,
      default: 0,
    },

    remainingAmount: {
      type: Number,
      default: 0,
    },

    // ✅ NEW: Payment percentage used
    paymentPercentage: {
      type: Number,
      default: 100,
    },

    // Backward compatibility - combined service names
    service: {
      type: String,
      default: 'Hair Styling',
    },

    // Array of services with individual prices
    services: [
      {
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],

    payment: {
      type: Boolean,
      default: false,
    },

    paymentMethod: {
      type: String,
      enum: ['razorpay', 'stripe', 'cash', 'upi', null],
      default: null,
    },

    paymentScreenshot: { type: String, default: '' },
    utrNumber: { type: String, default: '' },
    paymentVerified: { type: Boolean, default: false },
    ocrData: { type: mongoose.Schema.Types.Mixed, default: null },

    cancelled: {
      type: Boolean,
      default: false,
    },

    cancelledBy: {
      type: String,
      enum: ['user', 'admin', 'system', null],
      default: null,
    },

    isCompleted: {
      type: Boolean,
      default: false,
    },

    rescheduled: {
      type: Boolean,
      default: false,
    },

    // ✅ Prevents duplicate 24-hour reminder notifications from cron
    reminderSent: { type: Boolean, default: false },

    // ✅ Human-readable cancellation reason shown to the user
    cancellationReason: { type: String, default: null },

    userData: {
      name: String,
      phone: String,
      email: String,
      image: String,
    },

    docData: {
      name: String,
      image: String,
      speciality: String,
      price: Number,
    },

    // Multi-tenant
    shopId: { type: String, default: 'SHOP001' },
  },
  { timestamps: true }
);

// Prevent double booking — only for non-cancelled appointments so freed slots can be re-booked
appointmentSchema.index(
  { doctorId: 1, slotDateTime: 1 },
  { unique: true, partialFilterExpression: { cancelled: false } }
);

// Indexes for efficient querying
appointmentSchema.index({ userId: 1, isCompleted: 1 });
appointmentSchema.index({ doctorId: 1, isCompleted: 1 });

export default mongoose.model('appointment', appointmentSchema);
