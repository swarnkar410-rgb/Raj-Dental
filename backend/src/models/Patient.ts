import { Schema, model } from 'mongoose';

const PatientSchema = new Schema({
  patientId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, index: true },
  phone: { type: String, required: true, index: true },
  email: { type: String, default: '' },
  
  // Demographic details (nullable)
  gender: { type: String, enum: ['Male', 'Female', 'Other', null], default: null },
  dob: { type: Date, default: null },
  bloodGroup: { type: String, default: null },
  address: { type: String, default: null },
  occupation: { type: String, default: null },

  // Online booking request details (nullable)
  requestedTreatment: { type: String, default: null },
  requestedDate: { type: String, default: null },
  requestedTime: { type: String, default: null },

  // Medical metadata
  medicalHistory: [{ type: String }],
  allergies: [{ type: String }],
  emergencyContact: { type: String, default: null },

  // Registration states tracking
  registrationStatus: { 
    type: String, 
    enum: ['incomplete', 'completed'], 
    default: 'completed',
    index: true 
  },
  leadSource: { 
    type: String, 
    enum: ['website', 'walkin', 'phone', 'referral'], 
    default: 'walkin',
    index: true
  },
  notes: { type: String, default: '' },
  noShowCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

export const Patient = model('Patient', PatientSchema);
