// backend/controllers/bookingController.js
import doctorModel from '../models/doctorModel.js';
import userModel from '../models/userModel.js';
import appointmentModel from '../models/appointmentModel.js';
import SlotSettings from '../models/SlotSettings.js';
import { generateAvailableSlots, isSlotAvailable } from '../utils/slotUtils.js';

/**
 * Get available slots for a specific date and doctor
 */
export const getAvailableSlots = async (req, res) => {
  try {
    const { date, docId } = req.query;

    console.log('🔍 === GET AVAILABLE SLOTS API CALLED ===');
    console.log('📅 Requested date:', date);
    console.log('👤 Doctor ID:', docId);

    // ✅ Validate date
    if (!date || isNaN(new Date(date).getTime())) {
      console.log('❌ Invalid date provided');
      return res.json({ success: false, message: 'Invalid date' });
    }

    // ✅ Validate doctor (if provided)
    let doctor = null;
    if (docId) {
      doctor = await doctorModel.findById(docId);

      if (!doctor || !doctor.available) {
        console.log('❌ Stylist not found or unavailable');
        return res.json({ success: false, message: 'Stylist unavailable' });
      }

      console.log('✅ Doctor found:', doctor.name);
    }

    // ✅ Load slot settings
    const slotSettings = await SlotSettings.findOne();

    if (!slotSettings) {
      console.log('❌ Slot settings not found');
      return res.json({ success: false, message: 'Slot settings not configured' });
    }

    console.log('⚙️ Slot settings loaded for getAvailableSlots:', {
      slotStartTime: slotSettings.slotStartTime,
      slotEndTime: slotSettings.slotEndTime,
      slotDuration: slotSettings.slotDuration,
      breakTime: slotSettings.breakTime,
      breakStartTime: slotSettings.breakStartTime,
      breakEndTime: slotSettings.breakEndTime,
      daysOpen: slotSettings.daysOpen,
    });

    // ✅ Generate slots (LOCAL time only)
    const { slots, error } = await generateAvailableSlots(date, slotSettings);

    if (error) {
      console.log('❌ Error generating slots:', error);
      return res.json({ success: false, message: error });
    }

    console.log(`✅ Generated ${slots.length} slots before filtering`);

    // ✅ Filter booked slots for doctor
    if (doctor) {
      const slotKey = date;
      let bookedSlots = [];

      if (doctor.slots_booked instanceof Map) {
        bookedSlots = doctor.slots_booked.get(slotKey) || [];
      } else {
        bookedSlots = doctor.slots_booked?.[slotKey] || [];
      }

      console.log(`📅 Doctor has ${bookedSlots.length} slots booked for this date`);

      // 🔥 CRITICAL FIX (STEP 2)
      const availableSlots = slots.filter(slot => {
        const slotIdentifier = `${slot.date} ${slot.startTime}`;
        return !bookedSlots.includes(slotIdentifier);
      });

      console.log(`📋 Returning ${availableSlots.length} available slots after filtering`);

      if (availableSlots.length > 0) {
        console.log(
          `🕒 First available slot: ${availableSlots[0].date} ${availableSlots[0].startTime}`
        );
        console.log(
          `🕒 Last available slot: ${availableSlots[availableSlots.length - 1].date} ${availableSlots[availableSlots.length - 1].startTime}`
        );
      }

      console.log('🔍 === GET AVAILABLE SLOTS API END ===');

      return res.json({
        success: true,
        slots: availableSlots,
      });
    }

    console.log('🔍 === GET AVAILABLE SLOTS API END ===');

    return res.json({
      success: true,
      slots,
    });

  } catch (error) {
    console.error('❌ Error fetching slots:', error);
    return res.json({ success: false, message: 'Server error' });
  }
};

export const getAvailableDates = async (req, res) => {
  try {
    const { docId } = req.params;

    const settings = await SlotSettings.findOne();
    if (!settings) {
      return res.json({ success: false, dates: [] });
    }

    const daysOpen = settings.daysOpen || [];
    const maxDays = settings.maxAdvanceBookingDays || 14;

    const dates = [];
    const today = new Date();

    for (let i = 0; i < maxDays; i++) {
      // 🔥 LOCAL DATE (NO UTC)
      const d = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + i
      );

      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });

      if (!daysOpen.includes(dayName)) continue;

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');

      dates.push(`${yyyy}-${mm}-${dd}`);
    }

    return res.json({ success: true, dates });
  } catch (err) {
    console.error('❌ getAvailableDates error:', err);
    return res.json({ success: false, dates: [] });
  }
};

