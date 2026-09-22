// backend/routes/superAdminRoute.js
import express from 'express';
import authSuperAdmin from '../middleware/authSuperAdmin.js';
import upload from '../middleware/multer.js';
import {
  loginSuperAdmin,
  getSuperDashboard,
  getAllSalons,
  getSalonById,
  createSalon,
  updateSalon,
  deleteSalon,
  updateSalonStatus,
  getSalonStats,
} from '../controllers/superAdminController.js';

const superAdminRouter = express.Router();

// Auth
superAdminRouter.post('/login', loginSuperAdmin);

// Dashboard
superAdminRouter.get('/dashboard', authSuperAdmin, getSuperDashboard);

// Salons CRUD
superAdminRouter.get('/salons', authSuperAdmin, getAllSalons);
const salonUpload = upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'qrCode', maxCount: 1 }]);
superAdminRouter.post('/salons', authSuperAdmin, salonUpload, createSalon);
superAdminRouter.get('/salons/:shopId', authSuperAdmin, getSalonById);
superAdminRouter.put('/salons/:shopId', authSuperAdmin, salonUpload, updateSalon);
superAdminRouter.delete('/salons/:shopId', authSuperAdmin, deleteSalon);
superAdminRouter.patch('/salons/:shopId/status', authSuperAdmin, updateSalonStatus);
superAdminRouter.get('/salons/:shopId/stats', authSuperAdmin, getSalonStats);

export default superAdminRouter;
