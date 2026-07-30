import express from 'express';
import {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotationStatus,
  deleteQuotation
} from '../controllers/QuotationController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getQuotations);
router.get('/:id', getQuotationById);
router.post('/', authorizeRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT), createQuotation);
router.patch('/:id/status', updateQuotationStatus);
router.delete('/:id', authorizeRoles(ROLES.ADMIN), deleteQuotation);

export default router;
