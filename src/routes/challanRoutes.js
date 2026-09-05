
import express from 'express';
import {
  getChallans,
  getChallanById,
  createChallan,
  updateChallan,
  updateChallanStatus,
  deleteChallan
} from '../controllers/DeliveryChallanController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../constants/roles.js';
import { sendDocumentEmail, sendDocumentWhatsApp, downloadDocumentPdf } from '../controllers/DocumentDeliveryController.js';

const router = express.Router();

router.get('/', authenticate, authorize([PERMISSIONS.CHALLANS_READ]), getChallans);
router.get('/:id', authenticate, authorize([PERMISSIONS.CHALLANS_READ]), getChallanById);
router.post('/', authenticate, authorize([PERMISSIONS.CHALLANS_CREATE]), createChallan);
router.put('/:id', authenticate, authorize([PERMISSIONS.CHALLANS_EDIT]), updateChallan);
router.patch('/:id/status', authenticate, authorize([PERMISSIONS.CHALLANS_EDIT]), updateChallanStatus);
router.delete('/:id', authenticate, authorize([PERMISSIONS.CHALLANS_EDIT]), deleteChallan);

// Email route
router.post('/:id/send-email/:type', authenticate, authorize([PERMISSIONS.CHALLANS_READ]), sendDocumentEmail);

// WhatsApp route
router.post('/:id/send-whatsapp/:type', authenticate, authorize([PERMISSIONS.CHALLANS_READ]), sendDocumentWhatsApp);

// Download PDF route
router.get('/:id/download/:type', authenticate, authorize([PERMISSIONS.CHALLANS_READ]), downloadDocumentPdf);

export default router;
