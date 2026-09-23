import couponModel from '../models/couponModel.js';
import packageModel from '../models/packageModel.js';

// ── COUPONS ────────────────────────────────────────────────────────────────────

export const createCoupon = async (req, res) => {
  try {
    const shopId = req.salonAdmin.shopId;
    const { code, discountPercent, expiryDate } = req.body;

    if (!code?.trim()) return res.json({ success: false, message: 'Coupon code is required.' });
    if (!discountPercent || discountPercent < 1 || discountPercent > 100)
      return res.json({ success: false, message: 'Discount percent must be between 1 and 100.' });

    const coupon = await couponModel.create({
      shopId,
      code: code.trim().toUpperCase(),
      discountPercent: Number(discountPercent),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
    });
    res.json({ success: true, message: 'Coupon created.', coupon });
  } catch (error) {
    if (error.code === 11000) return res.json({ success: false, message: 'Coupon code already exists for this salon.' });
    res.json({ success: false, message: error.message });
  }
};

export const getCoupons = async (req, res) => {
  try {
    const shopId = req.salonAdmin.shopId;
    const coupons = await couponModel.find({ shopId }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, coupons });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const shopId = req.salonAdmin.shopId;
    const coupon = await couponModel.findOne({ _id: req.params.id, shopId });
    if (!coupon) return res.json({ success: false, message: 'Coupon not found.' });

    const { code, discountPercent, expiryDate, isActive } = req.body;
    if (code !== undefined)            coupon.code            = code.trim().toUpperCase();
    if (discountPercent !== undefined) coupon.discountPercent = Number(discountPercent);
    if (expiryDate !== undefined)      coupon.expiryDate      = expiryDate ? new Date(expiryDate) : null;
    if (isActive !== undefined)        coupon.isActive        = isActive;

    await coupon.save();
    res.json({ success: true, message: 'Coupon updated.', coupon });
  } catch (error) {
    if (error.code === 11000) return res.json({ success: false, message: 'Coupon code already exists.' });
    res.json({ success: false, message: error.message });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const shopId = req.salonAdmin.shopId;
    await couponModel.findOneAndDelete({ _id: req.params.id, shopId });
    res.json({ success: true, message: 'Coupon deleted.' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── COUPON VALIDATION (user-facing, by shop slug/id) ─────────────────────────

export const validateCoupon = async (req, res) => {
  try {
    const { shopId, code } = req.body;
    if (!shopId || !code) return res.json({ success: false, message: 'Shop and coupon code are required.' });

    const coupon = await couponModel.findOne({
      shopId,
      code: code.trim().toUpperCase(),
      isActive: true,
    }).lean();

    if (!coupon) return res.json({ success: false, message: 'Invalid coupon code.' });

    if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
      return res.json({ success: false, message: 'This coupon has expired.' });
    }

    res.json({ success: true, discountPercent: coupon.discountPercent });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── PACKAGES ───────────────────────────────────────────────────────────────────

export const createPackage = async (req, res) => {
  try {
    const shopId = req.salonAdmin.shopId;
    const { name, serviceIds, discountPercent } = req.body;

    if (!name?.trim()) return res.json({ success: false, message: 'Package name is required.' });
    if (!Array.isArray(serviceIds) || serviceIds.length < 2)
      return res.json({ success: false, message: 'A package must include at least 2 services.' });
    if (!discountPercent || discountPercent < 1 || discountPercent > 100)
      return res.json({ success: false, message: 'Discount percent must be between 1 and 100.' });

    const pkg = await packageModel.create({
      shopId,
      name: name.trim(),
      serviceIds: serviceIds.map(String),
      discountPercent: Number(discountPercent),
    });
    res.json({ success: true, message: 'Package created.', package: pkg });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getPackages = async (req, res) => {
  try {
    const shopId = req.salonAdmin.shopId;
    const packages = await packageModel.find({ shopId }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, packages });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const updatePackage = async (req, res) => {
  try {
    const shopId = req.salonAdmin.shopId;
    const pkg = await packageModel.findOne({ _id: req.params.id, shopId });
    if (!pkg) return res.json({ success: false, message: 'Package not found.' });

    const { name, serviceIds, discountPercent, isActive } = req.body;
    if (name !== undefined)            pkg.name            = name.trim();
    if (serviceIds !== undefined)      pkg.serviceIds      = serviceIds.map(String);
    if (discountPercent !== undefined) pkg.discountPercent = Number(discountPercent);
    if (isActive !== undefined)        pkg.isActive        = isActive;

    await pkg.save();
    res.json({ success: true, message: 'Package updated.', package: pkg });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const deletePackage = async (req, res) => {
  try {
    const shopId = req.salonAdmin.shopId;
    await packageModel.findOneAndDelete({ _id: req.params.id, shopId });
    res.json({ success: true, message: 'Package deleted.' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── PACKAGE MATCHING (user-facing) ───────────────────────────────────────────

export const matchPackage = async (req, res) => {
  try {
    const { shopId, serviceIds } = req.body;
    if (!shopId || !Array.isArray(serviceIds)) return res.json({ success: false, message: 'shopId and serviceIds required.' });

    const selected = serviceIds.map(String).sort();
    const packages = await packageModel.find({ shopId, isActive: true }).lean();

    for (const pkg of packages) {
      const pkgIds = pkg.serviceIds.map(String).sort();
      if (pkgIds.length === selected.length && pkgIds.every((id, i) => id === selected[i])) {
        return res.json({ success: true, matched: true, discountPercent: pkg.discountPercent });
      }
    }

    res.json({ success: true, matched: false });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
