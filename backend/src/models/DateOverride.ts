import { Schema, model } from 'mongoose';

const DateOverrideSchema = new Schema({
  date: { type: String, required: true, unique: true, index: true }, // Format: YYYY-MM-DD
  isClosed: { type: Boolean, default: false },
  shifts: [{
    startTime: { type: String, required: true }, // "HH:MM" 24h format, e.g. "18:00"
    endTime: { type: String, required: true }    // "HH:MM" 24h format, e.g. "20:00"
  }]
}, {
  timestamps: true
});

export const DateOverride = model('DateOverride', DateOverrideSchema);
