import bcrypt from 'bcrypt';
import shopModel from '../models/shopModel.js';
import salonAdminModel from '../models/salonAdminModel.js';
import SalonRequest from '../models/salonRequestModel.js';
import { v2 as cloudinary } from 'cloudinary';

const slugify = (text) =>
  text.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const generateShopId = async () => {
  const shops = await shopModel.find({}, 'shopId').lean();
  const nums = shops.map((s) => parseInt((s.shopId || '').replace('SHOP', ''), 10)).filter((n) => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `SHOP${String(next).padStart(3, '0')}`;
};

// POST /api/salon-request — public user submission
export const submitSalonRequest = async (req, res) => {
  try {
    const { shopName, adminName, adminId, adminEmail, adminPassword, email, phone } = req.body;

    if (!shopName || !adminName || !adminId || !adminEmail || !adminPassword) {
      return res.json({ success: false, message: 'Salon name, admin name, admin ID, email and password are required.' });
    }
    if (adminPassword.length < 6) {
      return res.json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Prevent exact duplicates (same name + email + phone, still pending)
    const exactDup = await SalonRequest.findOne({
      status: 'pending',
      shopName: { $regex: `^${shopName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      email:    (email || '').toLowerCase().trim(),
      phone:    (phone || '').trim(),
    });
    if (exactDup) {
      return res.json({ success: false, message: 'A request with this salon name, email, and phone already exists.' });
    }

    // Similar-name warning (does not block submission)
    const similarShop = await shopModel.findOne({ shopName: { $regex: shopName.trim(), $options: 'i' } }).lean();
    const similarReq  = await SalonRequest.findOne({ shopName: { $regex: shopName.trim(), $options: 'i' }, status: 'pending' }).lean();
    const similarWarning = !!(similarShop || similarReq);

    // Optional logo upload
    let logoUrl = '';
    if (req.file) {
      const b64 = req.file.buffer.toString('base64');
      const result = await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${b64}`, {
        folder: 'salon_logos', resource_type: 'image',
      });
      logoUrl = result.secure_url;
    }

    const parseBool = (v) => v === 'true' || v === true;

    const request = await SalonRequest.create({
      shopName,
      address:     req.body.address || '',
      city:        req.body.city || '',
      state:       req.body.state || '',
      pincode:     req.body.pincode || '',
      phone:       (phone || '').trim(),
      email:       (email || '').toLowerCase().trim(),
      whatsapp:    req.body.whatsapp || '',
      businessName:req.body.businessName || '',
      gstNumber:   req.body.gstNumber || '',
      logo:        logoUrl,
      paymentIntegrationEnabled: parseBool(req.body.paymentIntegrationEnabled),
      upiName:         req.body.upiName || '',
      upiMobileNumber: req.body.upiMobileNumber || '',
      upiId:           req.body.upiId || '',
      bankName:        req.body.bankName || '',
      serviceBillingEnabled: parseBool(req.body.serviceBillingEnabled),
      productBillingEnabled: parseBool(req.body.productBillingEnabled),
      couponEnabled:         parseBool(req.body.couponEnabled),
      packageEnabled:        parseBool(req.body.packageEnabled),
      stylistPanelEnabled:   parseBool(req.body.stylistPanelEnabled),
      adminName,
      adminId:       adminId.toLowerCase().trim(),
      adminEmail:    adminEmail.toLowerCase().trim(),
      adminPassword,
      similarWarning,
    });

    res.json({
      success: true,
      message: 'Your salon request has been submitted successfully. We will review it and contact you.',
      requestId: request._id,
    });
  } catch (error) {
    console.error('submitSalonRequest error:', error);
    res.json({ success: false, message: error.message });
  }
};

// GET /api/super-admin/salon-requests
export const getSalonRequests = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) filter.shopName = { $regex: search, $options: 'i' };
    const requests = await SalonRequest.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, requests });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// GET /api/super-admin/salon-requests/:id
