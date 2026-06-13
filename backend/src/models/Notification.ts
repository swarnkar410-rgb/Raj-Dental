import { Schema, model } from 'mongoose';

const NotificationSchema = new Schema({
  type: { type: String, enum: ['appointment_request', 'payment_received', 'system'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false, index: true },
  appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', default: null },
  appointmentRequestId: { type: Schema.Types.ObjectId, ref: 'AppointmentRequest', default: null },
  status: { 
    type: String, 
    enum: ['new', 'viewed', 'approved', 'rescheduled', 'rejected'], 
    default: 'new', 
    index: true 
  }
}, {
  timestamps: true
});

export const Notification = model('Notification', NotificationSchema);
