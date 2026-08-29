import express from 'express';
import { getWhatsAppStatus, logoutWhatsApp, reconnectWhatsApp } from '../controllers/WhatsAppController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../constants/roles.js';

const router = express.Router();

// Only admin should manage the WhatsApp connection
router.get('/status', authenticate, authorize([PERMISSIONS.SETTINGS_MANAGE]), getWhatsAppStatus);
router.post('/logout', authenticate, authorize([PERMISSIONS.SETTINGS_MANAGE]), logoutWhatsApp);
router.post('/reconnect', authenticate, authorize([PERMISSIONS.SETTINGS_MANAGE]), reconnectWhatsApp);

export default router;
