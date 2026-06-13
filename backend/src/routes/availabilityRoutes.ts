import { Router } from 'express';
import {
  getAvailabilitySettings,
  saveRecurringSchedule,
  createLeave,
  deleteLeave,
  createBlockedSlot,
  deleteBlockedSlot,
  getSlotsForDate
} from '../controllers/availabilityController';
import { protect } from '../middleware/auth';

const router = Router();

// Protect all availability routes
router.use(protect);

router.get('/', getAvailabilitySettings);
router.post('/', saveRecurringSchedule);
router.post('/leave', createLeave);
router.delete('/leave/:id', deleteLeave);
router.post('/block', createBlockedSlot);
router.delete('/block/:id', deleteBlockedSlot);
router.get('/date', getSlotsForDate);

export default router;
