import express from 'express';
import { 
  recordPayment, 
  deletePayment, 
  getPaymentHistory, 
  getPendingPayments, 
  getCustomerSummary 
} from '../controllers/PaymentController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../constants/roles.js';

const router = express.Router();

// The specific routes like /pending and /customer-summary need to be before /:id routes
router.get('/pending', authenticate, authorize([PERMISSIONS.INVOICES_READ]), getPendingPayments);
router.get('/customer-summary', authenticate, authorize([PERMISSIONS.INVOICES_READ, PERMISSIONS.CUSTOMERS_READ]), getCustomerSummary);

// General payment routes
router.post('/', authenticate, authorize([PERMISSIONS.INVOICES_MANAGE]), recordPayment);
router.delete('/:id', authenticate, authorize([PERMISSIONS.INVOICES_MANAGE]), deletePayment);

// Payment history for a specific invoice
router.get('/invoice/:invoiceId', authenticate, authorize([PERMISSIONS.INVOICES_READ]), getPaymentHistory);

export default router;
