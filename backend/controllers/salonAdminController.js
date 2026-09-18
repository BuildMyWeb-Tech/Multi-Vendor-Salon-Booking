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
import BlockedDate from '../models/BlockedDate.js';
import RecurringHoliday from '../models/RecurringHoliday.js';
import SpecialWorkingDay from '../models/SpecialWorkingDay.js';
import AdminNotification from '../models/AdminNotification.js';
import ServiceCategory from '../models/ServiceCategory.js';
import validator from 'validator';

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

    const todayAppointments = await appointmentModel.countDocuments({ shopId, slotDate: todayStr, cancelled: false });
    const pendingAppointments = await appointmentModel.countDocuments({ shopId, cancelled: false, isCompleted: false });
    const completedAppointments = await appointmentModel.countDocuments({ shopId, isCompleted: true });
    const cancelledAppointments = await appointmentModel.countDocuments({ shopId, cancelled: true });

    const revenueAgg = await appointmentModel.aggregate([
      { $match: { shopId, isCompleted: true, payment: true } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    const todayRevAgg = await appointmentModel.aggregate([
      { $match: { shopId, slotDate: todayStr, isCompleted: true, payment: true } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
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
      .sort({ createdAt: -1 });

    const processed = appointments.map((app) => {
      const obj = app.toObject();
      if (!obj.userData && obj.userId) {
        obj.userData = { _id: obj.userId._id, name: obj.userId.name, phone: obj.userId.phone, email: obj.userId.email, image: obj.userId.image };
      }
      if (!obj.docData && obj.doctorId) {
        obj.docData = { _id: obj.doctorId._id, name: obj.doctorId.name, image: obj.doctorId.image, speciality: obj.doctorId.specialty?.[0], price: obj.doctorId.price };
      }
      return obj;
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

      await userModel.findByIdAndUpdate(appointment.userId, {
        $push: {
          notifications: {
            title: '❌ Appointment Cancelled by Salon',
            message: `Your appointment with ${stylistName} on ${dateStr} at ${timeStr} has been cancelled by the salon. Please contact us for details.`,
            type: 'cancellation',
            read: false,
            link: apptLink,
            createdAt: new Date(),
          },
        },
      });
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

    const exists = await doctorModel.findOne({ email });
    if (exists) return res.json({ success: false, message: 'Email already registered.' });

    let imageUrl = '';
    if (req.file) {
      const b64 = req.file.buffer.toString('base64');
      const dataUri = `data:${req.file.mimetype};base64,${b64}`;
      const result = await cloudinary.uploader.upload(dataUri, { resource_type: 'image', folder: 'salon' });
      imageUrl = result.secure_url;
    }
    if (!imageUrl) return res.json({ success: false, message: 'Stylist image is required.' });

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
    if (specialty) doctor.specialty = Array.isArray(specialty) ? specialty : [specialty];
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
        const leaveShopDoc = await shopModel.findOne({ shopId }).lean();
        const leaveShopSlug = leaveShopDoc?.slug || '';
        const leaveApptLink = leaveShopSlug ? `/${leaveShopSlug}/my-appointments` : '/my-appointments';

        await userModel.findByIdAndUpdate(appt.userId, {
          $push: {
            notifications: {
              title: '🗓️ Appointment Cancelled – Stylist on Leave',
              message: `Your appointment with ${doctor.name} on ${dateStr} at ${timeStr} has been cancelled because the stylist is on leave. We apologise for the inconvenience. Please rebook at your convenience.`,
              type: 'cancellation',
              read: false,
              link: leaveApptLink,
              createdAt: new Date(),
            },
          },
        });
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
    let settings = await SlotSettings.findOne({ shopId });
    if (!settings) {
      settings = await SlotSettings.create({ shopId });
    }
    res.json({ success: true, settings });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const updateSalonSlotSettings = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const settings = await SlotSettings.findOneAndUpdate(
      { shopId },
      { ...req.body, shopId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
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
    const { name, day, month } = req.body;
    const holiday = await RecurringHoliday.create({ shopId, name, day, month });
    res.json({ success: true, holiday });
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

    if (!name || !description || basePrice === undefined) {
      return res.json({ success: false, message: 'Name, description, and price are required.' });
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
    if (description) service.description = description;
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
