// backend/routes/shopRoute.js
// Public routes — no auth required
import express from 'express';
import shopModel from '../models/shopModel.js';
import doctorModel from '../models/doctorModel.js';
import ServiceCategory from '../models/ServiceCategory.js';
import SlotSettings from '../models/SlotSettings.js';
import BlockedDate from '../models/BlockedDate.js';
import RecurringHoliday from '../models/RecurringHoliday.js';

const shopRouter = express.Router();

// GET /api/shop/:slug — resolve a slug to shop info
shopRouter.get('/:slug', async (req, res) => {
  try {
    const shop = await shopModel.findOne({ slug: req.params.slug }).lean();
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
      .select('paymentIntegrationEnabled upiName upiMobileNumber upiQrCode upiId shopId shopName')
      .lean();
    if (!shop) return res.json({ success: false, message: 'Salon not found.' });

    res.json({
      success: true,
      paymentIntegrationEnabled: shop.paymentIntegrationEnabled || false,
      upiName: shop.upiName || '',
      upiMobileNumber: shop.upiMobileNumber || '',
      upiQrCode: shop.upiQrCode || '',
      shopId: shop.shopId || '',
      shopName: shop.shopName,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default shopRouter;
