// backend/routes/salonAdminRoute.js
import express from 'express';
import authSalonAdmin from '../middleware/authSalonAdmin.js';
import upload from '../middleware/multer.js';
import {
  loginSalonAdmin,
  getShopInfo,
  updateBillingTax,
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
  createOfflineAppointment,
  getAdminAvailableSlots,
  getAdminAvailableDates,
  getTaxes, createTax, updateTax, deleteTax,
} from '../controllers/salonAdminController.js';
import {
  createProduct, getProducts, getProductById, updateProduct, deleteProduct,
  getInventory, addStock,
  createBill, getBills, getBillById, cancelBill,
} from '../controllers/billingController.js';
import {
  createCoupon, getCoupons, updateCoupon, deleteCoupon,
  createPackage, getPackages, updatePackage, deletePackage,
} from '../controllers/discountController.js';
import {
  getBroadcastContacts,
  createBroadcast,
  getBroadcastHistory,
  getBroadcastById,
} from '../controllers/broadcastController.js';

const salonAdminRouter = express.Router();

/* ──────────── PUBLIC ──────────── */
salonAdminRouter.get('/public-info/:slug', async (req, res) => {
  try {
    const { default: shopModel } = await import('../models/shopModel.js');
    const shop = await shopModel.findOne({ slug: req.params.slug, status: 'active' })
      .select('stylistPanelEnabled shopName').lean();
    if (!shop) return res.json({ success: false });
    res.json({ success: true, stylistPanelEnabled: shop.stylistPanelEnabled || false, shopName: shop.shopName });
  } catch { res.json({ success: false }); }
});

/* ──────────── AUTH ──────────── */
salonAdminRouter.post('/login', loginSalonAdmin);

/* ──────────── SHOP ──────────── */
salonAdminRouter.get('/shop-info', authSalonAdmin, getShopInfo);
salonAdminRouter.patch('/billing-tax', authSalonAdmin, updateBillingTax);

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

/* ──────────── OFFLINE / WALK-IN BOOKING ──────────── */
salonAdminRouter.post('/offline-appointment', authSalonAdmin, createOfflineAppointment);
salonAdminRouter.get('/available-slots', authSalonAdmin, getAdminAvailableSlots);
salonAdminRouter.get('/available-dates/:docId', authSalonAdmin, getAdminAvailableDates);

/* ──────────── TAXES ──────────── */
salonAdminRouter.get('/taxes', authSalonAdmin, getTaxes);
salonAdminRouter.post('/taxes', authSalonAdmin, createTax);
salonAdminRouter.put('/taxes/:id', authSalonAdmin, updateTax);
salonAdminRouter.delete('/taxes/:id', authSalonAdmin, deleteTax);

/* ──────────── BILLING — PRODUCTS ──────────── */
salonAdminRouter.post('/billing/products', authSalonAdmin, createProduct);
salonAdminRouter.get('/billing/products', authSalonAdmin, getProducts);
salonAdminRouter.get('/billing/products/:id', authSalonAdmin, getProductById);
salonAdminRouter.put('/billing/products/:id', authSalonAdmin, updateProduct);
salonAdminRouter.delete('/billing/products/:id', authSalonAdmin, deleteProduct);

/* ──────────── BILLING — INVENTORY ──────────── */
salonAdminRouter.get('/billing/inventory', authSalonAdmin, getInventory);
salonAdminRouter.post('/billing/inventory/add-stock', authSalonAdmin, addStock);

/* ──────────── BILLING — BILLS ──────────── */
salonAdminRouter.post('/billing/bills', authSalonAdmin, createBill);
salonAdminRouter.get('/billing/bills', authSalonAdmin, getBills);
salonAdminRouter.get('/billing/bills/:id', authSalonAdmin, getBillById);
salonAdminRouter.patch('/billing/bills/:id/cancel', authSalonAdmin, cancelBill);

/* ──────────── COUPONS ──────────── */
salonAdminRouter.post('/coupons', authSalonAdmin, createCoupon);
salonAdminRouter.get('/coupons', authSalonAdmin, getCoupons);
salonAdminRouter.put('/coupons/:id', authSalonAdmin, updateCoupon);
salonAdminRouter.delete('/coupons/:id', authSalonAdmin, deleteCoupon);

/* ──────────── PACKAGES ──────────── */
salonAdminRouter.post('/packages', authSalonAdmin, createPackage);
salonAdminRouter.get('/packages', authSalonAdmin, getPackages);
salonAdminRouter.put('/packages/:id', authSalonAdmin, updatePackage);
salonAdminRouter.delete('/packages/:id', authSalonAdmin, deletePackage);

/* ──────────── BROADCAST ──────────── */
salonAdminRouter.get('/broadcast/contacts', authSalonAdmin, getBroadcastContacts);
salonAdminRouter.get('/broadcast', authSalonAdmin, getBroadcastHistory);
salonAdminRouter.get('/broadcast/:id', authSalonAdmin, getBroadcastById);
salonAdminRouter.post('/broadcast', authSalonAdmin, upload.single('media'), createBroadcast);

export default salonAdminRouter;
