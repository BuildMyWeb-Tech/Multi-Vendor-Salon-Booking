import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema(
  {
    size: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, default: 0, min: 0 },
    barcode: { type: String, default: '' },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    shopId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: '', trim: true },
    variants: { type: [variantSchema], required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const productModel =
  mongoose.models.product || mongoose.model('product', productSchema);
export default productModel;
