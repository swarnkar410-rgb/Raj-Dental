import { Router } from 'express';
import {
  listAppointments,
  listAppointmentRequests,
  getPendingRequestsCount,
  createAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
  deleteAppointment,
  getAppointmentReview,
  approveAppointmentReview,
  rescheduleAppointmentReview,
  rejectAppointmentReview,
  resendNotification
} from '../controllers/appointmentController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect); // protect all appointment routes

// ── Appointment request list & count ─────────────────────────────────────────
// NOTE: These static paths must come BEFORE /:id routes to avoid collision.
router.get('/requests', listAppointmentRequests);
router.get('/requests/pending-count', getPendingRequestsCount);

// ── Calendar appointments ─────────────────────────────────────────────────────
router.get('/', listAppointments);
router.post('/', createAppointment);

// ── Review drawer actions ─────────────────────────────────────────────────────
router.get('/:id/review', getAppointmentReview);
router.put('/:id/approve', approveAppointmentReview);
router.put('/:id/review-reschedule', rescheduleAppointmentReview);
router.put('/:id/reject', rejectAppointmentReview);
router.post('/:id/resend-notification', resendNotification);

// ── Calendar appointment management ──────────────────────────────────────────
router.put('/:id/status', updateAppointmentStatus);
router.put('/:id/reschedule', rescheduleAppointment);
router.delete('/:id', deleteAppointment);

export default router;
