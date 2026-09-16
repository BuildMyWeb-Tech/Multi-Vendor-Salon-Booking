// backend/models/AdminNotification.js
import mongoose from 'mongoose';

const adminNotificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'booking_confirmed',
        'booking_created',
        'booking_cancelled',
        'booking_rescheduled',
        'reminder',
        'general',
      ],
      default: 'general',
    },
    read: { type: Boolean, default: false },

    // Reference to the appointment
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'appointment',
      default: null,
    },
  },
  { timestamps: true }
);

adminNotificationSchema.index({ read: 1, createdAt: -1 });

const AdminNotification =
  mongoose.models.adminNotification || mongoose.model('adminNotification', adminNotificationSchema);

export default AdminNotification;
