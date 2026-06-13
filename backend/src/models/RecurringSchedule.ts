import { Schema, model } from 'mongoose';

const RecurringScheduleSchema = new Schema({
  dayOfWeek: { 
    type: String, 
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], 
    required: true,
    unique: true 
  },
  isClosed: { type: Boolean, default: false },
  shifts: [{
    startTime: { type: String, required: true }, // "HH:MM" 24h format, e.g. "09:00"
    endTime: { type: String, required: true }    // "HH:MM" 24h format, e.g. "13:00"
  }]
}, {
  timestamps: true
});

export const RecurringSchedule = model('RecurringSchedule', RecurringScheduleSchema);
