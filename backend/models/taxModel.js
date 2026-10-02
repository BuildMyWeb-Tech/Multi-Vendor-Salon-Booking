import mongoose from 'mongoose';

const taxSchema = new mongoose.Schema(
  {
    shopId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    percent: { type: Number, required: true, min: 0, max: 100 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const taxModel = mongoose.models.tax || mongoose.model('tax', taxSchema);
export default taxModel;
