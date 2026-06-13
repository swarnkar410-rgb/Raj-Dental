import { Schema, model } from 'mongoose';

const AppointmentSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', default: null },
  patientName: { type: String, required: true },
  patientPhone: { type: String, required: true },
  patientEmail: { type: String, default: '' },
  treatmentType: { type: String, required: true },
  date: { type: String, required: true, index: true }, // Format: YYYY-MM-DD
  timeSlot: { type: String, required: true }, // e.g., "10:30 AM"
  doctorId: { type: String, default: 'default-doctor', index: true },
  status: { type: String, enum: ['BOOKED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'], default: 'BOOKED', index: true },
  duration: { type: Number, default: 30 }, // In minutes
  endTimeSlot: { type: String, default: '' }, // e.g. "11:00 AM"
  notes: { type: String, default: '' },
  cancellationReason: { type: String, default: '' }
}, {
  timestamps: true
});

export const Appointment = model('Appointment', AppointmentSchema);
