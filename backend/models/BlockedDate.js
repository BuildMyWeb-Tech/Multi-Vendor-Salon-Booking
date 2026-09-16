import mongoose from 'mongoose';

const blockedDateSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const BlockedDate = mongoose.model('BlockedDate', blockedDateSchema);

export default BlockedDate;
