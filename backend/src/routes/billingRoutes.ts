import { Router } from 'express';
import {
  createTreatment,
  listPatientTreatments,
  createInvoice,
  listInvoices,
  getInvoiceById,
  addPayment
} from '../controllers/billingController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect); // protect all billing routes

router.post('/treatments', createTreatment);
router.get('/treatments/patient/:patientId', listPatientTreatments);
router.post('/invoices', createInvoice);
router.get('/invoices', listInvoices);
router.get('/invoices/:id', getInvoiceById);
router.post('/invoices/:id/payments', addPayment);

export default router;
