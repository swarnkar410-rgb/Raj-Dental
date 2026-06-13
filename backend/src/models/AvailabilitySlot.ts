import { Schema, model } from 'mongoose';

const AvailabilitySlotSchema = new Schema({
  date: { type: String, required: true, index: true }, // Format: YYYY-MM-DD
  timeSlot: { type: String, required: true }, // e.g. "10:30 AM" or "10:30"
  status: {
    type: String,
    enum: ['AVAILABLE', 'RESERVED', 'CONFIRMED', 'REQUESTED', 'BOOKED', 'COMPLETED', 'CANCELLED', 'REJECTED', 'BLOCKED', 'NO_SHOW'],
    default: 'AVAILABLE',
    index: true
  },
  // ------------------------------------------------------------------
  // Lock metadata
  // ------------------------------------------------------------------
  reservedAt: { type: Date, default: null },
  reservedBySession: { type: String, default: null, index: true }, // server-issued session id (from HttpOnly cookie)
  ipAddress: { type: String, default: null, index: true },         // Layer 2: IP abuse detection
  deviceId: { type: String, default: null, index: true },
  phone: { type: String, default: null, index: true },

  // expiresAt drives MongoDB's TTL index.
  // Set to (now + 10 minutes) when status = RESERVED.
  // Must be set to null when transitioning to CONFIRMED so the document is NOT auto-deleted.
  expiresAt: { type: Date, default: null },

  appointmentRequestId: { type: Schema.Types.ObjectId, ref: 'AppointmentRequest', default: null },
  appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', default: null }
}, {
  timestamps: true
});

// ------------------------------------------------------------------
// Compound unique index — prevents duplicate slot creation
// ------------------------------------------------------------------
AvailabilitySlotSchema.index({ date: 1, timeSlot: 1 }, { unique: true });

// ------------------------------------------------------------------
// TTL index — MongoDB automatically removes documents when expiresAt
// passes (expireAfterSeconds: 0 means delete at the exact expiresAt).
// Only affects documents where expiresAt is NOT null.
// ------------------------------------------------------------------
AvailabilitySlotSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AvailabilitySlot = model('AvailabilitySlot', AvailabilitySlotSchema);
