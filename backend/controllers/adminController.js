// C:\Users\Siddharathan\Desktop\salon-booking-full-stack\backend\controllers\adminController.js
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import appointmentModel from '../models/appointmentModel.js';
import doctorModel from '../models/doctorModel.js';
import bcrypt from 'bcrypt';
import validator from 'validator';
import userModel from '../models/userModel.js';
import SlotSettings from '../models/SlotSettings.js';
import BlockedDate from '../models/BlockedDate.js';
import RecurringHoliday from '../models/RecurringHoliday.js';
import SpecialWorkingDay from '../models/SpecialWorkingDay.js';
import AdminNotification from '../models/AdminNotification.js';

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

// API for admin login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      
      // ✅ FIXED: sign an object {email}, with expiry
      const token = jwt.sign(
        { email: email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({ success: true, token });

    } else {
      res.json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
// API to get all appointments list
const appointmentsAdmin = async (req, res) => {
  try {
    const appointments = await appointmentModel
      .find({})
      .populate('userId', 'name phone email image')
      .populate('doctorId', 'name image speciality price')
      .sort({ createdAt: -1 });

    const processedAppointments = appointments.map((app) => {
      const appObj = app.toObject();
      if (!appObj.userData && appObj.userId) {
        appObj.userData = {
          _id: appObj.userId._id,
          name: appObj.userId.name,
          phone: appObj.userId.phone,
          email: appObj.userId.email,
          image: appObj.userId.image,
        };
      }
      if (!appObj.docData && appObj.doctorId) {
        appObj.docData = {
          _id: appObj.doctorId._id,
          name: appObj.doctorId.name,
          image: appObj.doctorId.image,
          speciality: appObj.doctorId.speciality,
          price: appObj.doctorId.price,
        };
      }
      return appObj;
    });

    res.json({ success: true, appointments: processedAppointments });
  } catch (error) {
    console.error('Admin appointments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch appointments' });
  }
};

// API for adding Stylist
const addDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      specialty,
      experience,
      about,
      price,
      certification,
      instagram,
      workingHours,
      phone,
    } = req.body;
    const imageFile = req.file;

    if (!name || !email || !password || !specialty || !experience || !about || !price || !certification)
      return res.json({ success: false, message: 'Missing Details' });
    if (!validator.isEmail(email))
      return res.json({ success: false, message: 'Please enter a valid email' });
    if (password.length < 8)
      return res.json({ success: false, message: 'Please enter a strong password' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ✅ Upload image to Cloudinary
    let imageUrl = '';
    if (imageFile) {
      const imageBuffer = imageFile.buffer.toString('base64');
      const uploadResult = await cloudinary.uploader.upload(
        `data:${imageFile.mimetype};base64,${imageBuffer}`,
        { folder: 'salon' }
      );
      imageUrl = uploadResult.secure_url;
    }

    let specialtyArray;
    try {
      specialtyArray = typeof specialty === 'string' ? JSON.parse(specialty) : specialty;
    } catch {
      specialtyArray = [specialty];
    }

    const newStylist = new doctorModel({
      name,
      email,
      phone,
      image: imageUrl,
      password: hashedPassword,
      specialty: specialtyArray,
      certification,
      experience,
      about,
      price: Number(price),
      instagram: instagram || '',
      workingHours: workingHours || '10AM-7PM',
      leaveDates: [],
      date: Date.now(),
    });

    await newStylist.save();
    res.json({ success: true, message: 'Stylist Added Successfully' });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get all doctors list for admin panel
const allDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select('-password');
    res.json({ success: true, doctors });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to delete a stylist
export const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'Stylist ID is required' });

    const stylist = await doctorModel.findById(id);
    if (!stylist) return res.status(404).json({ success: false, message: 'Stylist not found' });

    const hasAppointments = await appointmentModel.findOne({ doctorId: id });
    if (hasAppointments) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete stylist with existing appointments. Cancel all appointments first.',
      });
    }

    await doctorModel.findByIdAndDelete(id);

    return res.status(200).json({ success: true, message: 'Stylist deleted successfully' });
  } catch (error) {
    console.error('Delete stylist error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while deleting the stylist',
    });
  }
};

