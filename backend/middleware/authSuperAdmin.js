// backend/middleware/authSuperAdmin.js
import jwt from 'jsonwebtoken';

/**
 * Middleware for Super Admin routes.
 * Token is read from `superadmintoken` header.
 */
const authSuperAdmin = (req, res, next) => {
  try {
    const { superadmintoken } = req.headers;

    if (!superadmintoken) {
      return res.status(401).json({ success: false, message: 'Not authorized. Please login again.' });
    }

    const decoded = jwt.verify(superadmintoken, process.env.JWT_SECRET);

    if (decoded.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Super Admin access required.' });
    }

    req.superAdmin = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token. Please login again.' });
  }
};

export default authSuperAdmin;
