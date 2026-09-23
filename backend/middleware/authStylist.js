// backend/middleware/authStylist.js
import jwt from 'jsonwebtoken';
import doctorModel from '../models/doctorModel.js';

const authStylist = async (req, res, next) => {
  try {
    const { stylisttoken } = req.headers;
    if (!stylisttoken) {
      return res.status(401).json({ success: false, message: 'Not authorized. Please login again.' });
    }
    const decoded = jwt.verify(stylisttoken, process.env.JWT_SECRET);
    if (!decoded.doctorId || decoded.role !== 'stylist') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    const doctor = await doctorModel.findById(decoded.doctorId).select('-password');
    if (!doctor) {
      return res.status(403).json({ success: false, message: 'Stylist account not found.' });
    }
    req.stylist = {
      doctorId: decoded.doctorId,
      shopId: doctor.shopId,
      name: doctor.name,
      email: doctor.email,
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token. Please login again.' });
  }
};

export default authStylist;