// API to update a stylist
export const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      email,
      phone,
      specialty,
      experience,
      about,
      price,
      certification,
      instagram,
      workingHours,
      password
    } = req.body;

    const imageFile = req.file;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Stylist ID is required' });
    }

    const stylist = await doctorModel.findById(id);
    if (!stylist) {
      return res.status(404).json({ success: false, message: 'Stylist not found' });
    }

    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (experience) updateData.experience = experience;
    if (about) updateData.about = about;
    if (price) updateData.price = Number(price);
    if (certification) updateData.certification = certification;
    if (instagram !== undefined) updateData.instagram = instagram;
    if (workingHours) updateData.workingHours = workingHours;

    
    if (req.body.available !== undefined) {
      updateData.available = req.body.available === 'true' || req.body.available === true;
    }

    if (specialty) {
      try {
        updateData.specialty =
          typeof specialty === 'string' ? JSON.parse(specialty) : specialty;
      } catch {
        updateData.specialty = [specialty];
      }
    }

    // ✅ Upload image to Cloudinary
    if (imageFile) {
      const imageBuffer = imageFile.buffer.toString('base64');
      const uploadResult = await cloudinary.uploader.upload(
        `data:${imageFile.mimetype};base64,${imageBuffer}`,
        { folder: 'salon' }
      );
      updateData.image = uploadResult.secure_url;
    }

    if (password && password.trim() !== "") {
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters'
        });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateData.password = hashedPassword;
    }

    const updatedStylist = await doctorModel
      .findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
      })
      .select('-password');

    return res.status(200).json({
      success: true,
      message: 'Stylist updated successfully',
      stylist: updatedStylist,
    });

  } catch (error) {
    console.error('Update stylist error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while updating the stylist',
    });
  }
};

// API to get a single stylist by ID
export const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'Stylist ID is required' });

    const stylist = await doctorModel.findById(id).select('-password');
    if (!stylist) return res.status(404).json({ success: false, message: 'Stylist not found' });

    return res.status(200).json({
      success: true,
      stylist: {
        ...stylist.toObject(),
        phone: stylist.phone || '',
        leaveDates: stylist.leaveDates || [],
      },
    });
  } catch (error) {
    console.error('Get stylist error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while fetching the stylist',
    });
  }
};

// Get leave dates for a specific stylist
export const getStylistLeaveDates = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'Stylist ID is required' });

    const stylist = await doctorModel.findById(id).select('leaveDates name');
    if (!stylist) return res.status(404).json({ success: false, message: 'Stylist not found' });

    return res.status(200).json({
      success: true,
      leaveDates: stylist.leaveDates || [],
      stylistName: stylist.name,
    });
  } catch (error) {
    console.error('Get leave dates error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch leave dates',
    });
  }
};

// UPDATE LEAVE DATES
export const updateStylistLeaveDates = async (req, res) => {
  try {
    const { id } = req.params;
    const { leaveDates } = req.body;

    if (!id) return res.status(400).json({ success: false, message: 'Stylist ID is required' });
    if (!Array.isArray(leaveDates))
      return res.status(400).json({ success: false, message: 'leaveDates must be an array of date strings' });

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const invalidDates = leaveDates.filter((d) => !dateRegex.test(d));
    if (invalidDates.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid date format(s): ${invalidDates.join(', ')}. Use YYYY-MM-DD.`,
      });
    }

    const uniqueSortedDates = [...new Set(leaveDates)].sort();

    const stylist = await doctorModel.findById(id);
    if (!stylist) return res.status(404).json({ success: false, message: 'Stylist not found' });

    const previousLeaveDates = new Set(stylist.leaveDates || []);
    const newLeaveDates = uniqueSortedDates.filter((d) => !previousLeaveDates.has(d));

    const updatedStylist = await doctorModel
      .findByIdAndUpdate(id, { leaveDates: uniqueSortedDates }, { new: true, runValidators: true })
      .select('name leaveDates');

    let cancelledCount = 0;

    if (newLeaveDates.length > 0) {
      const affectedAppointments = await appointmentModel.find({
        doctorId: id,
        slotDate: { $in: newLeaveDates },
        cancelled: false,
        isCompleted: false,
      });

      for (const appointment of affectedAppointments) {
        const [y, m, d] = appointment.slotDate.split('-').map(Number);
        const formattedDate = new Date(y, m - 1, d).toLocaleDateString('en-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

        const cancellationReason =
          `Your appointment with ${stylist.name} on ${formattedDate} at ${appointment.slotTime} ` +
          `has been cancelled because the stylist is on leave on that day. ` +
          `We apologise for the inconvenience. Please rebook at your convenience.`;

        appointment.cancelled = true;
        appointment.cancelledBy = 'system';
        appointment.cancellationReason = cancellationReason;
        await appointment.save();
        cancelledCount++;

        await userModel.findByIdAndUpdate(appointment.userId, {
          $push: {
            notifications: {
              title: '📅 Appointment Cancelled',
              message: cancellationReason,
              type: 'cancellation',
              read: false,
              link: '/my-appointments',
              createdAt: new Date(),
            },
          },
        });

        await AdminNotification.create({
          title: '🏖️ Booking Auto-Cancelled (Stylist Leave)',
          message: `${appointment.userData?.name || 'A user'}'s appointment with ${stylist.name} on ${formattedDate} at ${appointment.slotTime} was auto-cancelled due to leave.`,
          type: 'booking_cancelled',
          appointmentId: appointment._id,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message:
        cancelledCount > 0
          ? `Leave dates saved. ${cancelledCount} existing booking(s) have been automatically cancelled and users notified.`
          : 'Leave dates updated successfully.',
      leaveDates: updatedStylist.leaveDates,
      stylistName: updatedStylist.name,
      cancelledCount,
    });
  } catch (error) {
    console.error('Update leave dates error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update leave dates',
    });
  }
};

