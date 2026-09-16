import mongoose from 'mongoose';

const specialWorkingDaySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

const SpecialWorkingDay = mongoose.model('SpecialWorkingDay', specialWorkingDaySchema);

export default SpecialWorkingDay;
