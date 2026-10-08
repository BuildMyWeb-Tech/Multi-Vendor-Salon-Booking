// backend/controllers/salonAdminController.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v2 as cloudinary } from 'cloudinary';
import salonAdminModel from '../models/salonAdminModel.js';
import shopModel from '../models/shopModel.js';
import appointmentModel from '../models/appointmentModel.js';
import doctorModel from '../models/doctorModel.js';
import userModel from '../models/userModel.js';
import SlotSettings from '../models/SlotSettings.js';
import { emitToUser } from '../config/socket.js';
import BlockedDate from '../models/BlockedDate.js';
import RecurringHoliday from '../models/RecurringHoliday.js';
import SpecialWorkingDay from '../models/SpecialWorkingDay.js';
import AdminNotification from '../models/AdminNotification.js';
import taxModel from '../models/taxModel.js';
import ServiceCategory from '../models/ServiceCategory.js';
import validator from 'validator';
import { generateAvailableSlots } from '../utils/slotUtils.js';

// ── Helper ────────────────────────────────────────────────────────────────────
const formatDisplayDate = (slotDate, slotTime) => {
  const [y, m, d] = slotDate.split('-').map(Number);
  const dateStr = new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const [h, min] = slotTime.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  const timeStr = `${hour12}:${String(min).padStart(2, '0')} ${period}`;
  return { dateStr, timeStr };
};

