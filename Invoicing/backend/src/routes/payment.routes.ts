import { Router } from 'express';
import {
  uploadPaymentProof,
  getPaymentProofs,
  getAllPaymentProofs,
  deletePaymentProof,
} from '../controllers/payment.controller';
import { authenticate, authorizeRole } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.post('/', authenticate, authorizeRole('facility'), upload.single('payment_file'), uploadPaymentProof);
router.get('/invoice/:invoice_id', authenticate, getPaymentProofs);
router.get('/all', authenticate, authorizeRole('organization'), getAllPaymentProofs);
router.delete('/:id', authenticate, deletePaymentProof);

export default router;
