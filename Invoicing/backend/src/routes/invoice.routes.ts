import { Router } from 'express';
import {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoiceStatus,
  deleteInvoice,
  getInvoiceStats,
} from '../controllers/invoice.controller';
import { authenticate, authorizeRole } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.post('/', authenticate, authorizeRole('organization'), upload.single('invoice_file'), createInvoice);
router.get('/', authenticate, getAllInvoices);
router.get('/stats', authenticate, authorizeRole('organization'), getInvoiceStats);
router.get('/:id', authenticate, getInvoiceById);
router.put('/:id/status', authenticate, authorizeRole('organization'), updateInvoiceStatus);
router.delete('/:id', authenticate, authorizeRole('organization'), deleteInvoice);

export default router;
