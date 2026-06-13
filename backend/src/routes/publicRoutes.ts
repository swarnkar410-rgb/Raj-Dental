import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { bookAppointmentPublic, listNotifications, markNotificationRead, initSession, checkPatientStatus } from '../controllers/publicController';
import { getSlotsForDate } from '../controllers/availabilityController';
import { reserveSlot, releaseSlot, getActiveReservation, associatePhoneToReservation } from '../controllers/slotReservationController';
import { protect } from '../middleware/auth';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Layer 3 — Dedicated slot reservation rate limiter
// Stricter than the global limiter: 10 requests per minute per IP.
// Protects against scripts, bots, and crawlers hammering the lock endpoint.
// ─────────────────────────────────────────────────────────────────────────────
const slotReserveLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 10,               // 10 lock attempts per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many reservation requests. Please wait a moment and try again.'
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Public routes (no auth)
// ─────────────────────────────────────────────────────────────────────────────

// Session initialisation — called on page load to issue the HttpOnly session cookie.
// Idempotent: returns immediately if cookie already present.
router.get('/session', initSession);

// Slot availability query
router.get('/available-slots', getSlotsForDate);

// Slot reservation — Layer 3 rate limiter applied here only
router.post('/slots/reserve', slotReserveLimiter, reserveSlot);

// Get active reservation recovery info
router.get('/slots/active-reservation', getActiveReservation);

// Associate phone to existing reservation
router.post('/slots/associate-phone', associatePhoneToReservation);

// Check patient pending requests and cooldown status
router.get('/patients/check-status', checkPatientStatus);

// Slot release (user navigates away or changes date)
router.post('/slots/release', releaseSlot);

// Appointment submission
router.post('/book-appointment', bookAppointmentPublic);

// ─────────────────────────────────────────────────────────────────────────────
// Doctor-facing routes (JWT protected)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/notifications', protect, listNotifications);
router.put('/notifications/:id/read', protect, markNotificationRead);

export default router;
