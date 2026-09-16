// C:\Users\Siddharathan\Desktop\salon-booking-full-stack\backend\models\ServiceCategory.js
import mongoose from 'mongoose';

const serviceCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    imageUrl: {
      type: String,
      default: ""
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const ServiceCategory =
  mongoose.models.ServiceCategory ||
  mongoose.model('ServiceCategory', serviceCategorySchema);

export default ServiceCategory;