// API to get dashboard data for admin panel
const adminDashboard = async (req, res) => {
  try {
    const doctors = await doctorModel.find({});
    const users = await userModel.find({});
    const appointments = await appointmentModel.find({});

    res.json({
      success: true,
      dashData: {
        doctors: doctors.length,
        appointments: appointments.length,
        patients: users.length,
        latestAppointments: appointments.reverse(),
      },
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Get Slot Settings
export const getSlotSettings = async (req, res) => {
  try {
    let settings = await SlotSettings.findOne();
    if (!settings) settings = await SlotSettings.create({});

    const blockedDates = await BlockedDate.find().sort({ date: 1 });
    const recurringHolidays = await RecurringHoliday.find().sort({ name: 1 });
    const specialWorkingDays = await SpecialWorkingDay.find().sort({ date: 1 });

    res.json({
      success: true,
      settings: settings.toObject(),
      blockedDates,
      recurringHolidays,
      specialWorkingDays,
    });
  } catch (error) {
    console.error('Error fetching slot settings:', error);
    res.json({ success: false, message: 'Failed to fetch slot settings' });
  }
};

// Update Slot Settings
export const updateSlotSettings = async (req, res) => {
  try {
    const {
      slotStartTime,
      slotEndTime,
      slotDuration,
      breakTime,
      breakStartTime,
      breakEndTime,
      daysOpen,
      openSlotsFromDate,
      openSlotsTillDate,
      allowRescheduling,
      rescheduleHoursBefore,
      maxAdvanceBookingDays,
      minBookingTimeBeforeSlot,
      advancePaymentRequired,
      advancePaymentPercentage,
    } = req.body;

    let settings = await SlotSettings.findOne();
    if (settings) {
      Object.assign(settings, {
        slotStartTime, slotEndTime, slotDuration, breakTime,
        breakStartTime, breakEndTime, daysOpen, openSlotsFromDate,
        openSlotsTillDate, allowRescheduling, rescheduleHoursBefore,
        maxAdvanceBookingDays, minBookingTimeBeforeSlot,
        advancePaymentRequired, advancePaymentPercentage,
      });
      await settings.save();
    } else {
      settings = await SlotSettings.create(req.body);
    }

    res.json({ success: true, message: 'Slot settings updated successfully', settings });
  } catch (error) {
    console.error('Error updating slot settings:', error);
    res.json({ success: false, message: 'Failed to update slot settings' });
  }
};

export const addBlockedDate = async (req, res) => {
  try {
    const { date, reason } = req.body;
    if (!date || !reason) return res.json({ success: false, message: 'Date and reason are required' });
    const blockedDate = await BlockedDate.create({ date, reason });
    res.json({ success: true, message: 'Date blocked successfully', blockedDate });
  } catch (error) {
    console.error('Error adding blocked date:', error);
    res.json({ success: false, message: 'Failed to add blocked date' });
  }
};

export const removeBlockedDate = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await BlockedDate.findByIdAndDelete(id);
    if (!result) return res.json({ success: false, message: 'Blocked date not found' });
    res.json({ success: true, message: 'Blocked date removed successfully' });
  } catch (error) {
    console.error('Error removing blocked date:', error);
    res.json({ success: false, message: 'Failed to remove blocked date' });
  }
};

export const addRecurringHoliday = async (req, res) => {
  try {
    const { name, type, value } = req.body;
    if (!name || !type || !value) return res.json({ success: false, message: 'Name, type and value are required' });
    const holiday = await RecurringHoliday.create({ name, type, value });
    res.json({ success: true, message: 'Recurring holiday added successfully', recurringHoliday: holiday });
  } catch (error) {
    console.error('Error adding recurring holiday:', error);
    res.json({ success: false, message: 'Failed to add recurring holiday' });
  }
};

export const removeRecurringHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await RecurringHoliday.findByIdAndDelete(id);
    if (!result) return res.json({ success: false, message: 'Recurring holiday not found' });
    res.json({ success: true, message: 'Recurring holiday removed successfully' });
  } catch (error) {
    console.error('Error removing recurring holiday:', error);
    res.json({ success: false, message: 'Failed to remove recurring holiday' });
  }
};

