import mongoose from 'mongoose';

const whatsAppAccountSchema = new mongoose.Schema(
  {
    shopId: { type: String, required: true, unique: true, index: true },
    connectionState: {
      type: String,
      enum: ['DISCONNECTED', 'STARTING', 'AUTHENTICATING', 'QR_REQUIRED', 'CONNECTED', 'RECONNECTING', 'LOGGED_OUT', 'ERROR'],
      default: 'DISCONNECTED',
    },
    status: { type: String, enum: ['connected', 'disconnected', 'error'], default: 'disconnected' },
    qrDataUri: { type: String, default: null },
    qrGeneratedAt: { type: Date, default: null },
    lastConnectedAt: { type: Date, default: null },
    lastDisconnectedAt: { type: Date, default: null },
    lastHeartbeatAt: { type: Date, default: null },
    lastError: { type: String, default: null },
    workerInstanceId: { type: String, default: null },
    workerStartedAt: { type: Date, default: null },
    disconnectRequestedAt: { type: Date, default: null },
    connectRequestedAt: { type: Date, default: null },
    reconnectAttempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const WhatsAppAccount = mongoose.models.WhatsAppAccount || mongoose.model('WhatsAppAccount', whatsAppAccountSchema);
export default WhatsAppAccount;
