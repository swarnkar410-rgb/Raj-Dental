import { Schema, model } from 'mongoose';

const DoctorLeaveSchema = new Schema({
  startDate: { type: String, required: true, index: true }, // Format: YYYY-MM-DD
  endDate: { type: String, required: true },   // Format: YYYY-MM-DD
  reason: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const DoctorLeave = model('DoctorLeave', DoctorLeaveSchema);