/**
 * Book a new appointment with multiple services and payment percentage
 */
export const bookAppointment = async (req, res) => {
  try {
    const {
      userId,
      docId,
      slotDate,   // YYYY-MM-DD
      slotTime,   // HH:mm
      services,
      totalAmount,
      paymentMethod
    } = req.body;

    console.log('📝 === BOOKING APPOINTMENT START ===');
    console.log('Request data:', {
      userId,
      docId,
      slotDate,
      slotTime,
      totalAmount,
      paymentMethod
    });

    // ✅ Basic validation
    if (!userId || !docId || !slotDate || !slotTime) {
      return res.json({ success: false, message: 'Missing booking data' });
    }

    if (!Array.isArray(services) || services.length === 0) {
      return res.json({ success: false, message: 'Please select at least one service' });
    }

    // ✅ Load settings (payment logic)
    const settings = await SlotSettings.findOne();

    let paymentPercentage = 100;
    let paidAmount = totalAmount;

    if (settings?.advancePaymentRequired) {
      paymentPercentage = settings.advancePaymentPercentage || 100;
      paidAmount = Math.round((totalAmount * paymentPercentage) / 100);
    }

    console.log(`💰 Payment: ${paymentPercentage}% = ${paidAmount}`);

    // ✅ Load doctor
    const doctor = await doctorModel.findById(docId);
    if (!doctor || !doctor.available) {
      return res.json({ success: false, message: 'Stylist unavailable' });
    }

    // ✅ Load user
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    // ✅ CORRECT availability check
    const isAvailable = await isSlotAvailable(docId, slotDate, slotTime);
    if (!isAvailable) {
      return res.json({ success: false, message: 'Slot no longer available' });
    }

    // ✅ Initialize slots_booked
    if (!doctor.slots_booked) doctor.slots_booked = new Map();
    const daySlots = doctor.slots_booked.get(slotDate) || [];

    if (daySlots.includes(slotTime)) {
      return res.json({ success: false, message: 'Slot already booked' });
    }

    daySlots.push(slotTime);
    doctor.slots_booked.set(slotDate, daySlots);

    await doctorModel.findByIdAndUpdate(
      docId,
      { slots_booked: doctor.slots_booked },
      { runValidators: false }
    );

    // ✅ Create Date object safely
    const slotDateTime = new Date(`${slotDate}T${slotTime}:00`);

    const displayTime = slotDateTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const serviceNames = services.map(s => s.name).join(', ');

    const appointment = new appointmentModel({
      userId,
      doctorId: docId,
      slotDate,
      slotTime: displayTime,
      slotDateTime,
      amount: totalAmount,
      paidAmount,
      paymentPercentage,
      service: serviceNames,
      services,
      payment: true,
      paymentMethod: paymentMethod || 'stripe',
      userData: {
        name: user.name,
        phone: user.phone,
        image: user.image
      },
      docData: {
        name: doctor.name,
        image: doctor.image,
        speciality: doctor.specialty.join(', ')
      }
    });

    await appointment.save();

    console.log('✅ Appointment booked successfully');
    console.log('📝 === BOOKING APPOINTMENT END ===');

    return res.json({
      success: true,
      message: 'Appointment booked successfully',
      appointmentId: appointment._id,
      paidAmount,
      remainingAmount: totalAmount - paidAmount
    });

  } catch (error) {
    console.error('❌ Booking error:', error);

    if (error.code === 11000) {
      return res.json({ success: false, message: 'Slot already booked' });
    }

    return res.json({ success: false, message: 'Booking failed' });
  }
};

/**
 * Reschedule an existing appointment
 */
