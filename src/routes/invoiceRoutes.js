import express from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  recordPayment,
  updateInvoiceStatus,
  deleteInvoice
} from '../controllers/InvoiceController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../constants/roles.js';
import { sendDocumentEmail, sendDocumentWhatsApp } from '../controllers/DocumentDeliveryController.js';

const router = express.Router();

router.get('/', authenticate, authorize([PERMISSIONS.INVOICES_READ]), getInvoices);
router.get('/:id', authenticate, authorize([PERMISSIONS.INVOICES_READ]), getInvoiceById);
router.post('/', authenticate, authorize([PERMISSIONS.INVOICES_CREATE]), createInvoice);
router.put('/:id', authenticate, authorize([PERMISSIONS.INVOICES_EDIT]), updateInvoice);
router.post('/:id/payments', authenticate, authorize([PERMISSIONS.INVOICES_EDIT]), recordPayment);
router.patch('/:id/status', authenticate, authorize([PERMISSIONS.INVOICES_EDIT]), updateInvoiceStatus);
router.delete('/:id', authenticate, authorize([PERMISSIONS.INVOICES_DELETE]), deleteInvoice);

// Email route
router.post('/:id/send-email/:type', authenticate, authorize([PERMISSIONS.INVOICES_READ]), sendDocumentEmail);

// WhatsApp route
router.post('/:id/send-whatsapp/:type', authenticate, authorize([PERMISSIONS.INVOICES_READ]), sendDocumentWhatsApp);

export default router;