export const getSalonRequestById = async (req, res) => {
  try {
    const request = await SalonRequest.findById(req.params.id).lean();
    if (!request) return res.json({ success: false, message: 'Request not found.' });
    res.json({ success: true, request });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// PUT /api/super-admin/salon-requests/:id
export const updateSalonRequest = async (req, res) => {
  try {
    const request = await SalonRequest.findById(req.params.id);
    if (!request) return res.json({ success: false, message: 'Request not found.' });

    const allowed = [
      'shopName', 'address', 'city', 'state', 'pincode', 'phone', 'email', 'whatsapp',
      'businessName', 'gstNumber', 'upiName', 'upiMobileNumber', 'upiId', 'bankName',
      'adminName', 'adminId', 'adminEmail', 'adminPassword',
    ];
    const boolKeys = ['paymentIntegrationEnabled', 'serviceBillingEnabled', 'productBillingEnabled', 'couponEnabled', 'packageEnabled', 'stylistPanelEnabled'];
    boolKeys.forEach((key) => {
      if (req.body[key] !== undefined) request[key] = req.body[key] === 'true' || req.body[key] === true;
    });
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) request[key] = req.body[key];
    });

    await request.save();
    res.json({ success: true, message: 'Request updated.', request });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// POST /api/super-admin/salon-requests/:id/approve
export const approveSalonRequest = async (req, res) => {
  try {
    const request = await SalonRequest.findById(req.params.id);
    if (!request) return res.json({ success: false, message: 'Request not found.' });
    if (request.status !== 'pending') return res.json({ success: false, message: 'Request is not pending.' });

    const slug = slugify(request.shopName);

    const existingSlug = await shopModel.findOne({ slug }).lean();
    if (existingSlug) {
      return res.json({ success: false, message: `Slug "${slug}" is already taken. Edit the salon name before approving.` });
    }
    const existingAdmin = await salonAdminModel.findOne({ adminId: request.adminId }).lean();
    if (existingAdmin) {
      return res.json({ success: false, message: `Admin ID "${request.adminId}" is already taken. Edit before approving.` });
    }
    const existingEmail = await salonAdminModel.findOne({ email: request.adminEmail }).lean();
    if (existingEmail) {
      return res.json({ success: false, message: `Admin email "${request.adminEmail}" is already registered.` });
    }

    const shopId = await generateShopId();

    await shopModel.create({
      shopId, shopName: request.shopName, slug,
      logo: request.logo || '',
      address: request.address, city: request.city, state: request.state, pincode: request.pincode,
      phone: request.phone, email: request.email, whatsapp: request.whatsapp,
      businessName: request.businessName, gstNumber: request.gstNumber,
      paymentIntegrationEnabled: request.paymentIntegrationEnabled,
      upiName: request.upiName, upiMobileNumber: request.upiMobileNumber,
      upiId: request.upiId, bankName: request.bankName,
      serviceBillingEnabled: request.serviceBillingEnabled,
      productBillingEnabled: request.productBillingEnabled,
      couponEnabled: request.couponEnabled,
      packageEnabled: request.packageEnabled,
      stylistPanelEnabled: request.stylistPanelEnabled,
    });

    const hashedPassword = await bcrypt.hash(request.adminPassword, 10);
    await salonAdminModel.create({
      adminId: request.adminId, name: request.adminName,
      email: request.adminEmail, password: hashedPassword,
      shopId, role: 'salon_admin',
    });

    request.status = 'approved';
    request.approvedShopId = shopId;
    await request.save();

    res.json({
      success: true,
      message: 'Salon approved and created successfully.',
      salon: { shopId, shopName: request.shopName, slug, customerUrl: `/${slug}`, adminUrl: `/${slug}/admin` },
    });
  } catch (error) {
    console.error('approveSalonRequest error:', error);
    res.json({ success: false, message: error.message });
  }
};

// DELETE /api/super-admin/salon-requests/:id
export const deleteSalonRequest = async (req, res) => {
  try {
    const request = await SalonRequest.findByIdAndDelete(req.params.id);
    if (!request) return res.json({ success: false, message: 'Request not found.' });
    res.json({ success: true, message: 'Request deleted.' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
