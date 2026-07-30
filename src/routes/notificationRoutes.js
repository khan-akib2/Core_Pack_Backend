import express from 'express';
import { getNotifications } from '../controllers/NotificationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getNotifications);

export default router;
