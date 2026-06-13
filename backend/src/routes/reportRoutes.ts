import { Router } from 'express';
import { getDashboardStats, getReportsData } from '../controllers/reportController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect); // protect all report routes

router.get('/dashboard-stats', getDashboardStats);
router.get('/analytics-data', getReportsData);

export default router;
