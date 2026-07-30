import express from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  recordPayment,
  updateInvoiceStatus,
  deleteInvoice
} from '../controllers/InvoiceController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.post('/', authorizeRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT), createInvoice);
router.post('/:id/payments', authorizeRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT), recordPayment);
router.patch('/:id/status', updateInvoiceStatus);
router.delete('/:id', authorizeRoles(ROLES.ADMIN), deleteInvoice);

export default router;
