// backend/routes/stylistRoute.js
import express from 'express';
import authStylist from '../middleware/authStylist.js';
import {
  loginStylist,
  getStylistDashboard,
  getStylistAppointments,
  completeStylistAppointment,
  cancelStylistAppointment,
  getStylistProfile,
} from '../controllers/stylistController.js';

const stylistRouter = express.Router();

stylistRouter.post('/login', loginStylist);
stylistRouter.get('/dashboard', authStylist, getStylistDashboard);
stylistRouter.get('/appointments', authStylist, getStylistAppointments);
stylistRouter.put('/appointments/:id/complete', authStylist, completeStylistAppointment);
stylistRouter.put('/appointments/:id/cancel', authStylist, cancelStylistAppointment);
stylistRouter.get('/profile', authStylist, getStylistProfile);

export default stylistRouter;
