import mongoose from 'mongoose';

const salonRequestSchema = new mongoose.Schema(
  {
    shopName:    { type: String, required: true },
    address:     { type: String, default: '' },
    city:        { type: String, default: '' },
    state:       { type: String, default: '' },
    pincode:     { type: String, default: '' },
    phone:       { type: String, default: '' },
    email:       { type: String, default: '' },
    whatsapp:    { type: String, default: '' },
    businessName:{ type: String, default: '' },
    gstNumber:   { type: String, default: '' },
    logo:        { type: String, default: '' },

    paymentIntegrationEnabled: { type: Boolean, default: false },
    upiName:          { type: String, default: '' },
    upiMobileNumber:  { type: String, default: '' },
    upiId:            { type: String, default: '' },
    bankName:         { type: String, default: '' },

    serviceBillingEnabled: { type: Boolean, default: false },
    productBillingEnabled: { type: Boolean, default: false },
    couponEnabled:         { type: Boolean, default: false },
    packageEnabled:        { type: Boolean, default: false },
    stylistPanelEnabled:   { type: Boolean, default: false },

    adminName:     { type: String, required: true },
    adminId:       { type: String, required: true },
    adminEmail:    { type: String, required: true },
    adminPassword: { type: String, required: true }, // stored plain, hashed on approval

    status:          { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    approvedShopId:  { type: String, default: '' },
    similarWarning:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('SalonRequest', salonRequestSchema);
