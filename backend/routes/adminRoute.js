// C:\Users\Siddharathan\Desktop\salon-booking-full-stack\backend\routes\adminRoute.js
import express from 'express';
import {
  loginAdmin,
  appointmentsAdmin,
  cancelAppointment,
  addDoctor,
  allDoctors,
  adminDashboard,
  getSlotSettings,
  updateSlotSettings,
  addBlockedDate,
  removeBlockedDate,
  addRecurringHoliday,
  removeRecurringHoliday,
  addSpecialWorkingDay,
  removeSpecialWorkingDay,
  getPublicSlotSettings,
  markAppointmentCompleted,
  markAppointmentIncomplete,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  getStylistLeaveDates,
  updateStylistLeaveDates,
  getAdminNotifications,
  markAdminNotificationsRead,
} from '../controllers/adminController.js';

import {
  getAllServices,
  createService,
  getServiceById,
  updateService,
  deleteService,
} from '../controllers/serviceCategoryController.js';

import { changeAvailablity } from '../controllers/doctorController.js';
import authAdmin from '../middleware/authAdmin.js';
import upload from '../middleware/multer.js';

const adminRouter = express.Router();

/* ===================== AUTH ===================== */
adminRouter.post('/login', loginAdmin);

/* ===================== DOCTORS/STYLISTS ===================== */
adminRouter.post('/add-doctor', authAdmin, upload.single('image'), addDoctor);
adminRouter.get('/all-doctors', authAdmin, allDoctors);
adminRouter.get('/doctor/:id', authAdmin, getDoctorById);
adminRouter.put('/doctor/:id', authAdmin, upload.single('image'), updateDoctor);
adminRouter.delete('/doctor/:id', authAdmin, deleteDoctor);
adminRouter.post('/change-availability', authAdmin, changeAvailablity);

/* ===================== LEAVE DATES ===================== */
adminRouter.get('/doctor/:id/leave-dates', authAdmin, getStylistLeaveDates);
adminRouter.put('/doctor/:id/leave-dates', authAdmin, updateStylistLeaveDates);

/* ===================== APPOINTMENTS ===================== */
adminRouter.get('/appointments', authAdmin, appointmentsAdmin);
adminRouter.post('/cancel-appointment', authAdmin, cancelAppointment);
adminRouter.post('/mark-appointment-completed', authAdmin, markAppointmentCompleted);
adminRouter.post('/mark-appointment-incomplete', authAdmin, markAppointmentIncomplete);

/* ===================== DASHBOARD ===================== */
adminRouter.get('/dashboard', authAdmin, adminDashboard);

/* ===================== ADMIN NOTIFICATIONS ===================== */
// GET  — fetch all admin notifications (newest first, max 100)
adminRouter.get('/notifications', authAdmin, getAdminNotifications);
// POST — mark one ({ notificationId }) or all (empty body) as read
adminRouter.post('/notifications/read', authAdmin, markAdminNotificationsRead);

/* ===================== SLOT SETTINGS ===================== */
adminRouter.get('/slot-settings', authAdmin, getSlotSettings);
adminRouter.post('/slot-settings', authAdmin, updateSlotSettings);
adminRouter.post('/blocked-dates', authAdmin, addBlockedDate);
adminRouter.delete('/blocked-dates/:id', authAdmin, removeBlockedDate);
adminRouter.post('/recurring-holidays', authAdmin, addRecurringHoliday);
adminRouter.delete('/recurring-holidays/:id', authAdmin, removeRecurringHoliday);
adminRouter.post('/special-working-days', authAdmin, addSpecialWorkingDay);
adminRouter.delete('/special-working-days/:id', authAdmin, removeSpecialWorkingDay);
adminRouter.get('/public/slot-settings', getPublicSlotSettings);

/* ===================== SERVICE CATEGORIES ===================== */
adminRouter.get('/services', authAdmin, getAllServices);
adminRouter.post('/services', authAdmin, upload.single('image'), createService);
adminRouter.get('/services/:id', authAdmin, getServiceById);
adminRouter.put('/services/:id', authAdmin, upload.single('image'), updateService);
adminRouter.delete('/services/:id', authAdmin, deleteService);

export default adminRouter;
