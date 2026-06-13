import { Schema, model } from 'mongoose';

const BlockedSlotSchema = new Schema({
  date: { type: String, required: true, index: true }, // Format: YYYY-MM-DD
  startTime: { type: String, required: true }, // 24h format: e.g. "11:30"
  endTime: { type: String, required: true },   // 24h format: e.g. "13:00"
  reason: { type: String, required: true }
}, {
  timestamps: true
});

export const BlockedSlot = model('BlockedSlot', BlockedSlotSchema);
