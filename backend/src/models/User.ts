import { Schema, model } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['doctor'], default: 'doctor' },
  refreshToken: { type: String, default: null }
}, {
  timestamps: true
});

export const User = model('User', UserSchema);