export const addSpecialWorkingDay = async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) return res.json({ success: false, message: 'Date is required' });
    const specialDay = await SpecialWorkingDay.create({ date });
    res.json({ success: true, message: 'Special working day added successfully', specialWorkingDay: specialDay });
  } catch (error) {
    console.error('Error adding special working day:', error);
    res.json({ success: false, message: 'Failed to add special working day' });
  }
};

export const removeSpecialWorkingDay = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await SpecialWorkingDay.findByIdAndDelete(id);
    if (!result) return res.json({ success: false, message: 'Special working day not found' });
    res.json({ success: true, message: 'Special working day removed successfully' });
  } catch (error) {
    console.error('Error removing special working day:', error);
    res.json({ success: false, message: 'Failed to remove special working day' });
  }
};

export const getPublicSlotSettings = async (req, res) => {
  try {
    const settings = await SlotSettings.findOne();
    if (!settings) return res.json({ success: false, message: 'Settings not configured' });

    const blockedDates = await BlockedDate.find();
    const recurringHolidays = await RecurringHoliday.find();
    const specialWorkingDays = await SpecialWorkingDay.find();

    res.json({
      success: true,
      ...settings.toObject(),
      blockedDates,
      recurringHolidays,
      specialWorkingDays,
    });
  } catch (error) {
    console.error('Public slot settings error:', error);
    res.json({ success: false, message: 'Failed to fetch slot settings' });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) return res.json({ success: false, message: 'Appointment not found' });
    if (appointment.cancelled) return res.json({ success: false, message: 'Appointment already cancelled' });
    if (appointment.isCompleted) return res.json({ success: false, message: 'Cannot cancel completed appointment' });

    appointment.cancelled = true;
    appointment.cancelledBy = 'admin';
    appointment.cancellationReason = 'Cancelled by salon admin.';
    await appointment.save();

    const { dateStr, timeStr } = formatDisplayDate(appointment.slotDate, appointment.slotTime);
    const stylistName = appointment.docData?.name || 'your stylist';
    const userName = appointment.userData?.name || 'The customer';

    await userModel.findByIdAndUpdate(appointment.userId, {
      $push: {
        notifications: {
          title: '❌ Appointment Cancelled by Salon',
          message: `Your appointment with ${stylistName} on ${dateStr} at ${timeStr} has been cancelled by the salon. Please contact us or rebook at your convenience.`,
          type: 'cancellation',
          read: false,
          link: '/my-appointments',
          createdAt: new Date(),
        },
      },
    });

    await AdminNotification.create({
      title: '🚫 Admin Cancelled Booking',
      message: `Admin cancelled ${userName}'s appointment with ${stylistName} on ${dateStr} at ${timeStr}.`,
      type: 'booking_cancelled',
      appointmentId: appointment._id,
    });

    res.json({ success: true, message: 'Appointment cancelled successfully' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const markAppointmentCompleted = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    if (!appointmentId) return res.json({ success: false, message: 'Appointment ID required' });

    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) return res.json({ success: false, message: 'Appointment not found' });
    if (appointment.cancelled) return res.json({ success: false, message: 'Cannot complete cancelled appointment' });

    appointment.isCompleted = true;
    await appointment.save();
    res.json({ success: true, message: 'Appointment marked as completed' });
  } catch (error) {
    console.error('Error marking appointment complete:', error);
    res.json({ success: false, message: error.message });
  }
};

export const markAppointmentIncomplete = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    if (!appointmentId) return res.json({ success: false, message: 'Appointment ID required' });

    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) return res.json({ success: false, message: 'Appointment not found' });

    appointment.isCompleted = false;
    await appointment.save();
    res.json({ success: true, message: 'Appointment marked as incomplete' });
  } catch (error) {
    console.error('Error marking appointment incomplete:', error);
    res.json({ success: false, message: error.message });
  }
};

export const getAdminNotifications = async (req, res) => {
  try {
    const notifications = await AdminNotification.find().sort({ createdAt: -1 }).limit(100);
    const unreadCount = await AdminNotification.countDocuments({ read: false });
    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error('getAdminNotifications error:', error);
    res.json({ success: false, message: error.message });
  }
};

export const markAdminNotificationsRead = async (req, res) => {
  try {
    const { notificationId } = req.body;
    if (notificationId) {
      await AdminNotification.findByIdAndUpdate(notificationId, { read: true });
    } else {
      await AdminNotification.updateMany({ read: false }, { $set: { read: true } });
    }
    res.json({ success: true, message: 'Admin notifications marked as read' });
  } catch (error) {
    console.error('markAdminNotificationsRead error:', error);
    res.json({ success: false, message: error.message });
  }
};

export { loginAdmin, appointmentsAdmin, addDoctor, allDoctors, adminDashboard };