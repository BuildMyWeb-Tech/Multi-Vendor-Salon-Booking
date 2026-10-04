import mongoose from 'mongoose';

const whatsAppSessionSchema = new mongoose.Schema(
  {
    shopId: { type: String, required: true, unique: true, index: true },
    encryptedState: { type: String, required: true },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

const WhatsAppSession = mongoose.models.WhatsAppSession || mongoose.model('WhatsAppSession', whatsAppSessionSchema);
export default WhatsAppSession;
