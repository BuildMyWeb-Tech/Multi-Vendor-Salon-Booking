import mongoose from 'mongoose';

const billSchema = new mongoose.Schema(
  {
    shopId: { type: String, required: true, index: true },
    billNumber: { type: String, required: true },
    customerName: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'appointment',
      default: null,
    },
    services: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, default: 1 },
        subtotal: { type: Number, required: true },
      },
    ],
    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'product' },
        variantId: { type: mongoose.Schema.Types.ObjectId },
        productName: { type: String, required: true },
        variantSize: { type: String, default: '' },
        price: { type: Number, required: true },
        quantity: { type: Number, default: 1 },
        subtotal: { type: Number, required: true },
      },
    ],
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    discountType: { type: String, enum: ['flat', 'percent'], default: 'flat' },
    tax: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ['cash', 'upi'], default: 'cash' },
    utrNumber: { type: String, default: '' },
    status: {
      type: String,
      enum: ['completed', 'cancelled'],
      default: 'completed',
    },
  },
  { timestamps: true }
);

// Auto-generate billNumber before validation
billSchema.pre('validate', async function (next) {
  if (!this.billNumber) {
    const Bill = mongoose.models.bill || mongoose.model('bill', billSchema);
    const count = await Bill.countDocuments({ shopId: this.shopId });
    this.billNumber = `BILL-${this.shopId}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

const billModel =
  mongoose.models.bill || mongoose.model('bill', billSchema);
export default billModel;
