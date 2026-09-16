// backend/models/SlotSettings.js
import mongoose from 'mongoose';

const slotSettingsSchema = new mongoose.Schema({
  // ✅ PRIMARY TIME SETTINGS - These control slot generation
  slotStartTime: {
    type: String,
    default: '09:00',
    required: true
  },
  slotEndTime: {
    type: String,
    default: '17:00',
    required: true
  },
  slotDuration: {
    type: Number,
    enum: [15, 30, 45, 60],
    default: 30
  },
  
  // Break time settings
  breakTime: {
    type: Boolean,
    default: true
  },
  breakStartTime: {
    type: String,
    default: '13:00'
  },
  breakEndTime: {
    type: String,
    default: '14:00'
  },
  
  // Days open
  daysOpen: {
    type: [String],
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  },
  
  // ✅ BOOKING WINDOW SETTINGS - Control how far in advance customers can book
  // NOTE: These fields are for the date RANGE (which days are bookable)
  // They do NOT control the TIME of slots (use slotStartTime/slotEndTime for that)
  openSlotsFromDate: {
    type: Date,
    default: Date.now,
    comment: 'Earliest date customers can book (not used for time calculation)'
  },
  openSlotsTillDate: {
    type: Date,
    default: () => {
      const date = new Date();
      date.setMonth(date.getMonth() + 1);
      return date;
    },
    comment: 'Latest date customers can book (not used for time calculation)'
  },
  
  // Rescheduling settings
  allowRescheduling: {
    type: Boolean,
    default: true
  },
  rescheduleHoursBefore: {
    type: Number,
    default: 24
  },
  
  // Booking constraints
  maxAdvanceBookingDays: {
    type: Number,
    default: 30,
    comment: 'How many days in advance customers can book'
  },
  minBookingTimeBeforeSlot: {
    type: Number,
    default: 2,
    comment: 'Minimum hours before a slot that it can be booked'
  },
  
  // Payment settings
  advancePaymentRequired: {
    type: Boolean,
    default: true
  },
  advancePaymentPercentage: {
    type: Number,
    enum: [10, 25, 30, 50, 75, 100],
    default: 100
  }
}, {
  timestamps: true
});

// Add index for faster queries
slotSettingsSchema.index({ createdAt: 1 });

const SlotSettings = mongoose.model('SlotSettings', slotSettingsSchema);

export default SlotSettings;