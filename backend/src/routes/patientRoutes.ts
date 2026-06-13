import { Router } from 'express';
import {
  listPatients,
  createPatient,
  getPatientById,
  updatePatient,
  deletePatient,
  getDentalChart,
  updateDentalChart
} from '../controllers/patientController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect); // protect all patient routes

router.get('/', listPatients);
router.post('/', createPatient);
router.get('/:id', getPatientById);
router.put('/:id', updatePatient);
router.delete('/:id', deletePatient);
router.get('/:id/dental-chart', getDentalChart);
router.put('/:id/dental-chart', updateDentalChart);

export default router;
