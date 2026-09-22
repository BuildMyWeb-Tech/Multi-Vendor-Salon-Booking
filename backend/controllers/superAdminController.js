// backend/controllers/superAdminController.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import shopModel from '../models/shopModel.js';
import salonAdminModel from '../models/salonAdminModel.js';
import appointmentModel from '../models/appointmentModel.js';
import doctorModel from '../models/doctorModel.js';
import userModel from '../models/userModel.js';
import { v2 as cloudinary } from 'cloudinary';

// ── Helper: generate sequential shopId (collision-safe) ──────────────────────
const generateShopId = async () => {
  const shops = await shopModel.find({}, 'shopId').lean();
  const nums = shops
    .map(s => parseInt((s.shopId || '').replace('SHOP', ''), 10))
    .filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `SHOP${String(next).padStart(3, '0')}`;
};

// ── Helper: slugify ───────────────────────────────────────────────────────────
const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

// ── POST /api/super-admin/login ───────────────────────────────────────────────
export const loginSuperAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email !== process.env.SUPER_ADMIN_EMAIL ||
      password !== process.env.SUPER_ADMIN_PASSWORD
    ) {
      return res.json({ success: false, message: 'Invalid Super Admin credentials.' });
    }

    const token = jwt.sign(
      { email, role: 'super_admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, token });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── GET /api/super-admin/dashboard ───────────────────────────────────────────
export const getSuperDashboard = async (req, res) => {
  try {
    const [totalShops, activeShops, suspendedShops, totalAppointments, totalUsers] =
      await Promise.all([
        shopModel.countDocuments(),
        shopModel.countDocuments({ status: 'active' }),
        shopModel.countDocuments({ status: 'suspended' }),
        appointmentModel.countDocuments(),
        userModel.countDocuments(),
      ]);

    const recentShops = await shopModel
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      dashData: {
        totalShops,
        activeShops,
        suspendedShops,
        totalAppointments,
        totalUsers,
        recentShops,
      },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── GET /api/super-admin/salons ───────────────────────────────────────────────
export const getAllSalons = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) filter.shopName = { $regex: search, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [salons, total] = await Promise.all([
      shopModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      shopModel.countDocuments(filter),
    ]);

    // Attach admin info
    const salonIds = salons.map((s) => s.shopId);
    const admins = await salonAdminModel
      .find({ shopId: { $in: salonIds } })
      .select('shopId name email adminId isActive')
      .lean();

    const adminMap = {};
    admins.forEach((a) => {
      adminMap[a.shopId] = a;
    });

    const enriched = salons.map((s) => ({ ...s, admin: adminMap[s.shopId] || null }));

    res.json({ success: true, salons: enriched, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── GET /api/super-admin/salons/:shopId ───────────────────────────────────────
export const getSalonById = async (req, res) => {
  try {
    const shop = await shopModel.findOne({ shopId: req.params.shopId }).lean();
    if (!shop) return res.json({ success: false, message: 'Salon not found.' });

    const admin = await salonAdminModel
      .findOne({ shopId: req.params.shopId })
      .select('-password')
      .lean();

    res.json({ success: true, salon: { ...shop, admin } });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── POST /api/super-admin/salons ─ Create Salon ───────────────────────────────
export const createSalon = async (req, res) => {
  try {
    const {
      shopName,
      slug: rawSlug,
      address,
      city,
      state,
      pincode,
      phone,
      email,
      whatsapp,
      businessName,
      gstNumber,
      setupAmount,
      subscriptionAmount,
      billingCycle,
      paymentStatus,
      paymentIntegrationEnabled,
      upiName,
      upiMobileNumber,
      upiId,
      bankName,
      adminName,
      adminId,
      adminEmail,
      password,
    } = req.body;

    if (!shopName || !adminId || !adminEmail || !password || !adminName) {
      return res.json({ success: false, message: 'shopName, adminName, adminId, adminEmail, and password are required.' });
    }

    // Generate slug
    const slug = rawSlug ? slugify(rawSlug) : slugify(shopName);

    // Check slug uniqueness
    const existingSlug = await shopModel.findOne({ slug });
    if (existingSlug) {
      return res.json({ success: false, message: `Slug "${slug}" is already taken. Please choose a different salon name.` });
    }

    // Check adminId uniqueness
    const existingAdmin = await salonAdminModel.findOne({ adminId: adminId.toLowerCase() });
    if (existingAdmin) {
      return res.json({ success: false, message: `Admin ID "${adminId}" is already taken.` });
    }

    // Check adminEmail uniqueness
    const existingEmail = await salonAdminModel.findOne({ email: adminEmail.toLowerCase() });
    if (existingEmail) {
      return res.json({ success: false, message: `Email "${adminEmail}" is already registered.` });
    }

    const shopId = await generateShopId();

    // Handle logo upload
    let logoUrl = '';
    const logoFile = req.files?.logo?.[0] || req.file;
    if (logoFile) {
      const b64 = logoFile.buffer.toString('base64');
      const dataUri = `data:${logoFile.mimetype};base64,${b64}`;
      const result = await cloudinary.uploader.upload(dataUri, { folder: 'salon_logos', resource_type: 'image' });
      logoUrl = result.secure_url;
    }

    // Handle QR code upload
    let qrCodeUrl = '';
    const qrFile = req.files?.qrCode?.[0];
    if (qrFile) {
      const b64 = qrFile.buffer.toString('base64');
      const dataUri = `data:${qrFile.mimetype};base64,${b64}`;
      const result = await cloudinary.uploader.upload(dataUri, { folder: 'salon_qr_codes', resource_type: 'image' });
      qrCodeUrl = result.secure_url;
    }

    // Create shop
    const shop = await shopModel.create({
      shopId,
      shopName,
      slug,
      logo: logoUrl,
      address,
      city,
      state,
      pincode,
      phone,
      email,
      whatsapp,
      businessName,
      gstNumber,
      setupAmount: parseFloat(setupAmount) || 0,
      subscriptionAmount: parseFloat(subscriptionAmount) || 0,
      billingCycle: billingCycle || 'monthly',
      paymentStatus: paymentStatus || 'pending',
      paymentIntegrationEnabled: paymentIntegrationEnabled === 'true' || paymentIntegrationEnabled === true,
      serviceBillingEnabled: req.body.serviceBillingEnabled === 'true' || req.body.serviceBillingEnabled === true,
      productBillingEnabled: req.body.productBillingEnabled === 'true' || req.body.productBillingEnabled === true,
      upiName: upiName || '',
      upiMobileNumber: upiMobileNumber || '',
      upiId: upiId || '',
      bankName: bankName || '',
      upiQrCode: qrCodeUrl,
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create salon admin
    const admin = await salonAdminModel.create({
      adminId: adminId.toLowerCase(),
      name: adminName,
      email: adminEmail.toLowerCase(),
      password: hashedPassword,
      shopId,
      role: 'salon_admin',
    });

    res.json({
      success: true,
      message: 'Salon created successfully.',
      salon: {
        shopId,
        shopName,
        slug,
        customerUrl: `/${slug}`,
        adminUrl: `/${slug}/admin`,
      },
      admin: {
        adminId: admin.adminId,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error('createSalon error:', error);
    res.json({ success: false, message: error.message });
  }
};

// ── PUT /api/super-admin/salons/:shopId ─ Update Salon ────────────────────────
export const updateSalon = async (req, res) => {
  try {
    const shop = await shopModel.findOne({ shopId: req.params.shopId });
    if (!shop) return res.json({ success: false, message: 'Salon not found.' });

    const allowed = [
      'shopName', 'address', 'city', 'state', 'pincode', 'phone',
      'email', 'whatsapp', 'businessName', 'gstNumber',
      'setupAmount', 'subscriptionAmount', 'billingCycle', 'paymentStatus',
      'upiName', 'upiMobileNumber', 'upiId', 'bankName',
    ];
    // Boolean feature toggles (arrive as strings from FormData)
    ['paymentIntegrationEnabled', 'serviceBillingEnabled', 'productBillingEnabled'].forEach((key) => {
      if (req.body[key] !== undefined) {
        shop[key] = req.body[key] === 'true' || req.body[key] === true;
      }
    });
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) shop[key] = req.body[key];
    });

    // Handle logo upload
    const logoFile = req.files?.logo?.[0] || (!req.files && req.file);
    if (logoFile) {
      const b64 = logoFile.buffer.toString('base64');
      const dataUri = `data:${logoFile.mimetype};base64,${b64}`;
      const result = await cloudinary.uploader.upload(dataUri, { folder: 'salon_logos', resource_type: 'image' });
      shop.logo = result.secure_url;
    }

    // Handle QR code upload
    const qrFile = req.files?.qrCode?.[0];
    if (qrFile) {
      const b64 = qrFile.buffer.toString('base64');
      const dataUri = `data:${qrFile.mimetype};base64,${b64}`;
      const result = await cloudinary.uploader.upload(dataUri, { folder: 'salon_qr_codes', resource_type: 'image' });
      shop.upiQrCode = result.secure_url;
    }

    await shop.save();
    res.json({ success: true, message: 'Salon updated.', salon: shop });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── DELETE /api/super-admin/salons/:shopId ────────────────────────────────────
export const deleteSalon = async (req, res) => {
  try {
    const { shopId } = req.params;
    const shop = await shopModel.findOneAndDelete({ shopId });
    if (!shop) return res.json({ success: false, message: 'Salon not found.' });
    res.json({ success: true, message: 'Salon deleted.' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── PATCH /api/super-admin/salons/:shopId/status ─ Change Status ──────────────
export const updateSalonStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.json({ success: false, message: 'Invalid status.' });
    }

    const shop = await shopModel.findOneAndUpdate(
      { shopId: req.params.shopId },
      { status },
      { new: true }
    );

    if (!shop) return res.json({ success: false, message: 'Salon not found.' });

    res.json({ success: true, message: `Salon ${status}.`, salon: shop });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── GET /api/super-admin/salons/:shopId/stats ─────────────────────────────────
export const getSalonStats = async (req, res) => {
  try {
    const { shopId } = req.params;
    const [appointments, stylists, customers] = await Promise.all([
      appointmentModel.countDocuments({ shopId }),
      doctorModel.countDocuments({ shopId }),
      userModel.countDocuments({ shopId }),
    ]);
    res.json({ success: true, stats: { appointments, stylists, customers } });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
