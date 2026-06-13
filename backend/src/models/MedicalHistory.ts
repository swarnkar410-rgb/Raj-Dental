import { Schema, model } from 'mongoose';

const ToothStateSchema = new Schema({
  toothNumber: { type: Number, required: true },
  state: { type: String, enum: ['Healthy', 'Caries', 'Root Canal', 'Crown', 'Extraction', 'Implant', 'Braces'], default: 'Healthy' },
  notes: { type: String, default: '' }
}, { _id: false });

const MedicalHistorySchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, unique: true, index: true },
  teethState: {
    type: Map,
    of: ToothStateSchema,
    default: {}
  }
}, {
  timestamps: true
});

export const MedicalHistory = model('MedicalHistory', MedicalHistorySchema);
