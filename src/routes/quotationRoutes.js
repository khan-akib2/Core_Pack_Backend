import express from 'express';
import {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  updateQuotationStatus,
  deleteQuotation
} from '../controllers/QuotationController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../constants/roles.js';
import { sendDocumentEmail, sendDocumentWhatsApp, downloadDocumentPdf } from '../controllers/DocumentDeliveryController.js';

const router = express.Router();

router.get('/', authenticate, authorize([PERMISSIONS.QUOTATIONS_READ]), getQuotations);
router.get('/:id', authenticate, authorize([PERMISSIONS.QUOTATIONS_READ]), getQuotationById);
router.post('/', authenticate, authorize([PERMISSIONS.QUOTATIONS_CREATE]), createQuotation);
router.put('/:id', authenticate, authorize([PERMISSIONS.QUOTATIONS_CREATE]), updateQuotation);
router.patch('/:id/status', authenticate, authorize([PERMISSIONS.QUOTATIONS_CONVERT]), updateQuotationStatus);
router.delete('/:id', authenticate, authorize([PERMISSIONS.QUOTATIONS_CREATE]), deleteQuotation);

// Email route
router.post('/:id/send-email/:type', authenticate, authorize([PERMISSIONS.QUOTATIONS_READ]), sendDocumentEmail);

// WhatsApp route
router.post('/:id/send-whatsapp/:type', authenticate, authorize([PERMISSIONS.QUOTATIONS_READ]), sendDocumentWhatsApp);

// Download PDF route
router.get('/:id/download/:type', authenticate, authorize([PERMISSIONS.QUOTATIONS_READ]), downloadDocumentPdf);

export default router;
