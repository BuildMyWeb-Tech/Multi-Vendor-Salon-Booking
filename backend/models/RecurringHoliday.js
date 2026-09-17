import mongoose from 'mongoose';

const recurringHolidaySchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['weekly', 'monthly'], default: 'weekly' },
  value: { type: String, default: '' },
  day: { type: String, default: '' },
  month: { type: String, default: '' },
  shopId: { type: String, default: 'SHOP001' }
}, {
  timestamps: true
});

const RecurringHoliday = mongoose.model('RecurringHoliday', recurringHolidaySchema);

export default RecurringHoliday;
