// backend/models/salonAdminModel.js
import mongoose from 'mongoose';

const salonAdminSchema = new mongoose.Schema(
  {
    adminId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    shopId: {
      type: String,
      required: true,
      ref: 'shop',
    },
    role: {
      type: String,
      enum: ['salon_admin'],
      default: 'salon_admin',
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);


const salonAdminModel =
  mongoose.models.salonAdmin || mongoose.model('salonAdmin', salonAdminSchema);
export default salonAdminModel;
