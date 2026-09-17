// backend/middleware/authSalonAdmin.js
import jwt from 'jsonwebtoken';
import salonAdminModel from '../models/salonAdminModel.js';

/**
 * Middleware that authenticates a Salon Admin JWT and attaches
 * req.salonAdmin = { adminId, shopId, name, email, role }
 *
 * The token is read from the `satoken` header.
 */
const authSalonAdmin = async (req, res, next) => {
  try {
    const { satoken } = req.headers;

    if (!satoken) {
      return res.status(401).json({ success: false, message: 'Not authorized. Please login again.' });
    }

    const decoded = jwt.verify(satoken, process.env.JWT_SECRET);

    // decoded must contain shopId and role = salon_admin
    if (!decoded.shopId || decoded.role !== 'salon_admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Verify the admin still exists and is active
    const admin = await salonAdminModel.findOne({
      adminId: decoded.adminId,
      shopId: decoded.shopId,
      isActive: true,
    });

    if (!admin) {
      return res.status(403).json({ success: false, message: 'Admin account not found or deactivated.' });
    }

    req.salonAdmin = {
      adminId: decoded.adminId,
      shopId: decoded.shopId,
      name: admin.name,
      email: admin.email,
      role: 'salon_admin',
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token. Please login again.' });
  }
};

export default authSalonAdmin;
