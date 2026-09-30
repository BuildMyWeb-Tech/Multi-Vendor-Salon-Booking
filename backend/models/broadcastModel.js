import mongoose from 'mongoose';

const recipientSchema = new mongoose.Schema({
  name:   { type: String, default: '' },
  phone:  { type: String, required: true },
  status: { type: String, enum: ['sent', 'failed', 'pending'], default: 'pending' },
  sentAt: { type: Date },
  error:  { type: String, default: '' },
}, { _id: false });

const broadcastSchema = new mongoose.Schema(
  {
    shopId:       { type: String, required: true, index: true },
    message:      { type: String, default: '' },
    mediaUrl:     { type: String, default: '' },
    mediaType:    { type: String, enum: ['image', 'video', ''], default: '' },
    sendMode:     { type: String, enum: ['api', 'manual'], default: 'manual' },
    status:       { type: String, enum: ['draft', 'in_progress', 'completed', 'failed'], default: 'completed' },
    totalCount:   { type: Number, default: 0 },
    sentCount:    { type: Number, default: 0 },
    failedCount:  { type: Number, default: 0 },
    pendingCount: { type: Number, default: 0 },
    recipients:   [recipientSchema],
  },
  { timestamps: true }
);

const broadcastModel = mongoose.models.broadcast || mongoose.model('broadcast', broadcastSchema);
export default broadcastModel;
