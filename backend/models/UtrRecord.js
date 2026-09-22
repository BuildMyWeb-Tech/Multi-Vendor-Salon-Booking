import mongoose from 'mongoose';

const utrRecordSchema = new mongoose.Schema({
  utrNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
  shopId: { type: String, required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'appointment', default: null },
  amount: { type: Number, default: 0 },
  usedAt: { type: Date, default: Date.now },
});

const UtrRecord = mongoose.models.UtrRecord || mongoose.model('UtrRecord', utrRecordSchema);
export default UtrRecord;
