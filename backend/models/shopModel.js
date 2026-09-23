// backend/models/shopModel.js
import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema(
  {
    shopId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    shopName: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    logo: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    businessName: { type: String, default: '' },
    gstNumber: { type: String, default: '' },

    // Payment / subscription
    setupAmount: { type: Number, default: 0 },
    subscriptionAmount: { type: Number, default: 0 },
    billingCycle: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly'],
      default: 'monthly',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'overdue'],
      default: 'pending',
    },

    // UPI Payment Integration (customer-facing, per-salon)
    paymentIntegrationEnabled: { type: Boolean, default: false },
    upiName: { type: String, default: '' },
    upiMobileNumber: { type: String, default: '' },
    upiId: { type: String, default: '' },
    bankName: { type: String, default: '' },
    upiQrCode: { type: String, default: '' },

    // POS / Billing feature toggles
    serviceBillingEnabled: { type: Boolean, default: false },
    productBillingEnabled: { type: Boolean, default: false },

    // Discount / Coupon & Package feature toggles
    couponEnabled: { type: Boolean, default: false },
    packageEnabled: { type: Boolean, default: false },

    // Stylist Panel toggle
    stylistPanelEnabled: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
  },
  { timestamps: true }
);


const shopModel = mongoose.models.shop || mongoose.model('shop', shopSchema);
export default shopModel;
