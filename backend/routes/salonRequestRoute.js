// backend/routes/salonRequestRoute.js
// Public route: anyone can submit a salon request
import express from 'express';
import upload from '../middleware/multer.js';
import { submitSalonRequest } from '../controllers/salonRequestController.js';

const salonRequestRouter = express.Router();

salonRequestRouter.post('/', upload.single('logo'), submitSalonRequest);

export default salonRequestRouter;
