import mongoose from 'mongoose';

const recipientSchema = new mongoose.Schema({
  name:        { type: String, default: '' },
  phone:       { type: String, required: true },
  status:      { type: String, enum: ['pending', 'queued', 'sent', 'delivered', 'read', 'failed'], default: 'pending' },
  sentAt:      { type: Date },
  deliveredAt: { type: Date },
  readAt:      { type: Date },
  error:       { type: String, default: '' },
}, { _id: false });

const broadcastSchema = new mongoose.Schema(
  {
    shopId:       { type: String, required: true, index: true },
    message:      { type: String, default: '' },
    mediaUrl:     { type: String, default: '' },
    mediaType:    { type: String, enum: ['image', 'video', ''], default: '' },
    sendMode:     { type: String, enum: ['api', 'manual', 'qr'], default: 'manual' },
    status:       { type: String, enum: ['draft', 'queued', 'in_progress', 'completed', 'failed', 'paused', 'cancelled'], default: 'completed' },
    totalCount:   { type: Number, default: 0 },
    sentCount:    { type: Number, default: 0 },
    failedCount:  { type: Number, default: 0 },
    pendingCount: { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    readCount:    { type: Number, default: 0 },
    recipients:   [recipientSchema],
    sendIntervalMs: { type: Number, default: 1500 },
  },
  { timestamps: true }
);

const broadcastModel = mongoose.models.broadcast || mongoose.model('broadcast', broadcastSchema);
export default broadcastModel;
