// C:\Users\Siddharathan\Desktop\salon-booking-full-stack\backend\utils\slotUtils.js
import SlotSettings from '../models/SlotSettings.js';
import Appointment from '../models/appointmentModel.js';
import doctorModel from '../models/doctorModel.js';
import mongoose from 'mongoose';

/**
 * Generate available time slots for a specific date and stylist.
 * ✅ NO ISO STRINGS, NO UTC/Z — PURE LOCAL DATE + TIME STRINGS
 * ✅ RESPECTS STYLIST LEAVE DATES
 *
 * @param {string|Date} date
 * @param {object|null} customSettings  - pre-loaded SlotSettings doc
 * @param {string|null} doctorId        - stylist ObjectId (to check leave dates)
 */
export const generateAvailableSlots = async (date, customSettings = null, doctorId = null) => {
  try {
    const settings = customSettings || (await SlotSettings.findOne());
    if (!settings) return { slots: [], error: 'Slot settings not configured' };

    // Safe YYYY-MM-DD from local time
    const dateStr =
      typeof date === 'string'
        ? date
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const [year, month, day] = dateStr.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Check salon is open that day
    if (!settings.daysOpen.includes(dayName)) {
      return { slots: [], error: 'Selected day is not available' };
    }

    // Check stylist leave dates
    if (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) {
      const stylist = await doctorModel.findById(doctorId).select('leaveDates');
      if (stylist && Array.isArray(stylist.leaveDates) && stylist.leaveDates.includes(dateStr)) {
        return { slots: [], error: 'Stylist is on leave on this date' };
      }
    }

    const startTimeSetting = settings.slotStartTime || '09:00';
    const endTimeSetting   = settings.slotEndTime   || '17:00';
    const slotDuration     = settings.slotDuration  || 60;

    const [startHour, startMinute] = startTimeSetting.split(':').map(Number);
    const [endHour,   endMinute  ] = endTimeSetting.split(':').map(Number);

    let currentTime = new Date(year, month - 1, day, startHour, startMinute, 0, 0);
    let endDateTime = new Date(year, month - 1, day, endHour,   endMinute,   0, 0);
    if (endDateTime <= currentTime) endDateTime.setDate(endDateTime.getDate() + 1);

    const slots = [];
    const now = new Date();
    const minBookingBufferMs = (settings.minBookingTimeBeforeSlot || 0) * 60 * 60 * 1000;

    // ✅ FIX: only filter past/too-soon slots when the selected date is TODAY
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const isToday  = dateStr === todayStr;

    while (currentTime < endDateTime) {
      const slotStart = new Date(currentTime);

      // Break time check
      let isDuringBreak = false;
      if (settings.breakTime && settings.breakStartTime && settings.breakEndTime) {
        const [bsH, bsM] = settings.breakStartTime.split(':').map(Number);
        const [beH, beM] = settings.breakEndTime.split(':').map(Number);
        const breakStart = new Date(year, month - 1, day, bsH, bsM);
        const breakEnd   = new Date(year, month - 1, day, beH, beM);
        if (breakEnd <= breakStart) breakEnd.setDate(breakEnd.getDate() + 1);
        isDuringBreak = slotStart >= breakStart && slotStart < breakEnd;
      }

      // ✅ FIX: isTooSoon only applies to today — future dates always show all slots
      const isTooSoon = isToday && slotStart <= new Date(now.getTime() + minBookingBufferMs);

      if (!isDuringBreak && !isTooSoon) {
        const slotEnd   = new Date(slotStart.getTime() + slotDuration * 60000);
        const startTime = `${String(slotStart.getHours()).padStart(2, '0')}:${String(slotStart.getMinutes()).padStart(2, '0')}`;
        const endTime   = `${String(slotEnd.getHours()).padStart(2, '0')}:${String(slotEnd.getMinutes()).padStart(2, '0')}`;
        slots.push({ date: dateStr, startTime, endTime });
      }

      currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
    }

    return { slots, error: null };
  } catch (error) {
    console.error('❌ generateAvailableSlots error:', error);
    return { slots: [], error: 'Failed to generate slots' };
  }
};

/**
 * Check if a slot is free for a given doctor + date + time.
 * ✅ Handles BOTH 'doctorId' and 'docId' field names (backwards compatible)
 * ✅ Checks stylist leave dates as a safety net
 */
export const isSlotAvailable = async (doctorId, date, time) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      console.error('❌ Invalid doctorId in isSlotAvailable:', doctorId);
      return false;
    }
    if (!date || !time) {
      console.error('❌ Missing date or time in isSlotAvailable:', { date, time });
      return false;
    }

    // Check leave date
    const stylist = await doctorModel.findById(doctorId).select('leaveDates');
    if (stylist && Array.isArray(stylist.leaveDates) && stylist.leaveDates.includes(date)) {
      return false;
    }

    // Check both doctorId and docId field names for backwards compatibility
    const existing = await Appointment.findOne({
      $or: [
        { doctorId, slotDate: date, slotTime: time, cancelled: false },
        { docId: doctorId, slotDate: date, slotTime: time, cancelled: false },
      ],
    }).lean();

    return !existing;
  } catch (error) {
    console.error('❌ isSlotAvailable error:', error);
    return false;
  }
};