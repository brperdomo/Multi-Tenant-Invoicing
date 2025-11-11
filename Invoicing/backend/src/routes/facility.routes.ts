import { Router } from 'express';
import {
  createFacility,
  getAllFacilities,
  getFacilityById,
  updateFacility,
  deleteFacility,
} from '../controllers/facility.controller';
import { authenticate, authorizeRole } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, authorizeRole('organization'), createFacility);
router.get('/', authenticate, authorizeRole('organization'), getAllFacilities);
router.get('/:id', authenticate, getFacilityById);
router.put('/:id', authenticate, authorizeRole('organization'), updateFacility);
router.delete('/:id', authenticate, authorizeRole('organization'), deleteFacility);

export default router;