export const rescheduleAppointment = async (req, res) => {
  try {
    const { userId, appointmentId, slotDate, slotTime } = req.body;

    console.log('🔄 === RESCHEDULING APPOINTMENT START ===');
    console.log('Request data:', { userId, appointmentId, slotDate, slotTime });

    if (!userId || !appointmentId || !slotDate || !slotTime) {
      return res.json({ success: false, message: 'Missing required fields' });
    }

    const appointmentData = await appointmentModel.findById(appointmentId);
    if (!appointmentData) {
      return res.json({ success: false, message: 'Appointment not found' });
    }

    if (appointmentData.userId.toString() !== userId.toString()) {
      return res.json({ success: false, message: 'Unauthorized action' });
    }

    if (appointmentData.isCompleted) {
      return res.json({ success: false, message: 'Cannot reschedule completed appointment' });
    }

    const settings = await SlotSettings.findOne();
    if (settings && !settings.allowRescheduling) {
      return res.json({ success: false, message: 'Rescheduling is not allowed' });
    }

    // ⏱️ Time restriction check (Date used ONLY for validation)
    const now = new Date();
    const oldSlotDateTime = new Date(`${appointmentData.slotDate}T${appointmentData.slotTime}`);

    const rescheduleHours = settings?.rescheduleHoursBefore || 3;
    const minMs = rescheduleHours * 60 * 60 * 1000;

    if (oldSlotDateTime - now < minMs) {
      return res.json({
        success: false,
        message: `Appointments can only be rescheduled at least ${rescheduleHours} hours before`
      });
    }

    // 🔑 NEW SLOT KEY (CRITICAL FIX)
    const newSlotKey = `${slotDate} ${slotTime}`;
    const oldSlotKey = appointmentData.slotKey;

    console.log('🔑 Old slot key:', oldSlotKey);
    console.log('🔑 New slot key:', newSlotKey);

    // ✅ Validate slot exists
    const { slots, error } = await generateAvailableSlots(slotDate);
    if (error) {
      return res.json({ success: false, message: error });
    }

    const isValidSlot = slots.some(slot => slot.startTime === slotTime);
    if (!isValidSlot) {
      return res.json({ success: false, message: 'Invalid slot time' });
    }

    // ✅ Load doctor
    const doctor = await doctorModel.findById(appointmentData.doctorId);
    if (!doctor || !doctor.available) {
      return res.json({ success: false, message: 'Stylist not available' });
    }

    // ✅ Normalize slots_booked
    let slots_booked = doctor.slots_booked || new Map();

    if (!(slots_booked instanceof Map)) {
      const converted = new Map();
      for (const [key, value] of Object.entries(slots_booked)) {
        converted.set(key, value);
      }
      slots_booked = converted;
    }

    // ❌ Check if new slot already booked
    const bookedForNewDate = slots_booked.get(slotDate) || [];
    if (bookedForNewDate.includes(newSlotKey)) {
      return res.json({ success: false, message: 'Slot not available' });
    }

    // ✅ Remove old slot
    if (oldSlotKey) {
      const oldDate = appointmentData.slotDate;
      const oldSlots = slots_booked.get(oldDate) || [];
      slots_booked.set(
        oldDate,
        oldSlots.filter(s => s !== oldSlotKey)
      );
    }

    // ✅ Add new slot
    bookedForNewDate.push(newSlotKey);
    slots_booked.set(slotDate, bookedForNewDate);

    // ⏰ Display time
    const displayTime = new Date(`${slotDate}T${slotTime}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // ✅ Update appointment
    await appointmentModel.findByIdAndUpdate(appointmentId, {
      slotDate,
      slotTime: displayTime,
      slotKey: newSlotKey,
      rescheduled: true,
      cancelled: false,
      cancelledBy: null
    });

    // ✅ Update doctor
    await doctorModel.findByIdAndUpdate(
      appointmentData.doctorId,
      { slots_booked },
      { runValidators: false }
    );

    console.log('✅ Appointment rescheduled successfully');
    console.log('🔄 === RESCHEDULING APPOINTMENT END ===');

    return res.json({
      success: true,
      message: 'Appointment rescheduled successfully'
    });

  } catch (error) {
    console.error('❌ Error rescheduling appointment:', error);
    return res.json({ success: false, message: 'Reschedule failed' });
  }
};

