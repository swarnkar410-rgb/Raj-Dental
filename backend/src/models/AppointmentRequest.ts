import { Schema, model } from 'mongoose';

const AppointmentRequestSchema = new Schema({
  patientName: { type: String, required: true },
  patientPhone: { type: String, required: true },
  patientEmail: { type: String, default: '' },
  treatmentType: { type: String, required: true },
  date: { type: String, required: true, index: true }, // YYYY-MM-DD
  timeSlot: { type: String, required: true }, // e.g. "10:30 AM"
  notes: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'rescheduled', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'RESCHEDULE_REQUESTED'],
    default: 'PENDING_REVIEW',
    index: true
  },
  notificationStatus: {
    type: String,
    enum: ['PENDING', 'SENT', 'FAILED'],
    default: 'PENDING',
    index: true
  },
  sentAt: { type: Date, default: null },
  notificationType: { type: String, default: 'whatsapp' },
  deliveryStatus: { type: String, default: '' }
}, {
  timestamps: true
});

export const AppointmentRequest = model('AppointmentRequest', AppointmentRequestSchema);
