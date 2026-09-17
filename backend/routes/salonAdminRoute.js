// backend/routes/salonAdminRoute.js
import express from 'express';
import authSalonAdmin from '../middleware/authSalonAdmin.js';
import upload from '../middleware/multer.js';
import {
  loginSalonAdmin,
  getShopInfo,
  getSalonDashboard,
  getSalonAppointments,
  cancelSalonAppointment,
  markSalonAppointmentCompleted,
  markSalonAppointmentIncomplete,
  getSalonDoctors,
  addSalonDoctor,
  getSalonDoctorById,
  updateSalonDoctor,
  deleteSalonDoctor,
  changeSalonDoctorAvailability,
  getSalonStylistLeaveDates,
  updateSalonStylistLeaveDates,
  getSalonSlotSettings,
  updateSalonSlotSettings,
  addSalonBlockedDate,
  removeSalonBlockedDate,
  addSalonRecurringHoliday,
  removeSalonRecurringHoliday,
  addSalonSpecialWorkingDay,
  removeSalonSpecialWorkingDay,
  getSalonServices,
  createSalonService,
  updateSalonService,
  deleteSalonService,
  getSalonAdminNotifications,
  markSalonAdminNotificationsRead,
} from '../controllers/salonAdminController.js';

const salonAdminRouter = express.Router();

/* ──────────── AUTH ──────────── */
salonAdminRouter.post('/login', loginSalonAdmin);

/* ──────────── SHOP ──────────── */
salonAdminRouter.get('/shop-info', authSalonAdmin, getShopInfo);

/* ──────────── DASHBOARD ──────────── */
salonAdminRouter.get('/dashboard', authSalonAdmin, getSalonDashboard);

/* ──────────── APPOINTMENTS ──────────── */
salonAdminRouter.get('/appointments', authSalonAdmin, getSalonAppointments);
salonAdminRouter.post('/cancel-appointment', authSalonAdmin, cancelSalonAppointment);
salonAdminRouter.post('/mark-appointment-completed', authSalonAdmin, markSalonAppointmentCompleted);
salonAdminRouter.post('/mark-appointment-incomplete', authSalonAdmin, markSalonAppointmentIncomplete);

/* ──────────── DOCTORS / STYLISTS ──────────── */
salonAdminRouter.get('/all-doctors', authSalonAdmin, getSalonDoctors);
salonAdminRouter.post('/add-doctor', authSalonAdmin, upload.single('image'), addSalonDoctor);
salonAdminRouter.get('/doctor/:id', authSalonAdmin, getSalonDoctorById);
salonAdminRouter.put('/doctor/:id', authSalonAdmin, upload.single('image'), updateSalonDoctor);
salonAdminRouter.delete('/doctor/:id', authSalonAdmin, deleteSalonDoctor);
salonAdminRouter.post('/change-availability', authSalonAdmin, changeSalonDoctorAvailability);
salonAdminRouter.get('/doctor/:id/leave-dates', authSalonAdmin, getSalonStylistLeaveDates);
salonAdminRouter.put('/doctor/:id/leave-dates', authSalonAdmin, updateSalonStylistLeaveDates);

/* ──────────── SLOT SETTINGS ──────────── */
salonAdminRouter.get('/slot-settings', authSalonAdmin, getSalonSlotSettings);
salonAdminRouter.post('/slot-settings', authSalonAdmin, updateSalonSlotSettings);
salonAdminRouter.post('/blocked-dates', authSalonAdmin, addSalonBlockedDate);
salonAdminRouter.delete('/blocked-dates/:id', authSalonAdmin, removeSalonBlockedDate);
salonAdminRouter.post('/recurring-holidays', authSalonAdmin, addSalonRecurringHoliday);
salonAdminRouter.delete('/recurring-holidays/:id', authSalonAdmin, removeSalonRecurringHoliday);
salonAdminRouter.post('/special-working-days', authSalonAdmin, addSalonSpecialWorkingDay);
salonAdminRouter.delete('/special-working-days/:id', authSalonAdmin, removeSalonSpecialWorkingDay);

/* ──────────── SERVICES ──────────── */
salonAdminRouter.get('/services', authSalonAdmin, getSalonServices);
salonAdminRouter.post('/services', authSalonAdmin, upload.single('image'), createSalonService);
salonAdminRouter.put('/services/:id', authSalonAdmin, upload.single('image'), updateSalonService);
salonAdminRouter.delete('/services/:id', authSalonAdmin, deleteSalonService);

/* ──────────── NOTIFICATIONS ──────────── */
salonAdminRouter.get('/notifications', authSalonAdmin, getSalonAdminNotifications);
salonAdminRouter.post('/notifications/read', authSalonAdmin, markSalonAdminNotificationsRead);

export default salonAdminRouter;
