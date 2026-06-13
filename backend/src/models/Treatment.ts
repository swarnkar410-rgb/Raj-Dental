import { Schema, model } from 'mongoose';

const TreatmentSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', default: null },
  title: { type: String, required: true },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['planned', 'in-progress', 'completed'], default: 'completed', index: true },
  teeth: [{ type: Number }], // 1-32
  cost: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  date: { type: String, required: true } // Format: YYYY-MM-DD
}, {
  timestamps: true
});

export const Treatment = model('Treatment', TreatmentSchema);