// ── POST /api/salon-admin/login ───────────────────────────────────────────────
export const loginSalonAdmin = async (req, res) => {
  try {
    const { adminId, password } = req.body;

    if (!adminId || !password) {
      return res.json({ success: false, message: 'Admin ID and password are required.' });
    }

    const admin = await salonAdminModel.findOne({ adminId: adminId.toLowerCase() });
    if (!admin) {
      return res.json({ success: false, message: 'Invalid Admin ID or Password.' });
    }

    if (!admin.isActive) {
      return res.json({ success: false, message: 'Your account has been deactivated. Contact Super Admin.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.json({ success: false, message: 'Invalid Admin ID or Password.' });
    }

    // Check shop status
    const shop = await shopModel.findOne({ shopId: admin.shopId });
    if (!shop) {
      return res.json({ success: false, message: 'Associated salon not found.' });
    }
    if (shop.status === 'suspended') {
      return res.json({ success: false, message: 'This salon has been suspended. Please contact support.' });
    }

    const token = jwt.sign(
      { adminId: admin.adminId, shopId: admin.shopId, role: 'salon_admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      shopId: admin.shopId,
      shopName: shop.shopName,
      shopSlug: shop.slug,
      adminName: admin.name,
    });
  } catch (error) {
    console.error('loginSalonAdmin error:', error);
    res.json({ success: false, message: error.message });
  }
};

// ── GET /api/salon-admin/shop-info ────────────────────────────────────────────
export const getShopInfo = async (req, res) => {
  try {
    const shop = await shopModel.findOne({ shopId: req.salonAdmin.shopId }).lean();
    if (!shop) return res.json({ success: false, message: 'Shop not found.' });
    res.json({ success: true, shop });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── PATCH /api/salon-admin/billing-tax ───────────────────────────────────────
export const updateBillingTax = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const { billingTaxPercent, billingTaxName } = req.body;
    if (billingTaxPercent === undefined || isNaN(billingTaxPercent)) {
      return res.json({ success: false, message: 'billingTaxPercent is required.' });
    }
    const val = Math.max(0, Math.min(100, parseFloat(billingTaxPercent)));
    const update = { billingTaxPercent: val };
    if (billingTaxName !== undefined) update.billingTaxName = String(billingTaxName).trim() || 'Tax';
    await shopModel.updateOne({ shopId }, update);
    res.json({ success: true, billingTaxPercent: val, billingTaxName: update.billingTaxName });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── GET /api/salon-admin/dashboard ────────────────────────────────────────────
export const getSalonDashboard = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const [
      totalDoctors,
      totalAppointments,
      totalPatients,
      latestAppointments,
    ] = await Promise.all([
      doctorModel.countDocuments({ shopId }),
      appointmentModel.countDocuments({ shopId }),
      userModel.countDocuments({ shopId }),
      appointmentModel
        .find({ shopId })
        .populate('userId', 'name phone email image')
        .populate('doctorId', 'name image')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const [
      todayAppointments, pendingAppointments, completedAppointments, cancelledAppointments,
      revenueAgg, todayRevAgg,
    ] = await Promise.all([
      appointmentModel.countDocuments({ shopId, slotDate: todayStr, cancelled: false }),
      appointmentModel.countDocuments({ shopId, cancelled: false, isCompleted: false }),
      appointmentModel.countDocuments({ shopId, isCompleted: true }),
      appointmentModel.countDocuments({ shopId, cancelled: true }),
      appointmentModel.aggregate([
        { $match: { shopId, isCompleted: true, payment: true } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      appointmentModel.aggregate([
        { $match: { shopId, slotDate: todayStr, isCompleted: true, payment: true } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;
    const todayRevenue = todayRevAgg[0]?.total || 0;

    const processedAppointments = latestAppointments.map((app) => {
      if (!app.userData && app.userId) {
        app.userData = { _id: app.userId._id, name: app.userId.name, phone: app.userId.phone, email: app.userId.email, image: app.userId.image };
      }
      if (!app.docData && app.doctorId) {
        app.docData = { _id: app.doctorId._id, name: app.doctorId.name, image: app.doctorId.image };
      }
      return app;
    });

    res.json({
      success: true,
      dashData: {
        doctors: totalDoctors,
        appointments: totalAppointments,
        patients: totalPatients,
        latestAppointments: processedAppointments,
        todayAppointments,
        pendingAppointments,
        completedAppointments,
        cancelledAppointments,
        totalRevenue,
        todayRevenue,
      },
    });
  } catch (error) {
    console.error('getSalonDashboard error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/salon-admin/appointments ────────────────────────────────────────
export const getSalonAppointments = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const appointments = await appointmentModel
      .find({ shopId })
      .populate('userId', 'name phone email image')
      .populate('doctorId', 'name image specialty price')
      .sort({ createdAt: -1 })
      .lean();

    const processed = appointments.map((app) => {
      if (!app.userData && app.userId) {
        app.userData = { _id: app.userId._id, name: app.userId.name, phone: app.userId.phone, email: app.userId.email, image: app.userId.image };
      }
      if (!app.docData && app.doctorId) {
        app.docData = { _id: app.doctorId._id, name: app.doctorId.name, image: app.doctorId.image, speciality: app.doctorId.specialty?.[0], price: app.doctorId.price };
      }
      return app;
    });

    res.json({ success: true, appointments: processed });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/salon-admin/cancel-appointment ─────────────────────────────────
export const cancelSalonAppointment = async (req, res) => {
  try {
    const { appointmentId, cancellationReason } = req.body;
    const { shopId } = req.salonAdmin;

    const appointment = await appointmentModel.findOne({ _id: appointmentId, shopId });
    if (!appointment) {
      return res.status(403).json({ success: false, message: 'Appointment not found or access denied.' });
    }

    appointment.cancelled = true;
    appointment.cancelledBy = 'admin';
    appointment.cancellationReason = cancellationReason || 'Cancelled by salon admin';
    await appointment.save();

    // Notify customer
    const { dateStr, timeStr } = formatDisplayDate(appointment.slotDate, appointment.slotTime);
    const stylistName = appointment.docData?.name || 'your stylist';
    if (appointment.userId) {
      // Resolve shopSlug for deep-link
      const shopDoc = await shopModel.findOne({ shopId }).lean();
      const shopSlug = shopDoc?.slug || '';
      const apptLink = shopSlug ? `/${shopSlug}/my-appointments` : '/my-appointments';

      const userNotifAdmin = {
        title: 'Appointment Cancelled by Salon',
        message: `Your appointment with ${stylistName} on ${dateStr} at ${timeStr} has been cancelled by the salon. ${appointment.cancellationReason ? 'Reason: ' + appointment.cancellationReason + '.' : 'Please contact us for details.'}`,
        type: 'cancellation',
        read: false,
        link: apptLink,
        createdAt: new Date(),
        shopId: shopId || null,
      };
      await userModel.findByIdAndUpdate(appointment.userId, { $push: { notifications: userNotifAdmin } });
      emitToUser(appointment.userId.toString(), userNotifAdmin);
    }

    res.json({ success: true, message: 'Appointment cancelled.' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── POST /api/salon-admin/mark-appointment-completed ─────────────────────────
export const markSalonAppointmentCompleted = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const { shopId } = req.salonAdmin;

    const appointment = await appointmentModel.findOne({ _id: appointmentId, shopId });
    if (!appointment) {
      return res.status(403).json({ success: false, message: 'Appointment not found or access denied.' });
    }

    appointment.isCompleted = true;
    await appointment.save();

    res.json({ success: true, message: 'Appointment marked as completed.' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── POST /api/salon-admin/mark-appointment-incomplete ─────────────────────────
export const markSalonAppointmentIncomplete = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const { shopId } = req.salonAdmin;

    const appointment = await appointmentModel.findOne({ _id: appointmentId, shopId });
    if (!appointment) {
      return res.status(403).json({ success: false, message: 'Appointment not found or access denied.' });
    }

    appointment.isCompleted = false;
    await appointment.save();

    res.json({ success: true, message: 'Appointment marked as incomplete.' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── GET /api/salon-admin/all-doctors ─────────────────────────────────────────
export const getSalonDoctors = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const doctors = await doctorModel.find({ shopId }).select('-password');
    res.json({ success: true, doctors });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── POST /api/salon-admin/add-doctor ─────────────────────────────────────────
export const addSalonDoctor = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const {
      name, email, password, specialty, certification, experience, about, price, phone, instagram, workingHours,
    } = req.body;

    if (!name || !email || !password) {
      return res.json({ success: false, message: 'Name, email and password are required.' });
    }
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: 'Invalid email.' });
    }
    if (password.length < 6) {
      return res.json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const emailExists = await doctorModel.findOne({ email: email.toLowerCase().trim(), shopId });
    if (emailExists) return res.json({ success: false, message: 'A stylist with this email already exists in this salon.' });

    const nameExists = await doctorModel.findOne({ name: name.trim(), shopId });
    if (nameExists) return res.json({ success: false, message: 'A stylist with this name already exists in this salon.' });

    let imageUrl = '';
    if (req.file) {
      const b64 = req.file.buffer.toString('base64');
      const dataUri = `data:${req.file.mimetype};base64,${b64}`;
      const result = await cloudinary.uploader.upload(dataUri, { resource_type: 'image', folder: 'salon' });
      imageUrl = result.secure_url;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let specialtyArr = [];
    try {
      specialtyArr = Array.isArray(specialty) ? specialty : typeof specialty === 'string' ? JSON.parse(specialty) : [];
    } catch { specialtyArr = specialty ? [specialty] : []; }

    const doctor = await doctorModel.create({
      name, email, password: hashedPassword,
      image: imageUrl,
      specialty: specialtyArr,
      certification: certification || 'Not specified',
      experience: experience || '0 years',
      about: about || '',
      price: parseFloat(price) || 0,
      phone: phone || '',
      instagram: instagram || '',
      workingHours: workingHours || '10AM-7PM',
      date: Date.now(),
      shopId,
    });

    res.json({ success: true, message: 'Stylist added successfully.', doctor });
  } catch (error) {
    console.error('addSalonDoctor error:', error);
    res.json({ success: false, message: error.message });
  }
};

// ── GET /api/salon-admin/doctor/:id ──────────────────────────────────────────
export const getSalonDoctorById = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const doctor = await doctorModel.findOne({ _id: req.params.id, shopId }).select('-password');
    if (!doctor) return res.status(403).json({ success: false, message: 'Stylist not found or access denied.' });
    res.json({ success: true, stylist: doctor });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── PUT /api/salon-admin/doctor/:id ──────────────────────────────────────────
export const updateSalonDoctor = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const doctor = await doctorModel.findOne({ _id: req.params.id, shopId });
    if (!doctor) return res.status(403).json({ success: false, message: 'Stylist not found or access denied.' });

    const { name, specialty, certification, experience, about, price, phone, instagram, workingHours, available } = req.body;

    if (name) doctor.name = name;
    if (specialty) {
      try {
        doctor.specialty = Array.isArray(specialty)
          ? specialty
          : typeof specialty === 'string'
            ? JSON.parse(specialty)
            : [specialty];
      } catch {
        doctor.specialty = [specialty];
      }
    }
    if (certification) doctor.certification = certification;
    if (experience) doctor.experience = experience;
    if (about) doctor.about = about;
    if (price !== undefined) doctor.price = parseFloat(price);
    if (phone !== undefined) doctor.phone = phone;
    if (instagram !== undefined) doctor.instagram = instagram;
    if (workingHours) doctor.workingHours = workingHours;
    if (available !== undefined) doctor.available = available === 'true' || available === true;

    if (req.file) {
      const b64 = req.file.buffer.toString('base64');
      const dataUri = `data:${req.file.mimetype};base64,${b64}`;
      const result = await cloudinary.uploader.upload(dataUri, { resource_type: 'image', folder: 'salon' });
      doctor.image = result.secure_url;
    }

    await doctor.save();
    res.json({ success: true, message: 'Stylist updated.', stylist: doctor });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── DELETE /api/salon-admin/doctor/:id ───────────────────────────────────────
export const deleteSalonDoctor = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const doctor = await doctorModel.findOneAndDelete({ _id: req.params.id, shopId });
    if (!doctor) return res.status(403).json({ success: false, message: 'Stylist not found or access denied.' });
    res.json({ success: true, message: 'Stylist deleted.' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── POST /api/salon-admin/change-availability ────────────────────────────────
export const changeSalonDoctorAvailability = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const { docId } = req.body;
    const doctor = await doctorModel.findOne({ _id: docId, shopId });
    if (!doctor) return res.status(403).json({ success: false, message: 'Access denied.' });
    doctor.available = !doctor.available;
    await doctor.save();
    res.json({ success: true, message: 'Availability updated.' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── GET/PUT /api/salon-admin/doctor/:id/leave-dates ──────────────────────────
export const getSalonStylistLeaveDates = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const doctor = await doctorModel.findOne({ _id: req.params.id, shopId });
    if (!doctor) return res.status(403).json({ success: false, message: 'Access denied.' });
    res.json({ success: true, leaveDates: doctor.leaveDates || [] });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const updateSalonStylistLeaveDates = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const { leaveDates } = req.body;
    const doctor = await doctorModel.findOne({ _id: req.params.id, shopId });
    if (!doctor) return res.status(403).json({ success: false, message: 'Access denied.' });

    // Find appointments on the new leave dates that are not yet cancelled/completed
    const newLeaveDates = leaveDates || [];
    const affectedAppointments = await appointmentModel.find({
      doctorId: doctor._id,
      shopId,
      slotDate: { $in: newLeaveDates },
      cancelled: false,
      isCompleted: false,
    });

    // Hoist shop slug lookup before the loop to avoid N+1 DB queries
    const leaveShopDoc = await shopModel.findOne({ shopId }, 'slug').lean();
    const leaveShopSlug = leaveShopDoc?.slug || '';

    // Cancel each affected appointment and remove from slots_booked
    let cancelledCount = 0;
    for (const appt of affectedAppointments) {
      appt.cancelled = true;
      appt.cancelledBy = 'system';
      appt.cancellationReason = `${doctor.name} is on leave on this date.`;
      await appt.save();

      // Notify the customer
      if (appt.userId) {
        const { dateStr, timeStr } = formatDisplayDate(appt.slotDate, appt.slotTime);
        const leaveApptLink = leaveShopSlug ? `/${leaveShopSlug}/my-appointments` : '/my-appointments';

        const leaveUserNotif = {
          title: 'Appointment Cancelled – Stylist on Leave',
          message: `Your appointment with ${doctor.name} on ${dateStr} at ${timeStr} has been cancelled because the stylist is on leave. We apologise for the inconvenience. Please rebook at your convenience.`,
          type: 'cancellation',
          read: false,
          link: leaveApptLink,
          createdAt: new Date(),
          shopId: shopId || null,
        };
        await userModel.findByIdAndUpdate(appt.userId, { $push: { notifications: leaveUserNotif } });
        emitToUser(appt.userId.toString(), leaveUserNotif);
      }

      // Remove slot from doctor's slots_booked map
      if (doctor.slots_booked && doctor.slots_booked.get) {
        const dateSlots = doctor.slots_booked.get(appt.slotDate) || [];
        // Convert display time back to HH:mm for removal
        const to24hr = (t) => {
          if (/^\d{2}:\d{2}$/.test(t)) return t;
          const [time, period] = t.split(' ');
          let [h, m] = time.split(':').map(Number);
          if (period === 'PM' && h !== 12) h += 12;
          if (period === 'AM' && h === 12) h = 0;
          return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        };
        const slotTime24 = to24hr(appt.slotTime);
        const updated = dateSlots.filter(s => s !== slotTime24);
        doctor.slots_booked.set(appt.slotDate, updated);
      }
      cancelledCount++;
    }

    doctor.leaveDates = newLeaveDates;
    await doctor.save();

    res.json({
      success: true,
      message: `Leave dates updated.${cancelledCount > 0 ? ` ${cancelledCount} appointment(s) auto-cancelled.` : ''}`,
      leaveDates: doctor.leaveDates,
      cancelledCount,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── SLOT SETTINGS ─────────────────────────────────────────────────────────────
export const getSalonSlotSettings = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    let [settings, blockedDates, recurringHolidays, specialWorkingDays] = await Promise.all([
      SlotSettings.findOne({ shopId }),
      BlockedDate.find({ shopId }).sort({ date: 1 }),
      RecurringHoliday.find({ shopId }),
      SpecialWorkingDay.find({ shopId }).sort({ date: 1 }),
    ]);
    if (!settings) settings = await SlotSettings.create({ shopId });
    res.json({ success: true, settings, blockedDates, recurringHolidays, specialWorkingDays });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const updateSalonSlotSettings = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    // Only pick known SlotSettings fields — ignore blockedDates / recurringHolidays arrays sent by frontend
    const {
      slotStartTime, slotEndTime, slotDuration,
      breakTime, breakStartTime, breakEndTime, daysOpen,
      allowRescheduling, rescheduleHoursBefore,
      maxAdvanceBookingDays, minBookingTimeBeforeSlot,
      advancePaymentRequired, advancePaymentPercentage,
    } = req.body;
    const update = {};
    if (slotStartTime !== undefined)         update.slotStartTime = slotStartTime;
    if (slotEndTime !== undefined)           update.slotEndTime = slotEndTime;
    if (slotDuration !== undefined)          update.slotDuration = Number(slotDuration);
    if (breakTime !== undefined)             update.breakTime = breakTime;
    if (breakStartTime !== undefined)        update.breakStartTime = breakStartTime;
    if (breakEndTime !== undefined)          update.breakEndTime = breakEndTime;
    if (Array.isArray(daysOpen))             update.daysOpen = daysOpen;
    if (allowRescheduling !== undefined)     update.allowRescheduling = allowRescheduling;
    if (rescheduleHoursBefore !== undefined) update.rescheduleHoursBefore = Number(rescheduleHoursBefore);
    if (maxAdvanceBookingDays !== undefined) update.maxAdvanceBookingDays = Number(maxAdvanceBookingDays);
    if (minBookingTimeBeforeSlot !== undefined) update.minBookingTimeBeforeSlot = Number(minBookingTimeBeforeSlot);
    if (advancePaymentRequired !== undefined)   update.advancePaymentRequired = advancePaymentRequired;
    if (advancePaymentPercentage !== undefined) update.advancePaymentPercentage = Number(advancePaymentPercentage);
    const settings = await SlotSettings.findOneAndUpdate(
      { shopId },
      { $set: update },
      { upsert: true, new: true, runValidators: false }
    );
    res.json({ success: true, message: 'Slot settings saved.', settings });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── BLOCKED DATES ─────────────────────────────────────────────────────────────
export const addSalonBlockedDate = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const { date, reason } = req.body;
    const existing = await BlockedDate.findOne({ shopId, date });
    if (existing) return res.json({ success: false, message: 'Date already blocked.' });
    const blocked = await BlockedDate.create({ shopId, date, reason: reason || '' });
    res.json({ success: true, message: 'Date blocked.', blocked });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const removeSalonBlockedDate = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const blocked = await BlockedDate.findOneAndDelete({ _id: req.params.id, shopId });
    if (!blocked) return res.status(403).json({ success: false, message: 'Not found or access denied.' });
    res.json({ success: true, message: 'Blocked date removed.' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── RECURRING HOLIDAYS ────────────────────────────────────────────────────────
export const addSalonRecurringHoliday = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const { name, type, value } = req.body;
    if (!name || !type || !value) return res.json({ success: false, message: 'name, type and value are required.' });
    const holiday = await RecurringHoliday.create({ shopId, name, type, value });
    res.json({ success: true, recurringHoliday: holiday });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const removeSalonRecurringHoliday = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const holiday = await RecurringHoliday.findOneAndDelete({ _id: req.params.id, shopId });
    if (!holiday) return res.status(403).json({ success: false, message: 'Not found or access denied.' });
    res.json({ success: true, message: 'Holiday removed.' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── SPECIAL WORKING DAYS ──────────────────────────────────────────────────────
export const addSalonSpecialWorkingDay = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const { date, startTime, endTime, reason } = req.body;
    const day = await SpecialWorkingDay.create({ shopId, date, startTime, endTime, reason: reason || '' });
    res.json({ success: true, day });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const removeSalonSpecialWorkingDay = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const day = await SpecialWorkingDay.findOneAndDelete({ _id: req.params.id, shopId });
    if (!day) return res.status(403).json({ success: false, message: 'Not found or access denied.' });
    res.json({ success: true, message: 'Special day removed.' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── SERVICES ──────────────────────────────────────────────────────────────────
export const getSalonServices = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const services = await ServiceCategory.find({ shopId }).sort({ createdAt: -1 });
    res.json({ success: true, services });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const createSalonService = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const { name, description, basePrice } = req.body;

    if (!name || basePrice === undefined) {
      return res.json({ success: false, message: 'Name and price are required.' });
    }

    let imageUrl = '';
    if (req.file) {
      const b64 = req.file.buffer.toString('base64');
      const dataUri = `data:${req.file.mimetype};base64,${b64}`;
      const result = await cloudinary.uploader.upload(dataUri, { resource_type: 'image', folder: 'salon' });
      imageUrl = result.secure_url;
    }

    const service = await ServiceCategory.create({
      name, description,
      basePrice: parseFloat(basePrice),
      imageUrl,
      shopId,
    });
    res.json({ success: true, message: 'Service created.', service });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const updateSalonService = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const service = await ServiceCategory.findOne({ _id: req.params.id, shopId });
    if (!service) return res.status(403).json({ success: false, message: 'Access denied.' });

    const { name, description, basePrice, isActive } = req.body;
    if (name) service.name = name;
    if (description !== undefined) service.description = description;
    if (basePrice !== undefined) service.basePrice = parseFloat(basePrice);
    if (isActive !== undefined) service.isActive = isActive === 'true' || isActive === true;

    if (req.file) {
      const b64 = req.file.buffer.toString('base64');
      const dataUri = `data:${req.file.mimetype};base64,${b64}`;
      const result = await cloudinary.uploader.upload(dataUri, { resource_type: 'image', folder: 'salon' });
      service.imageUrl = result.secure_url;
    }

    await service.save();
    res.json({ success: true, message: 'Service updated.', service });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const deleteSalonService = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const service = await ServiceCategory.findOneAndDelete({ _id: req.params.id, shopId });
    if (!service) return res.status(403).json({ success: false, message: 'Access denied.' });
    res.json({ success: true, message: 'Service deleted.' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
export const getSalonAdminNotifications = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const notifications = await AdminNotification.find({ shopId })
      .sort({ createdAt: -1 })
      .limit(100);
    const unreadCount = notifications.filter((n) => !n.read).length;
    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const markSalonAdminNotificationsRead = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const { notificationId } = req.body;

    if (notificationId) {
      await AdminNotification.findOneAndUpdate({ _id: notificationId, shopId }, { read: true });
    } else {
      await AdminNotification.updateMany({ shopId }, { read: true });
    }

    res.json({ success: true, message: 'Notifications marked as read.' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const createOfflineAppointment = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const { doctorId, services, slotDate, slotTime, customerName, customerPhone, paymentMethod, packages, finalAmount } = req.body;

    if (!doctorId || !slotDate || !slotTime || !customerName) {
      return res.json({ success: false, message: 'Stylist, date, time and customer name are required.' });
    }

    const [year, month, day] = slotDate.split('-').map(Number);
    const [h, m] = slotTime.split(':').map(Number);
    const slotDateTime = new Date(year, month - 1, day, h, m, 0, 0);

    const existing = await appointmentModel.findOne({ doctorId, slotDateTime, cancelled: false });
    if (existing) return res.json({ success: false, message: 'This slot is already booked.' });

    const svcList = Array.isArray(services) ? services : [];
    const pkgList = Array.isArray(packages) ? packages : [];
    // Use the pre-calculated finalAmount from frontend (already applies package discounts)
    const totalAmount = finalAmount != null ? Number(finalAmount) : svcList.reduce((s, sv) => s + (Number(sv.price) || 0), 0);

    const appt = new appointmentModel({
      doctorId,
      slotDate,
      slotTime,
      slotDateTime,
      amount: totalAmount,
      services: svcList,
      packages: pkgList,
      service: pkgList.length > 0
        ? pkgList.map(p => p.name).join(', ')
        : svcList.map(s => s.name).join(', ') || 'Walk-in',
      paymentMethod: paymentMethod === 'upi' ? 'upi' : 'cash',
      shopId,
      isOffline: true,
      userData: { name: customerName, phone: customerPhone || '' },
    });

    await appt.save();
    res.json({ success: true, message: 'Offline appointment created.', appointment: appt });
  } catch (error) {
    if (error.code === 11000) return res.json({ success: false, message: 'Slot already taken.' });
    res.json({ success: false, message: error.message });
  }
};

// ── ADMIN AVAILABLE DATES ─────────────────────────────────────────────────────
export const getAdminAvailableDates = async (req, res) => {
  try {
    const { docId } = req.params;
    const doctor = await doctorModel.findById(docId).select('available leaveDates shopId');
    if (!doctor) return res.json({ success: false, message: 'Stylist not found' });
    if (!doctor.available) return res.json({ success: true, dates: [] });

    const shopId = doctor.shopId || req.salonAdmin.shopId;
    let settings = await SlotSettings.findOne({ shopId });
    if (!settings) settings = await SlotSettings.create({
      shopId, slotStartTime: '09:00', slotEndTime: '18:00', slotDuration: 30,
      breakTime: false, daysOpen: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
      maxAdvanceBookingDays: 30, minBookingTimeBeforeSlot: 0,
    });

    const blockedDates   = await BlockedDate.find({ shopId });
    const recurringHols  = await RecurringHoliday.find({ shopId });
    const specialDays    = await SpecialWorkingDay.find({ shopId });

    const toStr = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const blockedSet = new Set(blockedDates.map(b => toStr(new Date(b.date))));
    const specialSet = new Set(specialDays.map(s => toStr(new Date(s.date))));
    const leaveSet   = new Set(doctor.leaveDates || []);

    const today  = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDays = settings.maxAdvanceBookingDays || 30;
    const result  = [];

    for (let i = 0; i <= maxDays; i++) {
      const d   = new Date(today);
      d.setDate(today.getDate() + i);
      const str = toStr(d);
      const day = d.toLocaleDateString('en-US', { weekday: 'long' });

      if (leaveSet.has(str) || blockedSet.has(str)) continue;
      const isSpecial = specialSet.has(str);
      let isHoliday = recurringHols.some(h =>
        (h.type === 'weekly' && h.value === day) ||
        (h.type === 'monthly' && h.value === String(d.getDate()))
      );
      if (isHoliday && !isSpecial) continue;
      if (!settings.daysOpen.includes(day) && !isSpecial) continue;
      result.push(str);
    }

    res.json({ success: true, dates: result });
  } catch (e) { res.json({ success: false, message: e.message }); }
};

// ── ADMIN AVAILABLE SLOTS ─────────────────────────────────────────────────────
export const getAdminAvailableSlots = async (req, res) => {
  try {
    const { date, docId } = req.query;
    if (!date || !docId) return res.json({ success: false, message: 'date and docId required' });

    const doctor = await doctorModel.findById(docId).select('available leaveDates shopId');
    if (!doctor) return res.json({ success: false, message: 'Stylist not found' });
    if (!doctor.available) return res.json({ success: true, slots: [] });
    if ((doctor.leaveDates || []).includes(date)) return res.json({ success: true, slots: [] });

    const shopId = doctor.shopId || req.salonAdmin.shopId;
    let settings = await SlotSettings.findOne({ shopId });
    if (!settings) settings = await SlotSettings.create({
      shopId, slotStartTime: '09:00', slotEndTime: '18:00', slotDuration: 30,
      breakTime: false, daysOpen: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
      maxAdvanceBookingDays: 30, minBookingTimeBeforeSlot: 0,
    });

    const { slots: allSlots } = await generateAvailableSlots(date, settings, docId);
    const booked = await appointmentModel.find({
      $or: [{ doctorId: docId, slotDate: date, cancelled: false }, { docId, slotDate: date, cancelled: false }],
    }).select('slotTime').lean();
    const bookedTimes = new Set(booked.map(a => a.slotTime));
    const free = allSlots.filter(s => !bookedTimes.has(s.startTime));
    res.json({ success: true, slots: free });
  } catch (e) { res.json({ success: false, message: e.message }); }
};

// ── TAX CRUD ──────────────────────────────────────────────────────────────────

export const getTaxes = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const taxes = await taxModel.find({ shopId }).sort({ createdAt: 1 }).lean();
    res.json({ success: true, taxes });
  } catch (e) { res.json({ success: false, message: e.message }); }
};

export const createTax = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const { name, percent } = req.body;
    if (!name || percent == null) return res.json({ success: false, message: 'name and percent required.' });
    const tax = await taxModel.create({ shopId, name: name.trim(), percent: parseFloat(percent) });
    res.json({ success: true, tax });
  } catch (e) { res.json({ success: false, message: e.message }); }
};

export const updateTax = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const { name, percent, isActive } = req.body;
    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (percent !== undefined) update.percent = parseFloat(percent);
    if (isActive !== undefined) update.isActive = isActive;
    const tax = await taxModel.findOneAndUpdate({ _id: req.params.id, shopId }, update, { new: true });
    if (!tax) return res.json({ success: false, message: 'Tax not found.' });
    res.json({ success: true, tax });
  } catch (e) { res.json({ success: false, message: e.message }); }
};

export const deleteTax = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    await taxModel.findOneAndDelete({ _id: req.params.id, shopId });
    res.json({ success: true });
  } catch (e) { res.json({ success: false, message: e.message }); }
};

