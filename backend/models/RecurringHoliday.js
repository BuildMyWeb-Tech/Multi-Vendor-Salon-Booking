import mongoose from 'mongoose';

const recurringHolidaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['weekly', 'monthly'],
    required: true
  },
  value: {
    type: String, // day of week or date of month
    required: true
  }
}, {
  timestamps: true
});

const RecurringHoliday = mongoose.model('RecurringHoliday', recurringHolidaySchema);

export default RecurringHoliday;
