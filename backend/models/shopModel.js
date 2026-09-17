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
