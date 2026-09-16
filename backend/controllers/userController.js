// C:\Users\Siddharathan\Desktop\salon-booking-full-stack\backend\controllers\userController.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import validator from 'validator';
import userModel from '../models/userModel.js';
import doctorModel from '../models/doctorModel.js';
import appointmentModel from '../models/appointmentModel.js';
import { v2 as cloudinary } from 'cloudinary';
import stripe from 'stripe';
import { generateAvailableSlots, isSlotAvailable } from '../utils/slotUtils.js';
import SlotSettings from '../models/SlotSettings.js';
import BlockedDate from '../models/BlockedDate.js';
import RecurringHoliday from '../models/RecurringHoliday.js';
import SpecialWorkingDay from '../models/SpecialWorkingDay.js';
import AdminNotification from '../models/AdminNotification.js';

// ── Stripe (test mode — replace STRIPE_SECRET_KEY with live key when ready) ──
const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

// ── Razorpay — uncomment + install package when you have real keys ────────────
// import Razorpay from 'razorpay';
// const razorpayInstance = new Razorpay({
//   key_id:     process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// ─── Helper: format slotDate + slotTime for human-readable display ────────────
const formatDisplayDate = (slotDate, slotTime) => {
  const [y, m, d] = slotDate.split('-').map(Number);
  const dateStr = new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const [h, min] = slotTime.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  const timeStr = `${hour12}:${String(min).padStart(2, '0')} ${period}`;
  return { dateStr, timeStr };
};

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password || !phone)
      return res.json({ success: false, message: 'Missing Details' });
    if (!validator.isEmail(email))
      return res.json({ success: false, message: 'Please enter a valid email' });
    if (!validator.isMobilePhone(phone, 'any'))
      return res.json({ success: false, message: 'Please enter a valid phone number' });
    if (password.length < 8)
      return res.json({ success: false, message: 'Please enter a strong password' });
    if (await userModel.findOne({ email }))
      return res.json({ success: false, message: 'User already exists with this email' });
    if (await userModel.findOne({ phone }))
      return res.json({ success: false, message: 'Phone number already registered' });

    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
    const user = await new userModel({ name, email, password: hashedPassword, phone }).save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) return res.json({ success: false, message: 'User does not exist' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.json({ success: false, message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────────────────────

const getProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    const userData = await userModel.findById(userId).select('-password');
    res.json({ success: true, userData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { userId, name, phone, address, dob, gender } = req.body;
    const imageFile = req.file;

    // Only name and phone are truly required; gender/dob/address are optional
    if (!name || !phone)
      return res.json({ success: false, message: 'Name and phone are required' });

    const updateData = {
      name,
      phone,
      address: address ? JSON.parse(address) : { line1: '', line2: '' },
      dob: dob || '',
      gender: gender || 'Not Selected',
    };

    await userModel.findByIdAndUpdate(userId, updateData);

    if (imageFile && imageFile.path) {
      const { secure_url } = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: 'image',
      });
      await userModel.findByIdAndUpdate(userId, { image: secure_url });
    }

    res.json({ success: true, message: 'Profile Updated' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SERVICES  –  GET /api/user/services
// ─────────────────────────────────────────────────────────────────────────────

export const getServices = async (req, res) => {
  try {
    const { default: ServiceCategory } = await import('../models/ServiceCategory.js');
    const services = await ServiceCategory.find({ isActive: true }).sort({ order: 1, name: 1 });
    res.json({ success: true, services });
  } catch (error) {
    console.error('getServices error:', error);
    res.json({ success: true, services: [] });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// AVAILABLE DATES  –  GET /api/user/available-dates/:docId
// ─────────────────────────────────────────────────────────────────────────────

export const getAvailableDates = async (req, res) => {
  try {
    const { docId } = req.params;
    const doctor = await doctorModel.findById(docId).select('available leaveDates');
    if (!doctor) return res.json({ success: false, message: 'Stylist not found' });
    if (!doctor.available) return res.json({ success: false, message: 'Stylist is not available' });

    const settings = await SlotSettings.findOne();
    if (!settings) return res.json({ success: false, message: 'Slot settings not configured' });

    const blockedDates = await BlockedDate.find();
    const recurringHols = await RecurringHoliday.find();
    const specialDays = await SpecialWorkingDay.find();

    const toStr = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const blockedSet = new Set(blockedDates.map((b) => toStr(new Date(b.date))));
    const specialSet = new Set(specialDays.map((s) => toStr(new Date(s.date))));
    const leaveSet = new Set(doctor.leaveDates || []);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDays = settings.maxAdvanceBookingDays || 30;
    const result = [];

    for (let i = 0; i <= maxDays; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const str = toStr(d);
      const day = d.toLocaleDateString('en-US', { weekday: 'long' });

      if (leaveSet.has(str)) continue;
      if (blockedSet.has(str)) continue;

      const isSpecial = specialSet.has(str);
      let isHoliday = false;
      for (const h of recurringHols) {
        if (h.type === 'weekly' && h.value === day) {
          isHoliday = true;
          break;
        }
        if (h.type === 'monthly' && h.value === String(d.getDate())) {
          isHoliday = true;
          break;
        }
      }
      if (isHoliday && !isSpecial) continue;
      if (!settings.daysOpen.includes(day) && !isSpecial) continue;

      result.push(str);
    }

    res.json({ success: true, dates: result });
  } catch (error) {
    console.error('❌ getAvailableDates:', error);
    res.json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// AVAILABLE SLOTS  –  GET /api/user/available-slots?date=&docId=
// ─────────────────────────────────────────────────────────────────────────────

export const getAvailableSlots = async (req, res) => {
  try {
    const { date, docId } = req.query;
    if (!date || !docId)
      return res.json({ success: false, message: 'Date and stylist ID are required' });

    const doctor = await doctorModel.findById(docId).select('available leaveDates');
    if (!doctor) return res.json({ success: false, message: 'Stylist not found' });
    if (!doctor.available) return res.json({ success: false, message: 'Stylist is not available' });
    if ((doctor.leaveDates || []).includes(date))
      return res.json({ success: true, slots: [], message: 'Stylist is on leave on this date' });

    const settings = await SlotSettings.findOne();
    if (!settings) return res.json({ success: false, message: 'Slot settings not configured' });

    const { slots: allSlots, error } = await generateAvailableSlots(date, settings, docId);
    if (error && allSlots.length === 0) return res.json({ success: false, message: error });

    const free = [];
    for (const slot of allSlots) {
      if (await isSlotAvailable(docId, date, slot.startTime)) free.push(slot);
    }

    res.json({ success: true, slots: free });
  } catch (error) {
    console.error('❌ getAvailableSlots:', error);
    res.json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BOOK APPOINTMENT  –  POST /api/user/book-appointment
// ✅ Sends booking confirmation to: User + Admin
// ─────────────────────────────────────────────────────────────────────────────

export const bookAppointment = async (req, res) => {
  try {
    const {
      userId,
      docId,
      slotDate,
      slotTime,
      services,
      totalAmount,
      paidAmount,
      remainingAmount,
      paymentMethod,
    } = req.body;

    console.log('📋 Booking attempt:', { userId, docId, slotDate, slotTime });

    if (!userId)
      return res.json({ success: false, message: 'User not authenticated. Please login again.' });
    if (!docId || !slotDate || !slotTime)
      return res.json({ success: false, message: 'Missing required booking details.' });

    const userData = await userModel.findById(userId).select('-password');
    if (!userData)
      return res.json({ success: false, message: 'User account not found. Please login again.' });

    const docData = await doctorModel.findById(docId).select('-password');
    if (!docData) return res.json({ success: false, message: 'Stylist not found.' });
    if (!docData.available)
      return res.json({ success: false, message: 'Stylist is not currently available.' });

    if ((docData.leaveDates || []).includes(slotDate))
      return res.json({
        success: false,
        message: 'The stylist is on leave on the selected date. Please choose another date.',
      });

    const slotFree = await isSlotAvailable(docId, slotDate, slotTime);
    if (!slotFree)
      return res.json({
        success: false,
        message: 'This slot was just taken. Please select another time.',
      });

    const finalAmount = Number(totalAmount) || docData.price || 0;
    const finalPaid = Number(paidAmount) || 0;
    const finalRemaining = Number(remainingAmount) || 0;

    const [sYear, sMonth, sDay] = slotDate.split('-').map(Number);
    const [sHour, sMinute] = slotTime.split(':').map(Number);
    const slotDateTime = new Date(sYear, sMonth - 1, sDay, sHour, sMinute, 0, 0);

    const newAppointment = await new appointmentModel({
      userId,
      doctorId: docId,
      docId,
      userData: {
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        image: userData.image || '',
      },
      docData: {
        name: docData.name,
        image: docData.image,
        specialty: docData.specialty,
        price: docData.price,
      },
      slotDate,
      slotTime,
      slotDateTime,
      services: Array.isArray(services) ? services : [],
      amount: finalAmount,
      paidAmount: finalPaid,
      remainingAmount: finalRemaining,
      payment: finalPaid > 0,
      paymentMethod: paymentMethod || 'cash',
      date: Date.now(),
    }).save();

    // Mark slot booked in doctor's map
    const slots_booked =
      docData.slots_booked instanceof Map
        ? docData.slots_booked
        : new Map(Object.entries(docData.slots_booked || {}));
    const prev = slots_booked.get(slotDate) || [];
    prev.push(slotTime);
    slots_booked.set(slotDate, prev);
    await doctorModel.findByIdAndUpdate(docId, { slots_booked }, { runValidators: false });

    // Format for notifications
    const { dateStr, timeStr } = formatDisplayDate(slotDate, slotTime);

    // ✅ Notify USER — booking confirmation
    await userModel.findByIdAndUpdate(userId, {
      $push: {
        notifications: {
          title: '✅ Booking Confirmed!',
          message: `Your appointment with ${docData.name} is confirmed for ${dateStr} at ${timeStr}. We look forward to seeing you!`,
          type: 'info',
          read: false,
          link: '/my-appointments',
          createdAt: new Date(),
        },
      },
    });

    // ✅ Notify ADMIN — new booking alert
    await AdminNotification.create({
      title: '🆕 New Booking',
      message: `${userData.name} booked an appointment with ${docData.name} on ${dateStr} at ${timeStr}.`,
      type: 'booking_confirmed',
      appointmentId: newAppointment._id,
      meta: { userName: userData.name, stylistName: docData.name, slotDate, slotTime },
    });

    console.log('✅ Appointment booked:', newAppointment._id.toString());
    res.json({ success: true, message: 'Appointment Booked Successfully' });
  } catch (error) {
    console.error('❌ bookAppointment error:', error.message);
    console.error(error.stack);
    res.json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CANCEL APPOINTMENT  –  POST /api/user/cancel-appointment
// ✅ Sends cancellation notice to: User + Admin
// ─────────────────────────────────────────────────────────────────────────────

export const cancelAppointment = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;
    if (!appointmentId) return res.json({ success: false, message: 'Appointment ID required' });

    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) return res.json({ success: false, message: 'Appointment not found' });

    if (appointment.userId.toString() !== userId.toString())
      return res.json({ success: false, message: 'Unauthorized action' });
    if (appointment.cancelled)
      return res.json({ success: false, message: 'Appointment already cancelled' });
    if (appointment.isCompleted)
      return res.json({ success: false, message: 'Cannot cancel completed appointment' });

    if (appointment.slotDateTime) {
      const hoursDiff = (new Date(appointment.slotDateTime) - new Date()) / 3600000;
      if (hoursDiff < 3)
        return res.json({
          success: false,
          message: 'Appointments can only be cancelled at least 3 hours before the scheduled time',
        });
    }

    appointment.cancelled = true;
    appointment.cancelledBy = 'user';
    appointment.cancellationReason = 'Cancelled by customer.';
    await appointment.save();

    // Release slot
    const doctorId = appointment.doctorId || appointment.docId;
    const doctor = await doctorModel.findById(doctorId);
    if (doctor) {
      const slots_booked =
        doctor.slots_booked instanceof Map
          ? doctor.slots_booked
          : new Map(Object.entries(doctor.slots_booked || {}));

      let t = appointment.slotTime || '';
      const m12 = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (m12) {
        let h = parseInt(m12[1]);
        if (m12[3].toUpperCase() === 'PM' && h !== 12) h += 12;
        if (m12[3].toUpperCase() === 'AM' && h === 12) h = 0;
        t = `${String(h).padStart(2, '0')}:${m12[2]}`;
      }
      const existing = slots_booked.get(appointment.slotDate) || [];
      slots_booked.set(
        appointment.slotDate,
        existing.filter((x) => x !== t)
      );
      await doctorModel.findByIdAndUpdate(doctorId, { slots_booked }, { runValidators: false });
    }

    const { dateStr, timeStr } = formatDisplayDate(appointment.slotDate, appointment.slotTime);
    const stylistName = appointment.docData?.name || 'your stylist';
    const userName = appointment.userData?.name || 'A customer';

    // ✅ Notify USER — cancellation confirmation
    await userModel.findByIdAndUpdate(userId, {
      $push: {
        notifications: {
          title: '❌ Appointment Cancelled',
          message: `Your appointment with ${stylistName} on ${dateStr} at ${timeStr} has been cancelled. You can rebook anytime.`,
          type: 'cancellation',
          read: false,
          link: '/my-appointments',
          createdAt: new Date(),
        },
      },
    });

    // ✅ Notify ADMIN — cancellation alert
    await AdminNotification.create({
      title: '🚫 Booking Cancelled by User',
      message: `${userName} cancelled their appointment with ${stylistName} on ${dateStr} at ${timeStr}.`,
      type: 'booking_cancelled',
      appointmentId: appointment._id,
      meta: {
        userName,
        stylistName,
        slotDate: appointment.slotDate,
        slotTime: appointment.slotTime,
      },
    });

    res.json({ success: true, message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('❌ cancelAppointment error:', error);
    res.json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LIST USER APPOINTMENTS
// ─────────────────────────────────────────────────────────────────────────────

const listAppointment = async (req, res) => {
  try {
    const { userId } = req.body;
    const appointments = await appointmentModel.find({ userId }).sort({ date: -1 });
    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STRIPE PAYMENT (test mode)
// ─────────────────────────────────────────────────────────────────────────────

const paymentStripe = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const { origin } = req.headers;

    const appt = await appointmentModel.findById(appointmentId);
    if (!appt || appt.cancelled)
      return res.json({ success: false, message: 'Appointment not found or cancelled' });

    const currency = (process.env.CURRENCY || 'INR').toLowerCase();

    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name: `Salon Appointment — ${appt.slotDate} at ${appt.slotTime}` },
            unit_amount: Math.round(appt.amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/verify?success=true&appointmentId=${appt._id}`,
      cancel_url: `${origin}/verify?success=false&appointmentId=${appt._id}`,
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.log('Stripe error:', error.message);
    res.json({ success: false, message: error.message });
  }
};

const verifyStripe = async (req, res) => {
  try {
    const { appointmentId, success } = req.body;
    if (success === 'true' || success === true) {
      await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true });
      return res.json({ success: true, message: 'Payment confirmed' });
    }
    res.json({ success: false, message: 'Payment cancelled' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// RAZORPAY PAYMENT (test mode)
// ─────────────────────────────────────────────────────────────────────────────

const paymentRazorpay = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appt = await appointmentModel.findById(appointmentId);
    if (!appt || appt.cancelled)
      return res.json({ success: false, message: 'Appointment not found or cancelled' });

    res.json({
      success: true,
      order: {
        id: `order_test_${Date.now()}`,
        amount: Math.round(appt.amount * 100),
        currency: process.env.CURRENCY || 'INR',
        receipt: appointmentId,
      },
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const verifyRazorpay = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    if (appointmentId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true });
    }
    res.json({ success: true, message: 'Payment verified' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// USER NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const getNotifications = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await userModel.findById(userId).select('notifications');
    if (!user) return res.json({ success: false, message: 'User not found' });

    const notifications = [...(user.notifications || [])].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    const unreadCount = notifications.filter((n) => !n.read).length;

    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error('getNotifications error:', error);
    res.json({ success: false, message: error.message });
  }
};

export const markNotificationsRead = async (req, res) => {
  try {
    const { userId, notificationId } = req.body;
    const user = await userModel.findById(userId);
    if (!user) return res.json({ success: false, message: 'User not found' });

    if (notificationId) {
      const n = user.notifications.id(notificationId);
      if (n) {
        n.read = true;
        await user.save();
      }
    } else {
      user.notifications.forEach((n) => {
        n.read = true;
      });
      await user.save();
    }

    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    console.error('markNotificationsRead error:', error);
    res.json({ success: false, message: error.message });
  }
};
// ─────────────────────────────────────────────────────────────────────────────
// RESCHEDULE APPOINTMENT  –  POST /api/user/reschedule-appointment
// ✅ Sends reschedule confirmation to: User + Admin
// ─────────────────────────────────────────────────────────────────────────────

export const rescheduleAppointment = async (req, res) => {
  try {
    const { userId, appointmentId, slotDate, slotTime, oldSlotDate, oldSlotTime } = req.body;

    if (!appointmentId || !slotDate || !slotTime)
      return res.json({ success: false, message: 'Missing required fields' });

    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment)
      return res.json({ success: false, message: 'Appointment not found' });

    if (appointment.userId.toString() !== userId.toString())
      return res.json({ success: false, message: 'Unauthorized action' });

    if (appointment.isCompleted)
      return res.json({ success: false, message: 'Cannot reschedule a completed appointment' });

    // ── 3-hour rule (only for non-cancelled appointments) ──────────────────
    if (!appointment.cancelled && appointment.slotDateTime) {
      const hoursDiff = (new Date(appointment.slotDateTime) - new Date()) / 3600000;
      if (hoursDiff < 3)
        return res.json({
          success: false,
          message: 'Appointments can only be rescheduled at least 3 hours before the scheduled time',
        });
    }

    // ── Check new slot is free ─────────────────────────────────────────────
    const doctorId = appointment.doctorId || appointment.docId;
    const slotFree = await isSlotAvailable(doctorId, slotDate, slotTime);
    if (!slotFree)
      return res.json({
        success: false,
        message: 'This slot was just taken. Please select another time.',
      });

    // ── Release OLD slot from doctor's map ────────────────────────────────
    const doctor = await doctorModel.findById(doctorId);
    if (doctor) {
      const slots_booked =
        doctor.slots_booked instanceof Map
          ? doctor.slots_booked
          : new Map(Object.entries(doctor.slots_booked || {}));

      const oldDate = oldSlotDate || appointment.slotDate;
      let oldTime = oldSlotTime || appointment.slotTime || '';

      // Normalise to HH:MM (24hr) in case it was stored as 12hr
      const m12 = oldTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (m12) {
        let h = parseInt(m12[1]);
        if (m12[3].toUpperCase() === 'PM' && h !== 12) h += 12;
        if (m12[3].toUpperCase() === 'AM' && h === 12) h = 0;
        oldTime = `${String(h).padStart(2, '0')}:${m12[2]}`;
      }

      const existing = slots_booked.get(oldDate) || [];
      slots_booked.set(oldDate, existing.filter((x) => x !== oldTime));

      // ── Book NEW slot ────────────────────────────────────────────────────
      const newSlots = slots_booked.get(slotDate) || [];
      newSlots.push(slotTime);
      slots_booked.set(slotDate, newSlots);

      await doctorModel.findByIdAndUpdate(doctorId, { slots_booked }, { runValidators: false });
    }

    // ── Build new slotDateTime ────────────────────────────────────────────
    const [sYear, sMonth, sDay] = slotDate.split('-').map(Number);
    const [sHour, sMinute] = slotTime.split(':').map(Number);
    const slotDateTime = new Date(sYear, sMonth - 1, sDay, sHour, sMinute, 0, 0);

    // ── Update appointment record ─────────────────────────────────────────
    appointment.slotDate = slotDate;
    appointment.slotTime = slotTime;
    appointment.slotDateTime = slotDateTime;
    appointment.cancelled = false;
    appointment.cancelledBy = null;
    appointment.cancellationReason = null;
    await appointment.save();

    // ── Notifications ─────────────────────────────────────────────────────
    const { dateStr, timeStr } = formatDisplayDate(slotDate, slotTime);
    const stylistName = appointment.docData?.name || 'your stylist';
    const userName = appointment.userData?.name || 'A customer';

    // Notify USER
    await userModel.findByIdAndUpdate(userId, {
      $push: {
        notifications: {
          title: '🔄 Appointment Rescheduled',
          message: `Your appointment with ${stylistName} has been rescheduled to ${dateStr} at ${timeStr}.`,
          type: 'info',
          read: false,
          link: '/my-appointments',
          createdAt: new Date(),
        },
      },
    });

    // Notify ADMIN
    await AdminNotification.create({
      title: '🔄 Appointment Rescheduled',
      message: `${userName} rescheduled their appointment with ${stylistName} to ${dateStr} at ${timeStr}.`,
      type: 'booking_confirmed',
      appointmentId: appointment._id,
      meta: { userName, stylistName, slotDate, slotTime },
    });

    res.json({ success: true, message: 'Appointment rescheduled successfully!' });
  } catch (error) {
    console.error('❌ rescheduleAppointment error:', error);
    res.json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────
export {
  loginUser,
  registerUser,
  getProfile,
  updateProfile,
  listAppointment,
  paymentRazorpay,
  verifyRazorpay,
  paymentStripe,
  verifyStripe,
};
