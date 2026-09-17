import mongoose from 'mongoose';

const specialWorkingDaySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  startTime: { type: String, default: '' },
  endTime: { type: String, default: '' },
  reason: { type: String, default: '' },
  shopId: { type: String, default: 'SHOP001' }
}, {
  timestamps: true
});

const SpecialWorkingDay = mongoose.model('SpecialWorkingDay', specialWorkingDaySchema);

export default SpecialWorkingDay;
