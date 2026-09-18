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
superAdminRouter.post('/salons', authSuperAdmin, upload.single('logo'), createSalon);
superAdminRouter.get('/salons/:shopId', authSuperAdmin, getSalonById);
superAdminRouter.put('/salons/:shopId', authSuperAdmin, upload.single('logo'), updateSalon);
superAdminRouter.delete('/salons/:shopId', authSuperAdmin, deleteSalon);
superAdminRouter.patch('/salons/:shopId/status', authSuperAdmin, updateSalonStatus);
superAdminRouter.get('/salons/:shopId/stats', authSuperAdmin, getSalonStats);

export default superAdminRouter;
