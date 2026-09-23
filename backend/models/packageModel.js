import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema(
  {
    shopId:          { type: String, required: true, index: true },
    name:            { type: String, required: true, trim: true },
    // Array of service _id strings that must all be selected together
    serviceIds:      [{ type: String, required: true }],
    discountPercent: { type: Number, required: true, min: 1, max: 100 },
    isActive:        { type: Boolean, default: true },
  },
  { timestamps: true }
);

const packageModel = mongoose.models.package || mongoose.model('package', packageSchema);
export default packageModel;
