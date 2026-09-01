import express from 'express';
import { getNotifications, markRead } from '../controllers/NotificationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getNotifications);
router.post('/mark-read', markRead);

export default router;
