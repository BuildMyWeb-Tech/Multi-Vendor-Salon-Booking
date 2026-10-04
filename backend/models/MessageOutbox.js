import mongoose from 'mongoose';

const messageOutboxSchema = new mongoose.Schema(
  {
    shopId: { type: String, required: true, index: true },
    recipient: { type: String, required: true }, // phone number
    messageType: { type: String, enum: ['text', 'image', 'video', 'document', 'audio'], default: 'text' },
    payload: { type: mongoose.Schema.Types.Mixed, required: true }, // { text } or { url, mimetype, caption, filename }
    status: {
      type: String,
      enum: ['pending', 'processing', 'sent', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    scheduledAt: { type: Date, default: Date.now, index: true },
    lockedAt: { type: Date, default: null },
    lockedBy: { type: String, default: null },
    processedAt: { type: Date, default: null },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    error: { type: String, default: null },
    broadcastId: { type: mongoose.Schema.Types.ObjectId, ref: 'broadcast', default: null, index: true },
    broadcastRecipientIndex: { type: Number, default: null }, // index into broadcast.recipients array
    sentMessageId: { type: String, default: null }, // wamid from WhatsApp
  },
  { timestamps: true }
);

messageOutboxSchema.index({ shopId: 1, status: 1, scheduledAt: 1 });

const MessageOutbox = mongoose.models.MessageOutbox || mongoose.model('MessageOutbox', messageOutboxSchema);
export default MessageOutbox;
