import { Schema, model } from 'mongoose';

const AuditLogSchema = new Schema({
  action: { type: String, required: true },
  details: { type: String, required: true },
  ipAddress: { type: String, default: '' }
}, {
  timestamps: true
});

export const AuditLog = model('AuditLog', AuditLogSchema);
