// backend/routes/shopRoute.js
// Public routes — no auth required
import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import shopModel from '../models/shopModel.js';
import doctorModel from '../models/doctorModel.js';
import ServiceCategory from '../models/ServiceCategory.js';
import SlotSettings from '../models/SlotSettings.js';
import BlockedDate from '../models/BlockedDate.js';
import RecurringHoliday from '../models/RecurringHoliday.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const QR_SCRIPT = path.join(__dirname, '..', 'generate_qr.py');

const shopRouter = express.Router();

const generateUpiQr = (upiId, name, amount) =>
  new Promise((resolve, reject) => {
    const args = [QR_SCRIPT, upiId, name || '', amount ? String(amount) : ''];
    const tryCmd = (cmd) =>
      new Promise((res2, rej2) => {
        const proc = spawn(cmd, args);
        const chunks = [];
        proc.stdout.on('data', (d) => chunks.push(d));
        proc.stderr.on('data', (d) => console.error('[QR]', d.toString()));
        proc.on('close', (code) =>
          code === 0 ? res2(Buffer.concat(chunks)) : rej2(new Error('exit ' + code))
        );
        proc.on('error', rej2);
      });
    tryCmd('python')
      .then(resolve)
      .catch(() => tryCmd('python3').then(resolve).catch(reject));
  });

// GET /api/shop/:slug — resolve a slug to public shop info
// Only fields needed by the customer-facing UI are returned.
// Sensitive fields (upiId, bankName, gstNumber, adminId, adminEmail, billing flags, etc.)
// are intentionally excluded — use authenticated /api/salon-admin routes for those.
const PUBLIC_SHOP_FIELDS =
  'shopId shopName slug logo tagline phone whatsapp email address city state pincode ' +
  'workingHours status couponEnabled packageEnabled paymentIntegrationEnabled broadcastEnabled offlineBookingEnabled billingTaxPercent billingTaxName';

shopRouter.get('/:slug', async (req, res) => {
  try {
    const shop = await shopModel
      .findOne({ slug: req.params.slug })
      .select(PUBLIC_SHOP_FIELDS)
      .lean();
    if (!shop) {
      return res.json({ success: false, message: 'Salon not found.' });
    }
    if (shop.status !== 'active') {
      return res.json({
        success: false,
        suspended: true,
        message: shop.status === 'suspended'
          ? 'This salon is currently suspended.'
          : 'This salon is currently unavailable.',
        shopName: shop.shopName,
        shopId: shop.shopId,
      });
    }
    res.json({ success: true, shop });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/shop/:slug/doctors — public stylists list for a shop
shopRouter.get('/:slug/doctors', async (req, res) => {
  try {
    const shop = await shopModel.findOne({ slug: req.params.slug, status: 'active' });
    if (!shop) return res.json({ success: false, message: 'Salon not found.' });

    const doctors = await doctorModel
      .find({ shopId: shop.shopId, available: true })
      .select('-password -otp -otpExpiry -slots_booked');

    res.json({ success: true, doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/shop/:slug/services — public services list for a shop
shopRouter.get('/:slug/services', async (req, res) => {
  try {
    const shop = await shopModel.findOne({ slug: req.params.slug, status: 'active' });
    if (!shop) return res.json({ success: false, message: 'Salon not found.' });

    const services = await ServiceCategory.find({ shopId: shop.shopId, isActive: true });
    res.json({ success: true, services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/shop/:slug/slot-settings — public slot settings for booking
shopRouter.get('/:slug/slot-settings', async (req, res) => {
  try {
    const shop = await shopModel.findOne({ slug: req.params.slug, status: 'active' });
    if (!shop) return res.json({ success: false, message: 'Salon not found.' });

    let settings = await SlotSettings.findOne({ shopId: shop.shopId });
    if (!settings) {
      settings = { shopId: shop.shopId };
    }

    const blockedDates = await BlockedDate.find({ shopId: shop.shopId });
    const recurringHolidays = await RecurringHoliday.find({ shopId: shop.shopId });

    res.json({ success: true, settings, blockedDates, recurringHolidays });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/shop/:slug/payment-info — public UPI payment info for booking
// Returns only 3 customer-visible fields (no UPI ID or bank name)
shopRouter.get('/:slug/payment-info', async (req, res) => {
  try {
    const shop = await shopModel
      .findOne({ slug: req.params.slug, status: 'active' })
      .select('paymentIntegrationEnabled upiName upiMobileNumber upiQrCode upiId shopId shopName couponEnabled packageEnabled')
      .lean();
    if (!shop) return res.json({ success: false, message: 'Salon not found.' });

    res.json({
      success: true,
      paymentIntegrationEnabled: shop.paymentIntegrationEnabled || false,
      upiName: shop.upiName || '',
      upiMobileNumber: shop.upiMobileNumber || '',
      upiId: shop.upiId || '',
      upiQrCode: shop.upiQrCode || '',
      shopId: shop.shopId || '',
      shopName: shop.shopName,
      couponEnabled: shop.couponEnabled || false,
      packageEnabled: shop.packageEnabled || false,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/shop/:slug/upi-qr?amount=60 — Python-generated UPI QR PNG
shopRouter.get('/:slug/upi-qr', async (req, res) => {
  try {
    const shop = await shopModel
      .findOne({ slug: req.params.slug, status: 'active' })
      .select('upiId upiName')
      .lean();
    if (!shop || !shop.upiId) return res.status(404).json({ success: false, message: 'UPI not configured.' });
    const imgBuffer = await generateUpiQr(shop.upiId, shop.upiName || '', req.query.amount || '');
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'no-cache');
    res.send(imgBuffer);
  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({ success: false, message: 'QR generation failed.' });
  }
});

export default shopRouter;
