import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    shopId:          { type: String, required: true, index: true },
    code:            { type: String, required: true, trim: true },
    discountPercent: { type: Number, required: true, min: 1, max: 100 },
    // null = lifetime; a date = expiry
    expiryDate:      { type: Date, default: null },
    isActive:        { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Code must be unique per salon
couponSchema.index({ shopId: 1, code: 1 }, { unique: true });

const couponModel = mongoose.models.coupon || mongoose.model('coupon', couponSchema);
export default couponModel;
